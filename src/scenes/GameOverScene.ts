import { Counter } from "../Counter";
import { addEntity } from "../Entity";
import { createInputQueue } from "../Input";
import { executeFilterQuery } from "../Query";
import { Scene } from "../Scene";
import { ReservedEntity } from "../entities";
import { SCENE_MANAGER, SharedEntity } from "../scenes";
import { undoAll } from "../systems/ActionSystem";
import { RenderSystem } from "../systems/RenderSystem";
import { SCREENY_PX } from "../units/convert";
import { RouteId, routeTo } from "../Router";
import { QC } from "../components";
import { Lazy } from "../Lazy";

const inputQueue = createInputQueue();

const entityIds: number[] = [];
function listFadeEntities(killerId: number): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) =>
      !QC.isActLike(entityId, QC.ActLike.PLAYER) && entityId !== killerId,
    entityIds,
  );
}

const RED_SHADE_MAX = 0x66;
const GREEN_SHADE_MAX = 0xff;
const BLUE_SHADE_MAX = 0xff;

export const GAME_OVER_TEXT_ID = new Lazy(() =>
  addEntity((id) => {
    const defaultPixiAppId = ReservedEntity.DEFAULT_PIXI_APP;
    QC.setPixiAppId(id, defaultPixiAppId);
    QC.setPositionY(id, (SCREENY_PX / 4) as Px);
    QC.setIsVisible(id, false);
  }),
);

export default class GameOverScene implements Scene {
  tintCounter = new Counter(350);
  start(): void {
    this.tintCounter.value = 0;
  }
  update = (deltaTime: number): void => {
    const { tintCounter } = this;

    const killerId = SCENE_MANAGER.getSharedEntity(SharedEntity.KILLER);

    tintCounter.advance(deltaTime);

    const tint =
      ((0xff - tintCounter.progress * RED_SHADE_MAX) << 16) |
      ((0xff - tintCounter.progress * GREEN_SHADE_MAX) << 8) |
      (0xff - tintCounter.progress * BLUE_SHADE_MAX);
    for (const entityId of listFadeEntities(killerId)) {
      QC.setTint(entityId, tint);
    }
    RenderSystem();

    if (tintCounter.isMax) {
      QC.setIsVisible(GAME_OVER_TEXT_ID.get(), true);

      if (inputQueue.length > 0) {
        undoAll();
        routeTo(RouteId.MAIN_MENU);
      }
    }

    inputQueue.length = 0;
  };
  stop(): void {
    QC.setIsVisible(GAME_OVER_TEXT_ID.get(), false);
    const killerId = SCENE_MANAGER.getSharedEntity(SharedEntity.KILLER);
    for (const entityId of listFadeEntities(killerId)) {
      QC.removeTint(entityId);
    }
  }
  get services() {
    return [];
  }
}
