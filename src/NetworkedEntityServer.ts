import { EntityWithComponents } from "./Component";
import { invariant } from "./Error";
import { ServerIdComponent } from "./components";
import { deserializeEntity } from "./functions/Networking";
import { log } from "./util";
import { EntityManagerState } from "./state";
import { isNumber } from "./util";
import { NumberKeyedMap } from "./collections";

export class NetworkedEntityServer {
  #entityById = new NumberKeyedMap<
    EntityWithComponents<typeof ServerIdComponent>
  >();

  addEntity(entity: EntityWithComponents<typeof ServerIdComponent>) {
    invariant(isNumber(entity.serverId), "serverId must be a number");
    this.#entityById.set(entity.serverId, entity);
    log.append(`added entity for serverId: ${entity.serverId}`, entity);
  }

  getList() {
    const list = Array.from(this.#entityById.keys());
    return list;
  }

  getEntity(serverId: number) {
    const entity = this.#entityById.get(serverId);
    invariant(isNumber(entity.serverId), "serverId must be a number");
    log.append(`GET entity with serverId ${entity.serverId}`, entity);
    return entity;
  }

  postEntity(
    entityData: AnyObject,
    world: EntityManagerState
  ): EntityWithComponents<typeof ServerIdComponent> {
    const entity = world.addEntity();

    deserializeEntity(entity, entityData);
    ServerIdComponent.add(entity);
    invariant(isNumber(entity.serverId), "serverId must be a number");
    this.#entityById.set(entity.serverId, entity);
    log.append(`POST Created entity with serverId ${entity.serverId}`, entity);
    return entity;
  }

  putEntity(
    entityData: EntityWithComponents<typeof ServerIdComponent>,
    serverId: number
  ) {
    invariant(isNumber(serverId), "serverId must be a number");
    const entity = this.#entityById.get(serverId);
    deserializeEntity(entity, entityData);
    log.append(`PUT entity with serverId ${serverId}`, entity);
    return entity;
  }

  deleteEntity(serverId: number, world: EntityManagerState) {
    const entity = this.#entityById.get(serverId);
    invariant(isNumber(serverId), "serverId must be a number");
    this.#entityById.delete(serverId);
    world.removeEntity(entity);
    log.append(`DELETE entity with serverId ${serverId}`, entity);
  }
}
