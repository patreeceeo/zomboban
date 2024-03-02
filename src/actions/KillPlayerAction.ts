import { Counter } from "../Counter";
import { createInputQueue, whenInputStops } from "../Input";
import { executeFilterQuery } from "../Query";
import { Rectangle } from "../Rectangle";
// import { RouteId, routeTo } from "../Router";
import { stateOld } from "../state";
import { FinalAction } from "../systems/ActionSystem";
import { TintComponent } from "../components";

const inputQueue = createInputQueue();

const entityIds: number[] = [];
function listEntitiesExcept(id1: number, id2: number): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) => entityId !== id1 && entityId !== id2,
    entityIds,
    stateOld.addedEntities
  );
}

const RED_SHADE_MAX = 0x66;
const GREEN_SHADE_MAX = 0xff;
const BLUE_SHADE_MAX = 0xff;

export class KillPlayerAction implements FinalAction {
  readonly isFinal = true;
  tintCounter = new Counter(350);
  effectedArea = new Rectangle(0, 0, 0, 0);
  isComplete = false;
  constructor(
    readonly entityId: number,
    readonly killerId: number,
    readonly message: string
  ) {}
  progress(deltaTime: number): void {
    const { tintCounter, killerId, entityId: playerId } = this;

    tintCounter.advance(deltaTime);

    const tint =
      ((0xff - tintCounter.progress * RED_SHADE_MAX) << 16) |
      ((0xff - tintCounter.progress * GREEN_SHADE_MAX) << 8) |
      (0xff - tintCounter.progress * BLUE_SHADE_MAX);

    for (const entityId of listEntitiesExcept(killerId, playerId)) {
      stateOld.set(TintComponent, entityId, tint);
    }

    if (tintCounter.isMax) {
      // const text = new Text(this.message);
      // text.position.set(0, SCREENY_PX / 4);
      // centerX(text);

      // state.pixiApp.stage.addChild(text);

      if (inputQueue.length > 0) {
        this.isComplete = true;
        // state.pixiApp.stage.removeChild(text);
        for (const entityId of listEntitiesExcept(killerId, playerId)) {
          stateOld.remove(TintComponent, entityId);
        }
        // prevent the key press from effecting next scene
        // TODO should the action itself be responsible for this?
        whenInputStops().then(() => {
          // routeTo(RouteId.MAIN_MENU);
        });
      }
    }
    inputQueue.length = 0;
  }
}
