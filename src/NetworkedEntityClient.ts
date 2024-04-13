import { EntityWithComponents } from "./Component";
import { invariant } from "./Error";
import { Observable } from "./Observable";
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
      for (const id of entityList) {
        await this.#getEntity(id, world);
      }
    }
  }

  #getStartObserver = new Observable<number>();
  onGetStart(callback: (serverId: number) => void) {
    return this.#getStartObserver.subscribe(callback);
  }

  #getObserver = new Observable<
    EntityWithComponents<typeof ServerIdComponent>
  >();
  onGet(
    callback: (entity: EntityWithComponents<typeof ServerIdComponent>) => void
  ) {
    return this.#getObserver.subscribe(callback);
  }

  async #getEntity(serverId: number | string, world: EntityManagerState) {
    invariant(isNumber(serverId), "serverId must be a number");
    this.#getStartObserver.next(serverId);
    const response = await this.fetchApi(`${this.baseUrl}/${serverId}`);
    if (response.status !== 200) {
      throw new Error(`Failed to GET entity: ${response.statusText}`);
    } else {
      const entityData = JSON.parse(await response.text());
      const entity = deserializeEntity(world.addEntity(), entityData);
      this.#getObserver.next(entity);
      return entity;
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

  async #postEntity(entity: any) {
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
