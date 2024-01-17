import { Container } from "pixi.js";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";
import { defineComponent } from "../Component";

// TODO create entities for layers and use this component

const DATA = defineComponent(
  "DisplayContainer",
  [],
  hasDisplayContainer,
  getDisplayContainer,
  setDisplayContainer,
  removeDisplayContainer,
);

export function setDisplayContainer(entityId: number, value: Container) {
  if (DATA[entityId] !== value) {
    setRenderStateDirty();
    DATA[entityId] = value;
  }
}

export function hasDisplayContainer(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getDisplayContainer(entityId: number): Container {
  invariant(
    hasDisplayContainer(entityId),
    `Entity ${entityId} does not have a Container`,
  );
  return DATA[entityId];
}

export function removeDisplayContainer(entityId: number): void {
  if (hasDisplayContainer(entityId)) {
    setRenderStateDirty();
    delete DATA[entityId];
  }
}
