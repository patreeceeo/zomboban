import { Vector3 } from "../Three";
import { HeadingDirection } from "../HeadingDirection";
import { TransformComponent } from "../components";
import MonsterEntity from "../entities/MonsterEntity";
import { BehaviorState, TimeState } from "../state";
import { ActionEntity } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { ITilesState } from "../systems/TileSystem";
import { convertPropertiesToTiles } from "../units/convert";
import {
  Message,
  createMessage,
  getReceivers,
  sendMessage,
  sendMessageToEachWithin
} from "../Message";
import {
  MoveIntoGolemMessage,
  MoveIntoMessage,
  HitByMonsterMessage,
  MoveIntoGrassMessage
} from "../messages";
import { MoveAction, RotateAction } from "../actions";

type BehaviorContext = TimeState & ITilesState & BehaviorState;
type Entity = ActionEntity<typeof TransformComponent>;

const vecInPixels = new Vector3();
const vecInTiles = new Vector3();

export class MonsterBehavior extends Behavior<Entity, BehaviorContext> {
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
          createMessage(MoveIntoMessage).from(entity).to(receiver),
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
        // TODO have it turn around when it eliminates something
        headingDirection = HeadingDirection.rotateCCW(headingDirection);
        // console.log("trying", HeadingDirectionValue[headingDirection], "next");
      }
      attempts++;
    } while (!canMove && attempts < 4);

    // TODO this should kill player
    sendMessageToEachWithin(
      (receiver) => new HitByMonsterMessage(receiver, entity),
      context,
      vecInTiles
    );

    if (headingDirection !== entity.headingDirection) {
      return [new RotateAction(entity, context.time, headingDirection)];
    }
  }
  onUpdateLate(
    entity: ReturnType<typeof MonsterEntity.create>,
    context: BehaviorContext
  ) {
    if (entity.actions.size > 0) return; // EARLY RETURN!

    return [new MoveAction(entity, context.time, vecInPixels)];
  }
  messageHandlers = {
    [MoveIntoMessage.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ) => {
      sendMessage(new MoveIntoGolemMessage(message.sender, entity), context);
      return false;
    },
    [MoveIntoGrassMessage.type]: () => {
      return true;
    }
  };
}
