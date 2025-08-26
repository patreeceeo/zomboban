import { NetworkedEntityServer } from "../NetworkedEntityServer";
import { PortableState } from "../state";
import { ObservableSet } from "../Observable";
import { Entity } from "../Entity";
import {
  deserializeEntity,
  serializeEntity,
  serializeObject
} from "../functions/Networking";
import { Request, Response } from "express-serve-static-core";
import { log } from "../util";
import { LogLevel } from "../Log";
import {File} from "../fs/File";
import {invariant} from "../Error";
import {ServerIdComponent} from "../components";

export class ExpressEntityServer {
  state = new PortableState();
  genericServer = new NetworkedEntityServer(this.state.world);
  fileMgr = new File({baseName: "data/default", maxBackups: 1, ext: "json"});
  async load() {
    try {
      const jsonString = await this.fileMgr.load();
      const serialized = JSON.parse(jsonString);
      let maxServerId = 0;
      for (const entityData of serialized) {
        const entity = this.state.world.addEntity();
        deserializeEntity(entity, entityData);
        invariant(ServerIdComponent.has(entity), `${entity} must have ServerIdComponent`);
        // Register the entity in the server's mapping
        this.genericServer.registerEntity(entity as any);
        // Track the highest serverId
        if (entityData.serverId > maxServerId) {
          maxServerId = entityData.serverId;
        }
        log.append(
          `Loaded ${entity} from disk, serverId=${entityData.serverId}`,
          LogLevel.Normal,
        );
      }
      // Initialize nextServerId to be higher than any existing serverId
      log.append(
        `Set next serverId to ${maxServerId + 1}`,
        LogLevel.Normal,
      );
      this.genericServer.setNextServerId(maxServerId + 1);
    } catch (e) {
      console.error(e);
    }
  }

  save = (entitySet: ObservableSet<Entity>) => {
    const serialized = [];
    for (const entity of entitySet) {
      serialized.push(serializeEntity(entity));
    }
    const jsonString = serializeObject(serialized);
    this.fileMgr.save(jsonString);
  }

  index = (req: Request, res: Response) => {
    void req;
    res.send(
      serializeObject(
        [...this.genericServer.getList()].map((entity) => serializeEntity(entity))
      )
    );
  };

  get = (req: Request, res: Response) => {
    const entity = this.genericServer.getEntity(Number(req.params.id));
    res.send(serializeObject(serializeEntity(entity)));
  };

  post = (req: Request, res: Response) => {
    const { state } = this;
    const entityData = req.body;
    const entity = this.genericServer.postEntity(JSON.parse(entityData));
    const responseText = serializeObject(serializeEntity(entity))
    res.send(responseText);
    this.save(state.world.entities);
  };

  put = (req: Request, res: Response) => {
    const parsedData = JSON.parse(req.body);
    const entityId = Number(req.params.id);
    const entity = this.genericServer.putEntity(
      parsedData,
      entityId
    );
    console.log(`PUT entity ${entityId}, data: ${req.body}, result: ${entity}`);
    res.send(serializeObject(serializeEntity(entity)));
    this.save(this.state.world.entities);
  };

  delete = (req: Request, res: Response) => {
    const { state } = this;
    this.genericServer.deleteEntity(Number(req.params.id));
    res.send("true");
    this.save(state.world.entities);
  };
}
