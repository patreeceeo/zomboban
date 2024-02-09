import { ComponentBase } from "../Component";
import { serializeEntityData, deserializeEntityData } from "./Server";

const postOptions: RequestInit = {
  method: "POST",
  headers: {
    "Content-Type": "text/plain",
  },
  body: {} as BodyInit,
};

const putOptions: RequestInit = {
  method: "PUT",
  headers: {
    "Content-Type": "text/plain",
  },
  body: {} as BodyInit,
};

const deleteOptions: RequestInit = {
  method: "DELETE",
};

const target = {} as Record<string, any>;

export async function postEntity(
  entityId: number,
  components: Record<string, ComponentBase<any, any, any>>,
) {
  postOptions.body = serializeEntityData(entityId, components, target);
  const entityData = await (await fetch(`/api/entity`, postOptions)).text();
  deserializeEntityData(entityId, components, entityData);
}

export async function putEntity(
  clientEntityId: number,
  serverEntityId: number,
  components: Record<string, ComponentBase<any, any, any>>,
) {
  putOptions.body = serializeEntityData(clientEntityId, components, target);
  const entityData = await (
    await fetch(`/api/entity/${serverEntityId}`, putOptions)
  ).text();
  deserializeEntityData(clientEntityId, components, entityData);
}

export async function deleteEntity(serverEntityId: number) {
  await fetch(`/api/entity/${serverEntityId}`, deleteOptions);
}

export async function loadServerEntityIds(worldId: number): Promise<number[]> {
  const response = await fetch(`/api/entity?worldId=${worldId}`);
  return await response.json();
}

export async function loadEntity(
  clientEntityId: number,
  serverEntityId: number,
  components: Record<string, ComponentBase<any, any, any>>,
): Promise<void> {
  const response = await fetch(`/api/entity/${serverEntityId}`);
  const entityData = await response.text();
  console.log("loaded entity", clientEntityId, entityData);
  deserializeEntityData(clientEntityId, components, entityData);
}
