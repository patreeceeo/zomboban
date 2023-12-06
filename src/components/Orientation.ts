import { invariant } from "../Error";
import { getLookLike, setLookLike } from "./LookLike";

export const enum Orientation {
  Up,
  Down,
  Left,
  Right,
}

const LOOK_LIKE_TO_ORIENTATION_MAP: Record<Orientation, number>[] = [];

export function setLookLikeToOrientationMapping(
  upId: number,
  downId: number,
  leftId: number,
  rightId: number,
) {
  const map: Record<Orientation, number> = {
    [Orientation.Up]: upId,
    [Orientation.Down]: downId,
    [Orientation.Left]: leftId,
    [Orientation.Right]: rightId,
  };
  LOOK_LIKE_TO_ORIENTATION_MAP[upId] = map;
  LOOK_LIKE_TO_ORIENTATION_MAP[downId] = map;
  LOOK_LIKE_TO_ORIENTATION_MAP[leftId] = map;
  LOOK_LIKE_TO_ORIENTATION_MAP[rightId] = map;
}

export function hasOrientation(entityId: number): boolean {
  return LOOK_LIKE_TO_ORIENTATION_MAP[getLookLike(entityId)] !== undefined;
}

export function setOrientation(entityId: number, value: Orientation) {
  const lookLike = getLookLike(entityId);
  const map = LOOK_LIKE_TO_ORIENTATION_MAP[lookLike]!;
  invariant(!!map, `LookLike ${lookLike} does not have an orientation mapping`);
  const newLookLike = map[value];
  setLookLike(entityId, newLookLike);
}
