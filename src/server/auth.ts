import express from "express";
import passport from "passport";
import { Strategy } from "passport-local";
import fs from "node:fs/promises";
import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { invariant } from "../Error";
import { SESSION_COOKIE_NAME, MAX_SESSION_DURATION } from "../constants";
import { Request, Response } from "express-serve-static-core";

async function loadProfiles() {
  // TODO create file if it doesn't exist
  const string = await fs.readFile("data/auth", "utf8");
  return JSON.parse(string || "[]");
}

function saveProfiles(profiles: any) {
  return fs.writeFile("data/auth", JSON.stringify(profiles), "utf8");
}

function findProfileByUsername(profiles: any, username: string) {
  return profiles.find((row: any) => row.username === username);
}

function getHtmlFlash(message: string, status: "ok" | "info" | "warn" | "bad") {
  return `<dialog open class="static flash bg ${status}">${message}<button onclick="parentElement.close()">x</button></dialog>`;
}

/* Configure password authentication strategy.
 *
 * The `LocalStrategy` authenticates users by verifying a username and password.
 * The strategy parses the username and password from the request and calls the
 * `verify` function.
 *
 * The `verify` function queries the database for the user record and verifies
 * the password by hashing the password supplied by the user and comparing it to
 * the hashed password stored in the database.  If the comparison succeeds, the
 * user is authenticated; otherwise, not.
 */
passport.use(
  new Strategy(async (username, password, cb) => {
    const profiles = await loadProfiles();
    const profile = findProfileByUsername(profiles, username);
    if (!profile) {
      return cb(null, false);
    }
    invariant(
      "salt" in profile && "hashedPassword" in profile,
      "Invalid user record"
    );
    pbkdf2(
      password,
      profile.salt,
      310000,
      32,
      "sha256",
      function (err, hashedPassword) {
        if (err) {
          return cb(err);
        }
        const correctPwBuffer = Buffer.from(profile.hashedPassword, "base64");
        if (!timingSafeEqual(correctPwBuffer, hashedPassword)) {
          return cb(null, false);
        }
        return cb(null, profile);
      }
    );
  })
);

/* Configure session management.
 *
 * When a login session is established, information about the user will be
 * stored in the session.  This information is supplied by the `serializeUser`
 * function, which is yielding the user ID and username.
 *
 * As the user interacts with the app, subsequent requests will be authenticated
 * by verifying the session.  The same user information that was serialized at
 * session establishment will be restored when the session is authenticated by
 * the `deserializeUser` function.
 *
 * Since every request to the app needs the user ID and username, in order to
 * fetch todo records and render the user element in the navigation bar, that
 * information is stored in the session.
 */
passport.serializeUser(((user: passport.Profile, cb: (err: any, result?: {id: string, username?: string}) => void) => {
  process.nextTick(function () {
    cb(null, { id: user.id, username: user.username });
  });
}) as any);

passport.deserializeUser((user: Express.User, cb) => {
  process.nextTick(function () {
    return cb(null, user);
  });
});

const router = express.Router();

router.use(express.urlencoded({ extended: false }) as any);

/** POST /login/password
 *
 * This route authenticates the user by verifying a username and password.
 *
 * A username and password are submitted to this route via an HTML form, which
 * was rendered by the `GET /login` route.  The username and password is
 * authenticated using the `local` strategy.  The strategy will parse the
 * username and password from the request and call the `verify` function.
 *
 * Upon successful authentication, a login session will be established.  As the
 * user interacts with the app, by clicking links and submitting forms, the
 * subsequent requests will be authenticated by verifying the session.
 *
 * When authentication fails, the user will be re-prompted to login and shown
 * a message informing them of what went wrong.
 *
 * @openapi
 * /login/password:
 *   post:
 *     summary: Log in using a username and password
 *     requestBody:
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: number
 *     responses:
 *       "302":
 *         description: Redirect.
 */
router.post("/login/password", (req, res, next) =>
  passport.authenticate("local", function (err: boolean, user: Express.User) {
    const correctlyTypedUser = user as { id: string; username?: string };
    if (err) {
      console.log("authentiate error", err);
      return next!(err);
    }
    if (!user) {
      return res.status(401).send(getHtmlFlash("Incorrect creds", "bad"));
    }
    req.logIn(user, function (err) {
      if (err) {
        console.log("login error", err);
        return next!(err);
      }
      return res
        .status(200)
        .cookie(
          SESSION_COOKIE_NAME,
          JSON.stringify({ username: correctlyTypedUser.username, id: correctlyTypedUser.id }),
          { maxAge: MAX_SESSION_DURATION }
        )
        .send(getHtmlFlash("Login successful", "ok"));
    });
  })(req, res, next)
);

/* POST /logout
 *
 * This route logs the user out.
 */
router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next!(err);
    }
    res.status(200).send(getHtmlFlash("Successfully signed out", "ok"));
  });
});

/** The password is hashed and a new user record is inserted into the database
 */
export function signUp(username: string, password: string) {
  invariant(username.length > 0, "Username must not be empty");
  invariant(password.length > 0, "Password must not be empty");
  var salt = randomBytes(16).toString("base64");
  pbkdf2(password, salt, 310000, 32, "sha256", async (err, hashedPassword) => {
    if (err) {
      throw err;
    }
    const profile = {
      username,
      salt,
      hashedPassword: hashedPassword.toString("base64")
    };
    const profiles = await loadProfiles();
    profiles.push(profile);
    await saveProfiles(profiles);
  });
}

export function getAuthMiddleware(
  requiresAuth: (req: Express.Request & Request) => boolean
) {
  return (
    req: Express.Request & Request,
    res: Response,
    next: express.NextFunction | undefined
  ) => {
    if (req.isAuthenticated() || !requiresAuth(req)) {
      return next!();
    }
    res.status(401).send(getHtmlFlash("Unauthorized", "bad"));
  };
}

export const LoginMiddleware = router;
