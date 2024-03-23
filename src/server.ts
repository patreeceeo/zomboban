import express from "express";
import ViteExpress from "vite-express";
import { NetworkedEntityServer } from "./NetworkedEntityServer";
import { PortableState } from "./state";
import { ENV } from "./constants";

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

const entityServer = new NetworkedEntityServer();
const state = new PortableState();

function withProductionGaurd(routeFn: (req: any, res: any) => Promise<void>) {
  return async (req: any, res: any) => {
    if (ENV === "production") {
      res.status(403).send("Not allowed in production");
      return;
    }
    routeFn(req, res);
  };
}

router.get("/api/entity", async (_req, res) => {
  res.send(entityServer.getList());
});

router.get("/api/entity/:id", async (req, res) => {
  const entity = entityServer.getEntity(Number(req.params.id));
  res.send(entity);
});

router.post(
  "/api/entity",
  withProductionGaurd(async (req, res) => {
    const entityData = req.body;
    const entity = entityServer.postEntity(entityData, state);
    res.send(entity);
  })
);

router.put(
  "/api/entity/:id",
  withProductionGaurd(async (req, res) => {
    const entityData = req.body;
    const entity = entityServer.putEntity(entityData, req.params.id);
    res.send(entity);
  })
);

router.delete(
  "/api/entity/:id",
  withProductionGaurd(async (req, res) => {
    entityServer.deleteEntity(req.params.id, state);
    res.send(true);
  })
);

app.use(express.text() as any, router);
