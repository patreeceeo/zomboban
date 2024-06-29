import { Vector3 } from "three";
import { convertToPixels } from "./units/convert";
import { invariant } from "./Error";

export enum HeadingDirectionValue {
  None = 0,
  Down = 1,
  Right = 2,
  Up = 3,
  Left = 4
}

enum HeadingDirectionRadians {
  Down = 0,
  Up = Math.PI,
  Right = Math.PI / 2,
  Left = Math.PI * 1.5
}

export class HeadingDirection {
  static fromXY(x: number, y: number) {
    if (x > 0 && y === 0) {
      return HeadingDirectionValue.Right;
    }
    if (x < 0 && y === 0) {
      return HeadingDirectionValue.Left;
    }
    if (x === 0 && y > 0) {
      return HeadingDirectionValue.Down;
    }
    if (x === 0 && y < 0) {
      return HeadingDirectionValue.Up;
    }
    throw `Not a HeadingDirectionValue: ${x}, ${y}`;
  }
  static fromVector({ x, y }: Vector3) {
    return this.fromXY(x, y);
  }
  static getVector(direction: HeadingDirectionValue, target = new Vector3()) {
    switch (direction) {
      case HeadingDirectionValue.Up:
        return target.set(0, convertToPixels(1 as Tile), 0);
      case HeadingDirectionValue.Down:
        return target.set(0, convertToPixels(-1 as Tile), 0);
      case HeadingDirectionValue.Left:
        return target.set(convertToPixels(-1 as Tile), 0, 0);
      case HeadingDirectionValue.Right:
        return target.set(convertToPixels(1 as Tile), 0, 0);
      case HeadingDirectionValue.None:
        return target.set(0, 0, 0);
      default:
        invariant(false, `Invalid direction: ${direction}`);
    }
  }
  static getRadians(direction: HeadingDirectionValue): number {
    switch (direction) {
      case HeadingDirectionValue.Up:
        return HeadingDirectionRadians.Up;
      case HeadingDirectionValue.Down:
        return HeadingDirectionRadians.Down;
      case HeadingDirectionValue.Left:
        return HeadingDirectionRadians.Left;
      case HeadingDirectionValue.Right:
        return HeadingDirectionRadians.Right;
      default:
        invariant(false, `Invalid direction: ${direction}`);
    }
  }
  static rotateCW(direction: HeadingDirectionValue): HeadingDirectionValue {
    return Math.max(1, (direction - 1) % 5);
  }
  static rotateCCW(direction: HeadingDirectionValue): HeadingDirectionValue {
    return Math.max(1, (direction + 1) % 5);
  }
  static stringify(direction: HeadingDirectionValue): string {
    switch (direction) {
      case HeadingDirectionValue.Up:
        return "Up";
      case HeadingDirectionValue.Down:
        return "Down";
      case HeadingDirectionValue.Left:
        return "Left";
      case HeadingDirectionValue.Right:
        return "Right";
      case HeadingDirectionValue.None:
        return "None";
      default:
        invariant(false, `Invalid direction: ${direction}`);
    }
  }
}
