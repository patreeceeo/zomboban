import { Vector3 } from "three";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import {
  BehaviorComponent,
  HeadingDirectionComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { BehaviorState, TimeState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { ITilesState } from "../systems/TileSystem";
import { Message, sendMessage, sendMessageToTile } from "../Message";
import { HitByMonsterMessage, MoveMessage, PressMessage } from "../messages";
import { MoveAction, RotateAction } from "../actions";
import { EntityWithComponents } from "../Component";
import { Action } from "../Action";

type BehaviorContext = TimeState & ITilesState & BehaviorState;
type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof TilePositionComponent
  | typeof HeadingDirectionComponent
>;

const _tileDelta = new Vector3();
const _nextTilePosition = new Vector3();
const _zeroVector = new Vector3(0, 0, 0);
const MOVE_DURATION = 200;

class MonsterBehavior extends Behavior<Entity, BehaviorContext> {
  getNextTilePosition(
    currentTilePosition: Vector3,
    headingDirection: HeadingDirectionValue
  ) {
    HeadingDirection.getVector(headingDirection, _tileDelta);
    _nextTilePosition.copy(_tileDelta);
    _nextTilePosition.add(currentTilePosition);
  }
  onUpdateEarly(entity: Entity, context: BehaviorContext) {
    const { tilePosition } = entity;

    sendMessageToTile(new HitByMonsterMessage(entity), tilePosition, context);

    if (entity.actions.size > 0) return; // EARLY RETURN!

    this.getNextTilePosition(tilePosition, entity.headingDirection);

    const actions = [] as Action<any, any>[];
    const msg = sendMessageToTile(new MoveMessage.Into(entity), _nextTilePosition, context);
    const moveResult = msg.reduceResponses();

    if(entity.inbox.getAll(MoveMessage.IntoGolem).size > 0) {
      // If blocked by another monster, wait a sec.
      actions.push(
        new MoveAction(entity, context.time, 50, _zeroVector)
      );
    } else {
      if (moveResult === MoveMessage.Response.Blocked) {
        const headingDirection = HeadingDirection.rotateCW(
          entity.headingDirection
        );

        actions.push(new RotateAction(entity, context.time, headingDirection));

        HeadingDirection.getVector(headingDirection, _tileDelta);
      } else {
        actions.push(new MoveAction(entity, context.time, MOVE_DURATION, _tileDelta));
      }
    }

    sendMessageToTile(new PressMessage(entity), tilePosition, context);

    return actions;
  }
  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ): MoveMessage.Response => sendMessage(
        new MoveMessage.IntoGolem(entity),
        message.sender,
        context
      ).reduceResponses()!,
    [MoveMessage.IntoFire.type]: () => {
      return MoveMessage.Response.Allowed;
    },
    [MoveMessage.IntoWallPlaceholder.type]: () => {
      return MoveMessage.Response.Allowed;
    },
    [MoveMessage.IntoWall.type]: () => {
      return MoveMessage.Response.Blocked;
    },
    [MoveMessage.IntoGolem.type]: () => {
      return MoveMessage.Response.Blocked;
    },
    [MoveMessage.IntoTerminal.type]: () => {
      return MoveMessage.Response.Blocked;
    }
  };
}

export default MonsterBehavior;
