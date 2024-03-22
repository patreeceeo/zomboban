import express from "express";
import ViteExpress from "vite-express";
import { NetworkedEntityServer } from "./NetworkedEntityServer";
import { PortableState } from "./state";

const PORT = 3000;

const app = express();
const router = express.Router();

const server = ViteExpress.listen(app, PORT, () =>
  console.log(`Listening on :${PORT}`)
);

export async function dispose() {
  server.close();
  return new Promise((resolve) => {
    server.on("vite:close", resolve);
  });
}

const entityServer = new NetworkedEntityServer();
const state = new PortableState();

router.get("/api/entity", async (_req, res) => {
  res.send(entityServer.getList());
});

router.get("/api/entity/:id", async (req, res) => {
  const entity = entityServer.getEntity(Number(req.params.id));
  res.send(entity);
});

router.post("/api/entity", async (req, res) => {
  const entityData = req.body;
  const entity = entityServer.postEntity(entityData, state);
  res.send(entity);
});

router.put("/api/entity/:id", async (req, res) => {
  const entityData = req.body;
  const entity = entityServer.putEntity(entityData, req.params.id);
  res.send(entity);
});

router.delete("/api/entity/:id", async (req, res) => {
  entityServer.deleteEntity(req.params.id, state);
  res.send(true);
});

app.use(express.text() as any, router);
