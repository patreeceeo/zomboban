
import { convertToTilesMin, convertToTilesMax } from "../units/convert";

export interface ReadonlyVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Determines if an entity at the given visual position overlaps with the specified tile.
 * This accounts for entities that may span multiple tiles during movement animations.
 *
 * @param visualPosition - The entity's current visual position (transform.position)
 * @param targetTile - The tile position to check for overlap
 * @returns true if the entity overlaps the target tile, false otherwise
 */
export function isEntityOverlappingTile(
  visualPosition: ReadonlyVector3,
  targetTile: ReadonlyVector3
): boolean {
  const { x, y } = visualPosition;
  const tileXMin = convertToTilesMin(x);
  const tileXMax = convertToTilesMax(x);
  const tileYMin = convertToTilesMin(y);
  const tileYMax = convertToTilesMax(y);

  return (targetTile.x >= tileXMin && targetTile.x <= tileXMax &&
          targetTile.y >= tileYMin && targetTile.y <= tileYMax);
}
