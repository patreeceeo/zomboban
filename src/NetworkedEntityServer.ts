import { EntityWithComponents } from "./Component";
import { invariant } from "./Error";
import { ServerIdComponent } from "./components";
import { deserializeEntity } from "./functions/Networking";
import { log } from "./util";
import { isNumber } from "./util";
import { LogLevel } from "./Log";
import {World} from "./EntityManager";
import {getEntityMeta} from "./Entity";

export class NetworkedEntityServer {
  constructor(readonly world: World) {
  }

  getList() {
    return this.world.entities;
  }

  getEntity(serverId: number) {
    return this.world.getEntity(serverId) as EntityWithComponents<typeof ServerIdComponent>;
  }

  postEntity(
    entityData: AnyObject,
  ): EntityWithComponents<typeof ServerIdComponent> {
    const entity = this.world.addEntity();

    deserializeEntity(entity, entityData);
    if(!ServerIdComponent.has(entity)) {
      ServerIdComponent.add(entity);
      entity.serverId = getEntityMeta(entity).id;
    }
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
    const entity = this.world.getEntity(serverId);
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
    const entity = this.world.getEntity(serverId);
    invariant(entity !== undefined, `Entity with serverId ${serverId} not found`);
    this.world.removeEntity(entity);
    log.append(
      `DELETE entity with serverId ${serverId}`,
      LogLevel.Normal,
      this,
      entity
    );
  }
}
