import { Vector3 } from "three";
import {
  InputState,
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


const _tileDelta = new Vector3();
const _nextTilePosition = new Vector3();
const MOVE_DURATION = 200;

type Entity = ReturnType<typeof PlayerEntity.create>;

function getMoveDirectionFromInput(state: InputState): HeadingDirectionValue {
  const {inputPressed} = state;
  if (inputPressed in KEY_MAPS.MOVE) {
    return KEY_MAPS.MOVE[inputPressed as Key];
  } else if (includesKey(inputPressed, Key.Pointer1)) {
    const { x, y } = state.pointerPosition;
    return HeadingDirection.snapVector(x, y)
  }
  return HeadingDirectionValue.None;
}

class PlayerBehavior extends Behavior<Entity, State> {
  onEnter(entity: Entity, context: State) {
    context.cameraTarget = entity.transform.position;
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
    ): MessageAnswer<MoveMessage.Into> =>
      sendMessage(
        new MoveMessage.IntoPlayer(entity),
        message.sender,
        context
      ).reduceResponses()!,
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
