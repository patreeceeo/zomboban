import { EntityWithComponents } from "./Component";
import { invariant } from "./Error";
import { ServerIdComponent } from "./components";
import {
  deserializeEntity,
  serializeEntity,
  serializeObject
} from "./functions/Networking";
import { EntityManagerState } from "./state";
import { isNumber } from "./util";

export class NetworkedEntityClient {
  #putOptions: RequestInit = {
    method: "PUT",
    headers: {
      "Content-Type": "text/plain"
    },
    body: {} as BodyInit
  };
  #postOptions: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "text/plain"
    },
    body: {} as BodyInit
  };

  #deleteOptions: RequestInit = {
    method: "DELETE"
  };

  constructor(readonly fetchApi: typeof fetch) {}

  async load(world: EntityManagerState) {
    const response = await this.fetchApi("/api/entity");
    if (response.status !== 200) {
      throw new Error(`Failed to GET entity list: ${response.statusText}`);
    } else {
      const entityListText = await response.text();
      const entityList = JSON.parse(entityListText);
      for (const id of entityList) {
        await this.#getEntity(id, world);
      }
    }
  }

  async #getEntity(serverId: number | string, world: EntityManagerState) {
    invariant(isNumber(serverId), "serverId must be a number");
    const response = await this.fetchApi(`/api/entity/${serverId}`);
    if (response.status !== 200) {
      throw new Error(`Failed to GET entity: ${response.statusText}`);
    } else {
      const entityData = JSON.parse(await response.text());
      return deserializeEntity(world.addEntity(), entityData);
    }
  }

  async saveEntity(entity: any) {
    if (ServerIdComponent.has(entity)) {
      return this.#putEntity(entity);
    } else {
      return this.#postEntity(entity);
    }
  }

  async #putEntity<E extends EntityWithComponents<typeof ServerIdComponent>>(
    entity: E
  ) {
    const putOptions = this.#putOptions;
    putOptions.body = serializeObject(serializeEntity(entity));
    const response = await this.fetchApi(
      `/api/entity/${entity.serverId}`,
      putOptions
    );
    if (response.status !== 200) {
      throw new Error(`Failed to PUT entity: ${response.statusText}`);
    } else {
      const entityData = JSON.parse(await response.text());
      return deserializeEntity(entity, entityData);
    }
  }

  async #postEntity(entity: any) {
    const postOptions = this.#postOptions;
    postOptions.body = serializeObject(serializeEntity(entity));
    const response = await this.fetchApi(`/api/entity`, postOptions);
    if (response.status !== 200) {
      throw new Error(`Failed to POST entity: ${response.statusText}`);
    } else {
      const entityData = JSON.parse(await response.text());
      return deserializeEntity(entity, entityData);
    }
  }

  async deleteEntity<E extends EntityWithComponents<typeof ServerIdComponent>>(
    entity: E
  ) {
    invariant(isNumber(entity.serverId), "Entity must have a serverId");
    const response = await this.fetchApi(
      `/api/entity/${entity.serverId}`,
      this.#deleteOptions
    );
    if (response.status !== 200) {
      throw new Error(`Failed to DELETE entity: ${response.statusText}`);
    }
  }
}
