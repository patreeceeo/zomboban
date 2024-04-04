import express from "express";
import ViteExpress from "vite-express";
import { ENV } from "../constants";
import { ExpressEntityServer } from "./entity";
import { AuthMiddleware } from "./auth";
import session from "express-session";
import passport from "passport";
import SessionFileStore from "session-file-store";
import cookieParser from "cookie-parser";

const SessionStore = SessionFileStore(session);
const sessionStore = new SessionStore({ path: "./data/sessions", retries: 0 });

const PORT = 3000;

const app = express();
const router = express.Router();

const callback = () => console.log(`Listening on :${PORT}`);

const server =
  ENV === "production"
    ? app.listen(PORT, callback)
    : ViteExpress.listen(app, PORT, callback);

if (ENV === "production") {
  app.use(express.static("dist") as any);
}

export async function dispose() {
  server.close();
  return new Promise((resolve) => {
    server.on("vite:close", resolve);
  });
}

const entityServer = new ExpressEntityServer();

router.get("/api/entity", entityServer.index);

router.get("/api/entity/:id", entityServer.get);

router.post("/api/entity", entityServer.post);

router.put("/api/entity/:id", entityServer.put);

router.delete("/api/entity/:id", entityServer.delete);

app.use(
  session({
    secret: "scuse me while I kiss the sky",
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    store: sessionStore
  }) as any
);
app.use(passport.authenticate("session"));

if (ENV === "development") {
  // log requests
  app.use(function (req, res, next) {
    void res;
    console.log(req.method, req.url);
    next!();
  });
}

app.use(function (req, res, next) {
  var msgs = (req.session as any).messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !!msgs.length;
  (req.session as any).messages = [];
  next!();
});

app.use(express.text() as any, router);
app.use("/", AuthMiddleware);
app.use(cookieParser() as any);

await entityServer.load();
