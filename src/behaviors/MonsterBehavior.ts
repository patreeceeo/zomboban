import { Vector3 } from "three";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import {
  BehaviorComponent,
  HeadingDirectionComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { State } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { Message, sendMessage, sendMessageToTile } from "../Message";
import { HitByMonsterMessage, MoveMessage, PressMessage } from "../messages";
import { MoveAction, RotateAction } from "../actions";
import { EntityWithComponents } from "../Component";
import { Action } from "../Action";

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

class MonsterBehavior extends Behavior<Entity, State> {
  getNextTilePosition(
    currentTilePosition: Vector3,
    headingDirection: HeadingDirectionValue
  ) {
    HeadingDirection.getVector(headingDirection, _tileDelta);
    _nextTilePosition.copy(_tileDelta);
    _nextTilePosition.add(currentTilePosition);
  }

  // Calculate synchronized start time for all monsters
  getSynchronizedStartTime(currentTime: number): number {
    // Round to the next MOVE_DURATION interval to synchronize all monsters
    return Math.ceil(currentTime / MOVE_DURATION) * MOVE_DURATION;
  }
  onUpdateEarly(entity: Entity, context: State) {
    const { tilePosition } = entity;

    sendMessageToTile(new HitByMonsterMessage(entity), tilePosition, context);

    if (entity.actions.size > 0) return; // EARLY RETURN!

    this.getNextTilePosition(tilePosition, entity.headingDirection);

    const actions = [] as Action<any, any>[];
    const msg = sendMessageToTile(new MoveMessage.Into(entity), _nextTilePosition, context);
    const moveResult = msg.reduceResponses();

    // Use synchronized start time for all monsters
    const startTime = this.getSynchronizedStartTime(context.time.time);

    if(entity.inbox.getAll(MoveMessage.IntoGolem).size > 0) {
      // If blocked by another monster, wait the same duration as a move
      actions.push(
        new MoveAction(entity, startTime, MOVE_DURATION, _zeroVector)
      );
    } else {
      if (moveResult === MoveMessage.Response.Blocked) {
        const headingDirection = HeadingDirection.rotateCW(
          entity.headingDirection
        );

        actions.push(new RotateAction(entity, startTime, headingDirection, MOVE_DURATION));

        HeadingDirection.getVector(headingDirection, _tileDelta);
      } else {
        actions.push(new MoveAction(entity, startTime, MOVE_DURATION, _tileDelta));
      }
    }

    sendMessageToTile(new PressMessage(entity), tilePosition, context);

    return actions;
  }
  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: State,
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
