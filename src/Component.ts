import { peekNextEntityId, setNextEntityId } from "./Entity";
import { registerEntity } from "./Query";
import { localStorage } from "./globals";

export function savePartialComponent<T>(
  key: string,
  data: ReadonlyArray<T>,
  selectedEntities: ReadonlyArray<number>,
) {
  const selectedData = selectedEntities.map((entity) => data[entity]);
  const item = JSON.stringify(selectedData);
  localStorage.setItem(key, item);
}

export function loadPartialComponent<T>(
  key: string,
  data: T[],
  nextEntityId: number,
) {
  const item = localStorage.getItem(key);
  if (item) {
    const selectedData = JSON.parse(item) as T[];
    for (
      let i = 0, entityId = nextEntityId;
      i < selectedData.length;
      i++, entityId++
    ) {
      data[entityId] = selectedData[i];
      registerEntity(entityId);
    }
    if (peekNextEntityId() < nextEntityId + selectedData.length) {
      setNextEntityId(nextEntityId + selectedData.length);
    }
  }
}
