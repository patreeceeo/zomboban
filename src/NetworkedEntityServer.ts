import { EntityWithComponents } from "./Component";
import { invariant } from "./Error";
import { ServerIdComponent } from "./components";
import { deserializeEntity } from "./functions/Networking";
import { EntityManagerState } from "./state";
import { isNumber } from "./util";

export class NetworkedEntityServer {
  #entityById = {} as Record<number, any>;

  addEntity(entity: EntityWithComponents<typeof ServerIdComponent>) {
    invariant(isNumber(entity.serverId), "serverId must be a number");
    this.#entityById[entity.serverId] = entity;
  }

  getList() {
    return Object.keys(this.#entityById).map(Number);
  }

  getEntity(serverId: number) {
    return this.#entityById[serverId];
  }

  postEntity(
    entityData: AnyObject,
    world: EntityManagerState
  ): EntityWithComponents<typeof ServerIdComponent> {
    const entity = world.addEntity();
    ServerIdComponent.add(entityData);
    this.#entityById[entityData.serverId] = entity;
    return deserializeEntity(entity, entityData);
  }

  putEntity(
    entityData: EntityWithComponents<typeof ServerIdComponent>,
    serverId: number
  ) {
    invariant(isNumber(serverId), "serverId must be a number");
    const entity = this.#entityById[serverId];
    return deserializeEntity(entity, entityData);
  }

  deleteEntity(serverId: number, world: EntityManagerState) {
    invariant(isNumber(serverId), "serverId must be a number");
    const entity = this.#entityById[serverId];
    delete this.#entityById[serverId];
    world.removeEntity(entity);
  }
}
