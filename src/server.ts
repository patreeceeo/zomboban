import express from "express";
import ViteExpress from "vite-express";
import { NetworkedEntityServer } from "./NetworkedEntityServer";
import { PortableState } from "./state";
import { ENV } from "./constants";
import fs from "node:fs/promises";
import { throttle } from "./util";
import { ObservableSet } from "./Observable";
import { IEntity } from "./EntityManager";
import { deserializeEntity, serializeEntity } from "./functions/Networking";

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

const saveState = throttle((entitySet: ObservableSet<IEntity>) => {
  const serialized = [];
  for (const entity of entitySet) {
    serialized.push(serializeEntity(entity));
  }
  // NOTE: double stringifying
  const jsonString = JSON.stringify(serialized);
  fs.writeFile("data/default", jsonString, "utf8");
}, 1000);

async function loadState() {
  try {
    const jsonString = await fs.readFile("data/default", "utf8");
    const serialized = JSON.parse(jsonString);
    for (const entityData of serialized) {
      const entity = state.addEntity();
      deserializeEntity(entity, entityData);
      entityServer.addEntity(entity as any);
    }
  } catch (e) {
    console.error(e);
  }
}

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
    saveState(state.entities);
  })
);

router.put(
  "/api/entity/:id",
  withProductionGaurd(async (req, res) => {
    const entityData = req.body;
    const entity = entityServer.putEntity(entityData, req.params.id);
    res.send(entity);
    saveState(state.entities);
  })
);

router.delete(
  "/api/entity/:id",
  withProductionGaurd(async (req, res) => {
    entityServer.deleteEntity(req.params.id, state);
    res.send(true);
    saveState(state.entities);
  })
);

app.use(express.text() as any, router);
await loadState();
