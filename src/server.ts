import express from "express";
import ViteExpress from "vite-express";
import fs from "node:fs/promises";
import {
  deserializeAllEntityComponentData,
  deserializeEntityData,
  serializeAllEntityComponentData,
  serializeEntityData,
} from "./functions/Server";
import { state } from "./state";

const PORT = 3000;

const app = express();
const router = express.Router();

const server = ViteExpress.listen(app, PORT, () =>
  console.log(`Listening on :${PORT}`),
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
        encoding: "utf-8",
      });
      if (fileContent.length > 0) {
        deserializeAllEntityComponentData(
          state.serverComponents,
          fileContent,
          state.setEntity,
        );
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function saveToDisk() {
  console.log("saving to disk. Entities:", Array.from(state.addedEntities));
  try {
    const data = serializeAllEntityComponentData(
      state.addedEntities,
      state.serverComponents,
    );
    await fs.writeFile(DATA_PATH, data, {
      flag: "w+",
    });
  } catch (e) {
    console.error(e);
  }
}

router.get("/api/entity", async (req, res) => {
  const worldId = parseInt(req.query.worldId);
  const entities = Array.from(state.getEntitiesOfWorld(worldId));
  console.log("GET /api/entity:", entities);
  res.send(JSON.stringify(entities));
});

router.post("/api/entity", async (req, res) => {
  const json = req.body;
  const entityId = state.addEntity();
  deserializeEntityData(entityId, state.serverComponents, json);

  state.setGuid(entityId, entityId);

  const newJson = serializeEntityData(entityId, state.serverComponents);
  await saveToDisk();
  res.send(newJson);
});

router.put("/api/entity/:id", async (req, res) => {
  const entityId = req.params.id;
  const json = req.body;
  deserializeEntityData(entityId, state.serverComponents, json);
  const newJson = serializeEntityData(entityId, state.serverComponents);
  res.send(newJson);
});

router.get("/api/entity/:id", async (req, res) => {
  const entityId = req.params.id;
  const json = serializeEntityData(entityId, state.serverComponents);
  res.send(json);
});

router.delete("/api/entity/:id", async (req, res) => {
  const entityId = req.params.id;
  state.removeEntity(entityId);
  await saveToDisk();
  res.sendStatus(200);
});

app.use(express.text() as any, router);

loadFromDisk();

setInterval(saveToDisk, 1000 * 60);
