import { EntityName, getNamedEntity } from "../Entity";
import { getLookLike, hasLookLike, setLookLike } from "./LookLike";

export const enum Orientation {
  Up,
  Down,
  Left,
  Right,
}

export function setOrientation(entityId: number, value: Orientation) {
  if (hasLookLike(entityId)) {
    const lookLike = getLookLike(entityId);
    const doorDownImageId = getNamedEntity(EntityName.DOOR_DOWN_IMAGE);
    const doorUpImageId = getNamedEntity(EntityName.DOOR_UP_IMAGE);
    const doorLeftImageId = getNamedEntity(EntityName.DOOR_LEFT_IMAGE);
    const doorRightImageId = getNamedEntity(EntityName.DOOR_RIGHT_IMAGE);
    const doors = [
      doorDownImageId,
      doorUpImageId,
      doorLeftImageId,
      doorRightImageId,
    ];

    switch (value) {
      case Orientation.Up:
        if (doors.includes(lookLike)) {
          setLookLike(entityId, getNamedEntity(EntityName.DOOR_UP_IMAGE));
        }
        break;
      case Orientation.Down:
        if (doors.includes(lookLike)) {
          setLookLike(entityId, getNamedEntity(EntityName.DOOR_DOWN_IMAGE));
        }
        break;
      case Orientation.Left:
        if (doors.includes(lookLike)) {
          setLookLike(entityId, getNamedEntity(EntityName.DOOR_LEFT_IMAGE));
        }
        break;
      case Orientation.Right:
        if (doors.includes(lookLike)) {
          setLookLike(entityId, getNamedEntity(EntityName.DOOR_RIGHT_IMAGE));
        }
        break;
    }
  }
}
