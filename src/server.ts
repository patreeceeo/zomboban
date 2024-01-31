import express from "express";
import ViteExpress from "vite-express";
import fs from "node:fs/promises";
import { COMPONENTS_TO_SAVE, COMPONENT_DATA_URL } from "./constants";
import "./components";
import {
  deserializeComponentData,
  getComponentData,
  serializeComponentData,
} from "./Component";
import { Query } from "./Query";
import { getLevelId, hasLevelId } from "./components/LevelId";

const PORT = 3000;

const app = express();
const router = express.Router();

const server = ViteExpress.listen(app, PORT, () =>
  console.log(`Listening on :${PORT}`)
);

const DATA_PATH = "./data/default";

async function loadFromDisk() {
  try {
    if ((await fs.stat(DATA_PATH)).size > 0) {
      const fileContent = await fs.readFile("./data/default", {
        encoding: "utf-8",
      });
      if (fileContent.length > 0) {
        return fileContent;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return "{}";
}

const RAW_DATA = JSON.parse(await loadFromDisk());
deserializeComponentData(RAW_DATA);

export async function dispose() {
  server.close();
  return new Promise((resolve) => {
    server.on("vite:close", resolve);
  });
}

router.post(COMPONENT_DATA_URL(), async (req, res) => {
  try {
    // console.log("body len", req.body.length);
    await fs.writeFile("./data/default", req.body, {
      flag: "w+",
    });
    // console.log("levelId data", JSON.stringify(JSON.parse(req.body).LevelId));
    console.log("received", JSON.stringify(JSON.parse(req.body), null, 2));
    deserializeComponentData(JSON.parse(req.body));
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

const loadLevelQuery = Query.build("LoadLevel")
  .addParam("levelId", 0)
  .complete(({ entityId, levelId }) => {
    // console.log("compare levelIds", typeof getLevelId(entityId), typeof levelId);
    return hasLevelId(entityId) && getLevelId(entityId) === levelId;
  });

const _tempComponentData: Record<string, any> = {};
for (const name of COMPONENTS_TO_SAVE) {
  _tempComponentData[name] = [];
}

router.get(COMPONENT_DATA_URL(), async (req, res) => {
  console.log("get request");
  try {
    const componentData = getComponentData();
    console.log("query", JSON.stringify(req.query));
    for (const [key, value] of Object.entries(req.query)) {
      loadLevelQuery.setParam(key as any, parseInt(value as string));
    }
    const entityIds = loadLevelQuery.execute();
    for (const name of COMPONENTS_TO_SAVE) {
      _tempComponentData[name].length = 0;
      for (const entityId of entityIds) {
        _tempComponentData[name][entityId] = componentData[name][entityId];
      }
    }
    const serializedData = serializeComponentData(_tempComponentData);
    console.log("sending", serializedData, "from", componentData);
    res.send(serializedData);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

// app.use(express.raw({inflate: false}) as any, router);
app.use(express.text() as any, router);
