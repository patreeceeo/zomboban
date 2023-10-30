
export enum ActLike {
  PLAYER,
  PUSHABLE,
  BARRIER,
  EDITOR_CURSOR,
}

const DATA: Array<ActLike> = [];

export function setActLike(entityId: number, value: ActLike) {
  DATA[entityId] = value;
}


export function isActLike(entityId: number, value: ActLike): boolean {
  return DATA[entityId] === value;
}

