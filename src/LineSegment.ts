import { ActLike, isActLike } from "./components/ActLike";
import { getObjectsAt } from "./systems/PhysicsSystem";

const getObjectsResult: number[] = [];
function hasBarrier(tileX: number, tileY: number): boolean {
  getObjectsResult.length = 0;
  const objectIds = getObjectsAt(tileX, tileY, getObjectsResult);
  for (const objectId of objectIds) {
    if (isActLike(objectId, ActLike.BARRIER)) {
      return true;
    }
  }
  return false;
}

export function isUnblockedLineSegment(
  zombieX: number,
  zombieY: number,
  playerX: number,
  playerY: number,
): boolean {
  const lineSegment = plotLineSegment(zombieX, zombieY, playerX, playerY);
  for (const [tileX, tileY] of lineSegment) {
    if (hasBarrier(tileX, tileY)) {
      return false;
    }
    let count = 0;
    if (hasBarrier(tileX - 1, tileY) && playerX < tileX) {
      count++;
    }
    if (hasBarrier(tileX + 1, tileY) && playerX > tileX) {
      count++;
    }
    if (hasBarrier(tileX, tileY - 1) && playerY < tileY) {
      count++;
    }
    if (hasBarrier(tileX, tileY + 1) && playerY > tileY) {
      count++;
    }
    if (count > 1) {
      return false;
    }
  }
  return true;
}

function* plotLineLow(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Generator<[number, number]> {
  let dx = x1 - x0;
  let dy = y1 - y0;
  let yi = 1;
  if (dy < 0) {
    yi = -1;
    dy = -dy;
  }
  let D = 2 * dy - dx;
  let y = y0;
  for (let x = x0; x <= x1; x++) {
    yield [x, y];
    if (D > 0) {
      y = y + yi;
      D = D + 2 * (dy - dx);
    } else {
      D = D + 2 * dy;
    }
  }
}

function* plotLineHigh(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Generator<[number, number]> {
  const result: Array<[number, number]> = [];
  let dx = x1 - x0;
  let dy = y1 - y0;
  let xi = 1;
  if (dx < 0) {
    xi = -1;
    dx = -dx;
  }
  let D = 2 * dx - dy;
  let x = x0;
  for (let y = y0; y <= y1; y++) {
    yield [x, y];
    if (D > 0) {
      x = x + xi;
      D = D + 2 * (dx - dy);
    } else {
      D = D + 2 * dx;
    }
  }
  return result;
}

export function plotLineSegment(
  tileX0: number,
  tileY0: number,
  tileX1: number,
  tileY1: number,
): Generator<[number, number]> {
  const dx = Math.abs(tileX1 - tileX0);
  const dy = Math.abs(tileY1 - tileY0);
  if (dy < dx) {
    if (tileX0 > tileX1) {
      return plotLineLow(tileX1, tileY1, tileX0, tileY0);
    } else {
      return plotLineLow(tileX0, tileY0, tileX1, tileY1);
    }
  } else {
    if (tileY0 > tileY1) {
      return plotLineHigh(tileX1, tileY1, tileX0, tileY0);
    } else {
      return plotLineHigh(tileX0, tileY0, tileX1, tileY1);
    }
  }
}
