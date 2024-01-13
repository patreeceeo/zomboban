import { defineComponent } from "../Component";
import { invariant } from "../Error";
import { setRenderStateDirty } from "../systems/RenderSystem";

const DATA = defineComponent("Tint", [], hasTint, getTint, setTint, removeTint);

export function setTint(entityId: number, tint: number) {
  DATA[entityId] = tint;
  setRenderStateDirty();
}

export function hasTint(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getTint(entityId: number): number {
  invariant(hasTint(entityId), `Entity ${entityId} has no Tint`);
  return DATA[entityId];
}

export function getTintOrDefault(entityId: number, defaultValue: number) {
  return hasTint(entityId) ? getTint(entityId) : defaultValue;
}

export function removeTint(entityId: number) {
  delete DATA[entityId];
  setRenderStateDirty();
}
