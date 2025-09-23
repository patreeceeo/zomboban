import { Vector3 } from "three";
import {
  State
} from "../state";
import PlayerEntity from "../entities/PlayerPrefab";
import { Behavior } from "../systems/BehaviorSystem";
import {
  MoveAction,
  RotateAction
} from "../actions";
import { Message, MessageAnswer, sendMessage, sendMessageToTile } from "../Message";
import { HitByMonsterMessage, MoveMessage, PressMessage, StuckInsideWallMessage } from "../messages";
import { KEY_MAPS } from "../constants";
import { includesKey, Key } from "../Input";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import { Action } from "../Action";
import { handleRestart } from "../inputs";
import { isEntityOverlappingTile } from "../functions/Vector3";
import {invariant} from "../Error";


const _tileDelta = new Vector3();
const _nextTilePosition = new Vector3();
const MOVE_DURATION = 200;

type Entity = ReturnType<typeof PlayerEntity.create>;

function getMoveDirectionFromInput(state: State): HeadingDirectionValue {
  const {pressed} = state.input;
  if (pressed in KEY_MAPS.MOVE) {
    return KEY_MAPS.MOVE[pressed as Key];
  } else if (includesKey(pressed, Key.Pointer1)) {
    // Use new touch origin logic if currently touching
    if (state.input.isTouching) {
      // Don't move if still in dead zone
      if (state.input.isInTouchDeadZone) {
        return HeadingDirectionValue.None;
      }
      const deltaX = state.input.pointerPosition.x - state.input.touchStartPosition.x;
      const deltaY = state.input.pointerPosition.y - state.input.touchStartPosition.y;
      return HeadingDirection.snapVector(deltaX, deltaY);
    }
  }
  return HeadingDirectionValue.None;
}

class PlayerBehavior extends Behavior<Entity, State> {
  onEnter(entity: Entity, context: State) {
    context.render.cameraTarget = entity.transform.position;
  }
  onUpdateEarly(entity: Entity, context: State) {
    if (entity.actions.size > 0) {
      return;
    }
    const { tilePosition } = entity;
    const actions = [] as Action<any, any>[];

    const direction = getMoveDirectionFromInput(context);
    HeadingDirection.getVector(direction, _tileDelta);
    if(direction !== HeadingDirectionValue.None) {
      _nextTilePosition.copy(_tileDelta);
      _nextTilePosition.add(tilePosition);

      const msg = sendMessageToTile(
        new MoveMessage.Into(entity),
        _nextTilePosition,
        context
      );
      const response = msg.reduceResponses();
      if (response === MoveMessage.Response.Allowed) {
        actions.push(new MoveAction(entity, context.time.time, MOVE_DURATION, _tileDelta));
      }
      if (direction !== entity.headingDirection) {
        actions.push(new RotateAction(entity, context.time.time, direction));
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
    ): MessageAnswer<MoveMessage.Into> => {
      // Get the target tile from the message
      const targetTile = message.targetTilePosition;
      invariant(targetTile !== undefined, "Target tile position is undefined in MoveMessage.Into");

      // Check if we're overlapping the target tile
      if (isEntityOverlappingTile(entity.transform.position, targetTile)) {
        return MoveMessage.Response.Blocked;
      }

      // If not overlapping, use normal collision logic
      return sendMessage(
        new MoveMessage.IntoPlayer(entity),
        message.sender,
        context
      ).reduceResponses()!;
    },
    [HitByMonsterMessage.type]: (_: Entity, context: State) => {
      handleRestart(context);
    },
    [StuckInsideWallMessage.type]: (_: Entity, context: State) => {
      handleRestart(context);
    },
    [MoveMessage.IntoFire.type]: (_: Entity, context: State) => {
      handleRestart(context);
    },
    [MoveMessage.IntoWall.type]: () => MoveMessage.Response.Blocked,
    [MoveMessage.IntoBlock.type]: () => MoveMessage.Response.Allowed,
    [MoveMessage.IntoGolem.type]: () => MoveMessage.Response.Blocked,
    [MoveMessage.IntoTerminal.type]: (_: Entity, context: State) => {
      context.currentLevelId++;
      return MoveMessage.Response.Allowed;
    }
  };
}

export default PlayerBehavior;
