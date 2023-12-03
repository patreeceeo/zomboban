import {
  ComponentName,
  appendComponentData,
  getComponentData,
} from "../ComponentData";
import { peekNextEntityId } from "../Entity";
import { COMPONENT_DATA_URL } from "../constants";
import { inflateString } from "../util";

export async function loadComponents() {
  const nextEntityId = peekNextEntityId();
  const response = await fetch(COMPONENT_DATA_URL);
  if (response.status === 200) {
    const buffer = await response.arrayBuffer();
    const newComponentData = JSON.parse(
      inflateString(new Uint8Array(buffer)),
    ) as Record<ComponentName, unknown[]>;
    const componentData = getComponentData();
    for (const [name, data] of Object.entries(newComponentData)) {
      appendComponentData(
        data,
        componentData[name as ComponentName],
        nextEntityId,
      );
    }
  }
}
