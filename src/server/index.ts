import express from "express";
import { BASE_URL, MAX_SESSION_DURATION } from "../constants";
import { ExpressEntityServer } from "./entity";
import { LoginMiddleware, getAuthMiddleware } from "./auth";
import session from "express-session";
import passport from "passport";
import SessionFileStore from "session-file-store";
import cookieParser from "cookie-parser";
import { pathToRegexp } from "path-to-regexp";
import compression from "compression";
import { entitiesApiRoute, entityApiRoute } from "../routes";

console.log(`Server running in ${process.env.NODE_ENV} mode`);

const SessionStore = SessionFileStore(session);
const sessionStore = new SessionStore({
  path: "./data/sessions",
  retries: 0,
  ttl: MAX_SESSION_DURATION
});

const PORT = process.env.SERVER_PORT;

const app = express();
const router = express.Router();

const callback = () => console.log(`Listening on :${PORT}`);

const isProduction = process.env.NODE_ENV === "production";

const server = app.listen(PORT, callback);

app.use(compression() as any);

if (isProduction) {
  app.use(express.static("dist") as any);
} else {
  app.use(express.static("public") as any);
}

export async function dispose() {
  server.close();
  return new Promise((resolve) => {
    server.on("vite:close", resolve);
  });
}

// Login and session management
//
app.use(
  session({
    secret: "scuse me while I kiss the sky",
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    store: sessionStore
  }) as any
);
app.use(passport.authenticate("session"));
// TODO why is this here twice?
app.use(`/api`, LoginMiddleware);
app.use(`${BASE_URL}/api`, LoginMiddleware);

app.use(cookieParser() as any);
app.use(function (req, res, next) {
  var msgs = (req.session as any).messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !!msgs.length;
  (req.session as any).messages = [];
  next!();
});

const authenticatedRoutes = ["/api/entity", "/api/entity/:id"];
const authenticatedMethods = ["POST", "PUT", "DELETE"];
const authMiddleware = getAuthMiddleware((req) => {
  const hasMethods = authenticatedMethods.includes(req.method);
  const hasRoutes = authenticatedRoutes.some((route) => {
    const re = pathToRegexp(route);
    return re.regexp.exec(req.url);
  });
  return hasMethods && hasRoutes;
});
app.use(authMiddleware);
app.use(BASE_URL, authMiddleware);

// Entity management
//
const entityServer = new ExpressEntityServer();

router.get(entitiesApiRoute.path, entityServer.index);

router.post(entitiesApiRoute.path, entityServer.post);

router.put(entityApiRoute.path, entityServer.put);

router.delete(entityApiRoute.path, entityServer.delete);

// if (ENV === "development") {
// log requests
app.use(function (req, res, next) {
  void res;
  console.log(req.method, req.url);
  next!();
});
// }

app.use(express.text() as any, router);
app.use(BASE_URL, express.text() as any, router);

entityServer.load();
