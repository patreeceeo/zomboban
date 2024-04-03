import express from "express";
import ViteExpress from "vite-express";
import { ENV } from "../constants";
import { ExpressEntityServer } from "./entity";

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
app.use(express.text() as any, router);

await entityServer.load();
