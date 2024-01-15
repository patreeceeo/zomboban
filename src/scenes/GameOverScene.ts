import { Counter } from "../Counter";
import { addEntity } from "../Entity";
import { createInputQueue } from "../Input";
import { executeFilterQuery } from "../Query";
import { Scene } from "../Scene";
import { ActLike, isActLike } from "../components/ActLike";
import { setIsVisible } from "../components/IsVisible";
import { setPixiAppId } from "../components/PixiAppId";
import { setPositionY } from "../components/PositionY";
import { removeTint, setTint } from "../components/Tint";
import { ReservedEntity } from "../entities";
import { SCENE_MANAGER, SceneId, SharedEntity } from "../scenes";
import { undoAll } from "../systems/ActionSystem";
import { RenderSystem } from "../systems/RenderSystem";
import { SCREENY_PX } from "../units/convert";

const inputQueue = createInputQueue();

const entityIds: number[] = [];
function listFadeEntities(killerId: number): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) => !isActLike(entityId, ActLike.PLAYER) && entityId !== killerId,
    entityIds,
  );
}

const RED_SHADE_MAX = 0x66;
const GREEN_SHADE_MAX = 0xff;
const BLUE_SHADE_MAX = 0xff;

export class GameOverScene implements Scene {
  tintCounter = new Counter(350);
  textId: number;
  constructor() {
    this.textId = SCENE_MANAGER.shareEntity(
      addEntity((id) => {
        const defaultPixiAppId = ReservedEntity.DEFAULT_PIXI_APP;
        setPixiAppId(id, defaultPixiAppId);
        setPositionY(id, (SCREENY_PX / 4) as Px);
        setIsVisible(id, false);
      }),
      SharedEntity.GAME_OVER_TEXT,
    );
  }
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
      setTint(entityId, tint);
    }
    RenderSystem();

    if (tintCounter.isMax) {
      const textId = this.textId;

      const defaultPixiAppId = ReservedEntity.DEFAULT_PIXI_APP;
      setPixiAppId(textId, defaultPixiAppId);
      setPositionY(textId, (SCREENY_PX / 4) as Px);

      setIsVisible(textId, true);

      if (inputQueue.length > 0) {
        undoAll();
        SCENE_MANAGER.start(SceneId.GAME);
      }
    }

    inputQueue.length = 0;
  };
  stop(): void {
    setIsVisible(this.textId, false);
    const killerId = SCENE_MANAGER.getSharedEntity(SharedEntity.KILLER);
    for (const entityId of listFadeEntities(killerId)) {
      removeTint(entityId);
    }
  }
  get services() {
    return [];
  }
}
