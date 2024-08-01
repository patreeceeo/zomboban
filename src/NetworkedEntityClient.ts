import { EntityWithComponents } from "./Component";
import { invariant } from "./Error";
import { ServerIdComponent } from "./components";
import { BASE_URL } from "./constants";
import {
  deserializeEntity,
  serializeEntity,
  serializeObject
} from "./functions/Networking";
import { EntityManagerState } from "./state";
import { isNumber, joinPath } from "./util";

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

  baseUrl = joinPath(BASE_URL, "/api/entity");

  constructor(readonly fetchApi: typeof fetch) {}

  async load(world: EntityManagerState) {
    const response = await this.fetchApi(this.baseUrl);
    if (response.status !== 200) {
      throw new Error(`Failed to GET entity list: ${response.statusText}`);
    } else {
      const entityListText = await response.text();
      const entityList = JSON.parse(entityListText);
      for (const entityData of entityList) {
        deserializeEntity(world.addEntity(), entityData);
      }
    }
  }

  async putEntity<E extends EntityWithComponents<typeof ServerIdComponent>>(
    entity: E
  ) {
    const putOptions = this.#putOptions;
    putOptions.body = serializeObject(serializeEntity(entity));
    const response = await this.fetchApi(
      `${this.baseUrl}/${entity.serverId}`,
      putOptions
    );
    if (response.status !== 200) {
      throw new Error(`Failed to PUT entity: ${response.statusText}`);
    } else {
      const entityData = JSON.parse(await response.text());
      return deserializeEntity(entity, entityData);
    }
  }

  async postEntity(entity: any) {
    const postOptions = this.#postOptions;
    postOptions.body = serializeObject(serializeEntity(entity));
    const response = await this.fetchApi(this.baseUrl, postOptions);
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
      `${this.baseUrl}/${entity.serverId}`,
      this.#deleteOptions
    );
    if (response.status !== 200) {
      throw new Error(`Failed to DELETE entity: ${response.statusText}`);
    }
  }
}
