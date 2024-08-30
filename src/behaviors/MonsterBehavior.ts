import { Vector3 } from "../Three";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import {
  BehaviorComponent,
  HeadingDirectionComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import MonsterEntity from "../entities/MonsterEntity";
import { BehaviorState, TimeState } from "../state";
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
  HitByGolemMessage,
  MoveIntoGrassMessage
} from "../messages";
import { MoveAction, RotateAction } from "../actions";
import { EntityWithComponents } from "../Component";

type BehaviorContext = TimeState & ITilesState & BehaviorState;
type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof TilePositionComponent
  | typeof HeadingDirectionComponent
>;

const vecInPixels = new Vector3();
const vecInTiles = new Vector3();

export class MonsterBehavior extends Behavior<Entity, BehaviorContext> {
  getNextTilePosition(
    tilePosition: Vector3,
    headingDirection: HeadingDirectionValue
  ) {
    HeadingDirection.getVector(headingDirection, vecInPixels);
    vecInTiles.copy(vecInPixels);
    convertPropertiesToTiles(vecInTiles);
    vecInTiles.add(tilePosition);
    return vecInTiles;
  }
  onUpdateEarly(entity: Entity, context: BehaviorContext) {
    const { tilePosition } = entity;

    const nextTilePosition = this.getNextTilePosition(
      tilePosition,
      entity.headingDirection
    );

    sendMessageToEachWithin(
      (receiver) => new HitByGolemMessage(receiver, entity),
      context,
      nextTilePosition
    );

    if (entity.actions.size > 0) return; // EARLY RETURN!

    let canMove;
    let attempts = 0;
    let headingDirection = entity.headingDirection;
    do {
      const nextTilePosition = this.getNextTilePosition(
        tilePosition,
        headingDirection
      );
      const receivers = getReceivers(context.tiles, nextTilePosition);

      canMove = true;
      for (const receiver of receivers) {
        canMove &&= sendMessage(
          createMessage(MoveIntoMessage).from(entity).to(receiver),
          context
        );
      }
      if (!canMove) {
        // TODO have it turn around when it eliminates something
        headingDirection = HeadingDirection.rotateCCW(headingDirection);
        // console.log("trying", HeadingDirectionValue[headingDirection], "next");
      }
      attempts++;
    } while (!canMove && attempts < 4);

    if (headingDirection !== entity.headingDirection) {
      return [new RotateAction(entity, context.time, headingDirection)];
    }
  }
  onUpdateLate(
    entity: ReturnType<typeof MonsterEntity.create>,
    context: BehaviorContext
  ) {
    if (entity.actions.size > 0 || entity.outbox.count([MoveIntoMessage]) >= 4)
      return; // EARLY RETURN!

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
