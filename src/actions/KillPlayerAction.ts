import { Counter } from "../Counter";
import { addEntity } from "../Entity";
import { createInputQueue, whenInputStops } from "../Input";
import { Lazy } from "../Lazy";
import { executeFilterQuery } from "../Query";
import { Rectangle } from "../Rectangle";
import { RouteId, routeTo } from "../Router";
import { QC } from "../components";
import { FinalAction } from "../systems/ActionSystem";
import { SCREENY_PX } from "../units/convert";

const inputQueue = createInputQueue();

const entityIds: number[] = [];
function listEntitiesExcept(id1: number, id2: number): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) => entityId !== id1 && entityId !== id2,
    entityIds,
  );
}

const RED_SHADE_MAX = 0x66;
const GREEN_SHADE_MAX = 0xff;
const BLUE_SHADE_MAX = 0xff;

export const GAME_OVER_TEXT_ID = new Lazy(() =>
  addEntity((id) => {
    QC.setPositionY(id, (SCREENY_PX / 4) as Px);
    QC.setIsVisible(id, false);
  }),
);

export class KillPlayerAction implements FinalAction {
  readonly isFinal = true;
  tintCounter = new Counter(350);
  effectedArea = new Rectangle(0, 0, 0, 0);
  isComplete = false;
  constructor(
    readonly entityId: number,
    readonly killerId: number,
    readonly message: string,
  ) {}
  progress(deltaTime: number): void {
    const { tintCounter, killerId, entityId: playerId } = this;

    tintCounter.advance(deltaTime);

    const tint =
      ((0xff - tintCounter.progress * RED_SHADE_MAX) << 16) |
      ((0xff - tintCounter.progress * GREEN_SHADE_MAX) << 8) |
      (0xff - tintCounter.progress * BLUE_SHADE_MAX);

    for (const entityId of listEntitiesExcept(killerId, playerId)) {
      QC.setTint(entityId, tint);
    }

    if (tintCounter.isMax) {
      const textId = GAME_OVER_TEXT_ID.get();
      QC.setIsVisible(textId, true);
      QC.setText(textId, this.message);

      if (inputQueue.length > 0) {
        this.isComplete = true;
        QC.setIsVisible(textId, false);
        for (const entityId of listEntitiesExcept(killerId, playerId)) {
          QC.removeTint(entityId);
        }
        // prevent the key press from effecting next scene
        // TODO should the action itself be responsible for this?
        whenInputStops().then(() => {
          routeTo(RouteId.MAIN_MENU);
        });
      }
    }
    inputQueue.length = 0;
  }
}
