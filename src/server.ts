import express from "express";
import ViteExpress from "vite-express";
import fs from "node:fs/promises";
import {
  deserializeAllEntityComponentData,
  deserializeEntityData,
  serializeAllEntityComponentData,
  serializeEntityData
} from "./functions/Server";
import { stateOld } from "./state";
import { GuidComponent } from "./components";

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

const DATA_PATH = "./data/default";

async function loadFromDisk() {
  try {
    if ((await fs.stat(DATA_PATH)).size > 0) {
      const fileContent = await fs.readFile("./data/default", {
        encoding: "utf-8"
      });
      if (fileContent.length > 0) {
        deserializeAllEntityComponentData(
          stateOld.serverComponents,
          fileContent,
          stateOld.setEntity
        );
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function saveToDisk() {
  console.log("saving to disk. Entities:", Array.from(stateOld.addedEntities));
  try {
    const data = serializeAllEntityComponentData(
      stateOld.addedEntities,
      stateOld.serverComponents
    );
    await fs.writeFile(DATA_PATH, data, {
      flag: "w+"
    });
  } catch (e) {
    console.error(e);
  }
}

router.get("/api/entity", async (req, res) => {
  const worldId = parseInt(req.query.worldId);
  const entities = Array.from(stateOld.getEntitiesOfWorld(worldId));
  console.log("GET /api/entity:", entities);
  res.send(JSON.stringify(entities));
});

router.post("/api/entity", async (req, res) => {
  const json = req.body;
  const entityId = stateOld.addEntity();
  deserializeEntityData(entityId, stateOld.serverComponents, json);

  stateOld.set(GuidComponent, entityId, entityId);

  const newJson = serializeEntityData(entityId, stateOld.serverComponents);
  await saveToDisk();
  res.send(newJson);
});

router.put("/api/entity/:id", async (req, res) => {
  const entityId = parseInt(req.params.id);
  const json = req.body;
  deserializeEntityData(entityId, stateOld.serverComponents, json);
  const newJson = serializeEntityData(entityId, stateOld.serverComponents);
  res.send(newJson);
});

router.get("/api/entity/:id", async (req, res) => {
  const entityId = parseInt(req.params.id);
  const json = serializeEntityData(entityId, stateOld.serverComponents);
  res.send(json);
});

router.delete("/api/entity/:id", async (req, res) => {
  const entityId = parseInt(req.params.id);
  stateOld.removeEntity(entityId);
  await saveToDisk();
  res.sendStatus(200);
});

app.use(express.text() as any, router);

loadFromDisk();
