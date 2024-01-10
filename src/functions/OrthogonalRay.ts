export function listPointsInOrthogonalRay(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): [number, number][] {
  const dx = endX - startX;
  const dy = endY - startY;
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  const result: [number, number][] = [];
  if (dx === 0 && dy !== 0) {
    for (let y = startY + sy; sy > 0 ? y <= endY : y >= endY; y += sy) {
      result.push([startX, y]);
    }
  }
  if (dx !== 0 && dy === 0) {
    for (let x = startX + sx; sx > 0 ? x <= endX : x >= endX; x += sx) {
      result.push([x, startY]);
    }
  }
  return result;
}
