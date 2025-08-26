import { EntityWithComponents } from "./Component";
import { invariant } from "./Error";
import { ServerIdComponent } from "./components";
import { deserializeEntity } from "./functions/Networking";
import { log } from "./util";
import { isNumber } from "./util";
import { LogLevel } from "./Log";
import {World} from "./EntityManager";
import { Entity } from "./Entity";

export class NetworkedEntityServer {
  #nextServerId = 0;
  #serverIdToEntity = new Map<number, Entity>();
  
  constructor(readonly world: World) {
  }

  setNextServerId(id: number) {
    this.#nextServerId = id;
  }

  registerEntity(entity: EntityWithComponents<typeof ServerIdComponent>) {
    this.#serverIdToEntity.set(entity.serverId, entity);
  }

  unregisterEntity(serverId: number) {
    this.#serverIdToEntity.delete(serverId);
  }

  getList() {
    return this.world.entities;
  }

  getEntity(serverId: number) {
    const entity = this.#serverIdToEntity.get(serverId);
    invariant(entity !== undefined, `Entity with serverId ${serverId} not found in mapping`);
    return entity as EntityWithComponents<typeof ServerIdComponent>;
  }

  postEntity(
    entityData: AnyObject,
  ): EntityWithComponents<typeof ServerIdComponent> {
    const entity = this.world.addEntity();

    deserializeEntity(entity, entityData);
    if(!ServerIdComponent.has(entity)) {
      ServerIdComponent.add(entity);
      entity.serverId = this.#nextServerId++;
    } else if(entity.serverId > this.#nextServerId) {
      this.#nextServerId = entity.serverId + 1;
    }

    // Register the entity in our mapping
    this.registerEntity(entity as EntityWithComponents<typeof ServerIdComponent>);

    log.append(
      `POST Created entity with serverId ${entity.serverId}`,
      LogLevel.Normal,
      this,
      entity
    );
    return entity;
  }

  putEntity(
    entityData: EntityWithComponents<typeof ServerIdComponent>,
    serverId: number
  ) {
    invariant(isNumber(serverId), "serverId must be a number");
    const entity = this.getEntity(serverId);
    deserializeEntity(entity, entityData);
    log.append(
      `PUT entity with serverId ${serverId}`,
      LogLevel.Normal,
      this,
      entity
    );
    return entity as EntityWithComponents<typeof ServerIdComponent>;
  }

  deleteEntity(serverId: number) {
    const entity = this.getEntity(serverId);
    this.unregisterEntity(serverId);
    this.world.removeEntity(entity);
    log.append(
      `DELETE entity with serverId ${serverId}`,
      LogLevel.Normal,
      this,
      entity
    );
  }
}
