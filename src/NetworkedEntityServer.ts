import { EntityWithComponents } from "./Component";
import { ServerIdComponent } from "./components";
import { deserializeEntity, serializeEntity } from "./functions/Networking";
import { EntityManagerState } from "./state";

export class NetworkedEntityServer {
  #entityById = {} as Record<number, any>;

  getList() {
    return JSON.stringify(Object.keys(this.#entityById));
  }

  getEntity(serverId: number) {
    const entity = this.#entityById[serverId];
    return serializeEntity(entity);
  }

  postEntity(
    entityData: string,
    world: EntityManagerState
  ): EntityWithComponents<typeof ServerIdComponent> {
    const entity = world.addEntity();
    ServerIdComponent.add(entity);
    this.#entityById[entity.serverId] = entity;
    return deserializeEntity(entity, entityData);
  }

  putEntity(entityData: string, serverId: number) {
    const entity = this.#entityById[serverId];
    return deserializeEntity(entity, entityData);
  }

  deleteEntity(serverId: number, world: EntityManagerState) {
    const entity = this.#entityById[serverId];
    delete this.#entityById[serverId];
    world.removeEntity(entity);
  }
}
