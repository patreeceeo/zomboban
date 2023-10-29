import { and, not, executeFilterQuery, ComplexFilter, executeComplexFilterQuery } from "../Query";
import { Canvas, getCanvas, hasCanvas, setCanvas } from "../components/Canvas";
import { getImage } from "../components/Image";
import { getIsLoading, hasIsLoading } from "../components/IsLoading";
import { getLookLike, hasLookLike } from "../components/LookLike";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { isRenderLayer } from "../components/RenderLayer";

const WIDTH = 800;
const HEIGHT = 600;
const SPRITE_WIDTH = 32;
const SPRITE_HEIGHT = 32;

export function RenderSystem() {
  const zIndexes: number[] = [];
  const layerEntityIds: number[] = [];

  function getLayerIds(): number[] {
    zIndexes.length = 0;
    return executeFilterQuery(hasCanvas, zIndexes);
  }

  const layerEntityIdsFilter: ComplexFilter<[number]> = {
    fn: (entityId, zIndex) => and(
        () => isRenderLayer(entityId, zIndex),
        () => hasLookLike(entityId),
        () =>
          and(hasIsLoading, not(getIsLoading))(getLookLike(entityId))
        )(),
    restArgs: [0]
  };

  function getLayerEntityIds(zIndex: number): number[] {
    layerEntityIds.length = 0;
    layerEntityIdsFilter.restArgs[0] = zIndex;
    return executeComplexFilterQuery(layerEntityIdsFilter, layerEntityIds)
  }

  return {
    execute() {
      for (const zIndex of getLayerIds()) {
        const canvas = getCanvas(zIndex);
        const ctx = canvas.renderingContext2d;
        ctx.fillStyle = "black";
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
      }

      for (const zIndex of getLayerIds()) {
        const canvas = getCanvas(zIndex);
        const ctx = canvas.renderingContext2d;

        for (const entityId of getLayerEntityIds(zIndex)) {
          const imageId = getLookLike(entityId);
          const image = getImage(imageId);
          const x = getPositionX(entityId);
          const y = getPositionY(entityId);
          ctx.drawImage(image.renderable!, x * SPRITE_WIDTH, y * SPRITE_HEIGHT);
        }
      }
    },
  };
}

export function addRenderLayer(zIndex: number, parent: HTMLElement): void {
  const canvas = new Canvas();
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  setCanvas(zIndex, canvas);
  canvas.mount(parent);
}
