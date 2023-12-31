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

function* plotLineLowReverse(
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
  let D = 2 * dy + dx;
  let y = y0;
  for (let x = x0; x >= x1; x--) {
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
}

function* plotLineHighReverse(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Generator<[number, number]> {
  let dx = x1 - x0;
  let dy = y1 - y0;
  let xi = 1;
  if (dx < 0) {
    xi = -1;
    dx = -dx;
  }
  let D = 2 * dx + dy;
  let x = x0;
  for (let y = y0; y >= y1; y--) {
    yield [x, y];
    if (D > 0) {
      x = x + xi;
      D = D + 2 * (dx - dy);
    } else {
      D = D + 2 * dx;
    }
  }
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
      return plotLineLowReverse(tileX0, tileY0, tileX1, tileY1);
    } else {
      return plotLineLow(tileX0, tileY0, tileX1, tileY1);
    }
  } else {
    if (tileY0 > tileY1) {
      return plotLineHighReverse(tileX0, tileY0, tileX1, tileY1);
    } else {
      return plotLineHigh(tileX0, tileY0, tileX1, tileY1);
    }
  }
}
