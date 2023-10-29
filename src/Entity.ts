import {registerEntity} from "./Query";

let _nextId = 0;

export function addEntity(): number {
  const id = _nextId;
  _nextId++;
  registerEntity(id)
  return id;
}
