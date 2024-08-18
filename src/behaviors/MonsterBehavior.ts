import { Vector3 } from "../Three";
import { HeadingDirection } from "../HeadingDirection";
import { TransformComponent } from "../components";
import MonsterEntity from "../entities/MonsterEntity";
import { BehaviorState, TimeState } from "../state";
import { ActionEntity } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { ITilesState } from "../systems/TileSystem";
import { convertPropertiesToTiles } from "../units/convert";
import { Message, createMessage, getReceivers, sendMessage } from "../Message";
import { CanMoveMessage } from "../messages";
import { MoveAction, RotateAction } from "../actions";
import { WallBehavior } from "./WallBehavior";

type BehaviorContext = TimeState & ITilesState & BehaviorState;

const vecInPixels = new Vector3();
const vecInTiles = new Vector3();

export class MonsterBehavior extends Behavior<
  ActionEntity<typeof TransformComponent>,
  BehaviorContext
> {
  static id = "behavior/monster";
  onUpdateEarly(
    entity: ReturnType<typeof MonsterEntity.create>,
    context: BehaviorContext
  ) {
    if (entity.actions.size > 0) return; // EARLY RETURN!

    let canMove;
    let attempts = 0;
    let headingDirection = entity.headingDirection;
    do {
      HeadingDirection.getVector(headingDirection, vecInPixels);
      vecInTiles.copy(vecInPixels);
      convertPropertiesToTiles(vecInTiles);
      vecInTiles.add(entity.tilePosition);

      const receivers = getReceivers(context.tiles, vecInTiles);

      canMove = true;
      for (const receiver of receivers) {
        canMove &&= sendMessage(
          createMessage(CanMoveMessage, vecInPixels).from(entity).to(receiver),
          context
        );
      }
      // console.log(
      //   "sent message to",
      //   HeadingDirectionValue[headingDirection],
      //   "answer",
      //   receiver ? canMove : undefined
      // );
      if (!canMove) {
        headingDirection = HeadingDirection.rotateCCW(headingDirection);
        // console.log("trying", HeadingDirectionValue[headingDirection], "next");
      }
      attempts++;
    } while (!canMove && attempts < 4);

    if (headingDirection !== entity.headingDirection) {
      return [new RotateAction(entity, context.time, headingDirection)];
    }
    // TODO send kill message
  }
  onUpdateLate(
    entity: ReturnType<typeof MonsterEntity.create>,
    context: BehaviorContext
  ) {
    if (entity.actions.size > 0) return; // EARLY RETURN!

    return [new MoveAction(entity, context.time, vecInPixels)];
  }
  onReceive(message: Message<any>) {
    WallBehavior.prototype.onReceive(message);
  }
}
