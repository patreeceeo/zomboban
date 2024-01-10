import {
  ComponentName,
  appendComponentData,
  deserializeActLike,
  getComponentData,
} from "../ComponentData";
import { peekNextEntityId } from "../Entity";
import type { Behavior } from "../components/ActLike";
import { COMPONENT_DATA_URL } from "../constants";
import { inflateString } from "../util";

export async function loadComponents() {
  const nextEntityId = peekNextEntityId();
  const response = await fetch(COMPONENT_DATA_URL);
  if (response.status === 200) {
    const buffer = await response.arrayBuffer();
    const newComponentDataCollection = JSON.parse(
      inflateString(new Uint8Array(buffer)),
    ) as Record<ComponentName, unknown[]>;
    const componentDataCollection = getComponentData();
    for (const [name, data] of Object.entries(newComponentDataCollection)) {
      appendComponentData(
        name === ComponentName.ActLike
          ? await deserializeActLike(data, nextEntityId)
          : data,
        componentDataCollection[name as ComponentName],
        nextEntityId,
      );
    }
    const behaviors = componentDataCollection[ComponentName.ActLike].filter(
      (b) => !!b,
    ) as Behavior[];
    for (const behavior of behaviors) {
      behavior.initializeWithComponents();
    }
  }
}
