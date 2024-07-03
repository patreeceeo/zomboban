import { NetworkedEntityServer } from "../NetworkedEntityServer";
import { PortableState } from "../state";
import fs from "node:fs/promises";
import { throttle } from "../util";
import { ObservableSet } from "../Observable";
import { IEntity } from "../EntityManager";
import {
  deserializeEntity,
  serializeEntity,
  serializeObject
} from "../functions/Networking";
import { Request, Response } from "express-serve-static-core";
import { invariant } from "../Error";
import { log } from "../util";
import { registerComponents } from "../common";

export class ExpressEntityServer {
  genericServer = new NetworkedEntityServer();
  state = new PortableState();
  async load() {
    try {
      registerComponents(this.state);
      const jsonString = await fs.readFile("data/default", "utf8");
      const serialized = JSON.parse(jsonString);
      for (const entityData of serialized) {
        const entity = this.state.addEntity();
        log.append(`Added entity that will be loaded from disk.`, entity);
        deserializeEntity(entity, entityData);
        this.genericServer.addEntity(entity as any);
      }
    } catch (e) {
      console.error(e);
    }
  }

  save = throttle(
    (entitySet: ObservableSet<IEntity>) => {
      const serialized = [];
      for (const entity of entitySet) {
        invariant(
          "serverId" in entity,
          `Expected serverId in entity while saving`
        );
        serialized.push(serializeEntity(entity));
      }
      const jsonString = serializeObject(serialized);
      fs.writeFile("data/default", jsonString, "utf8");
    },
    1000,
    { leading: false, trailing: true }
  );

  index = (req: Request, res: Response) => {
    void req;
    res.send(serializeObject(this.genericServer.getList()));
  };

  get = (req: Request, res: Response) => {
    const entity = this.genericServer.getEntity(Number(req.params.id));
    res.send(serializeObject(serializeEntity(entity)));
  };

  post = (req: Request, res: Response) => {
    const { state } = this;
    const entityData = req.body;
    const entity = this.genericServer.postEntity(JSON.parse(entityData), state);
    res.send(serializeObject(serializeEntity(entity)));
    this.save(state.entities);
  };

  put = (req: Request, res: Response) => {
    const entityData = req.body;
    const entity = this.genericServer.putEntity(
      JSON.parse(entityData),
      Number(req.params.id)
    );
    res.send(serializeObject(serializeEntity(entity)));
    this.save(this.state.entities);
  };

  delete = (req: Request, res: Response) => {
    const { state } = this;
    this.genericServer.deleteEntity(Number(req.params.id), state);
    res.send("true");
    this.save(state.entities);
  };
}
