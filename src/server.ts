import express from "express";
import ViteExpress from "vite-express";
import fs from "node:fs/promises";
import { COMPONENT_DATA_URL } from "./constants";

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

router.post(COMPONENT_DATA_URL, async (req, res) => {
  try {
    await fs.writeFile("./data/default", req.body, {
      flag: "w+",
    });
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

router.get(COMPONENT_DATA_URL, async (_req, res) => {
  try {
    if ((await fs.stat("./data/default")).size > 0) {
      const data = await fs.readFile("./data/default");
      res.send(data);
    } else {
      // No data yet
      res.sendStatus(204);
    }
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

app.use(express.raw() as any, router);
