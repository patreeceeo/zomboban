import { Vector3 } from "../Three";
import {
  ActionsState,
  BehaviorState,
  CameraState,
  EntityManagerState,
  InputState,
  MetaState,
  RouterState,
  TimeState
} from "../state";
import { ITilesState } from "../systems/TileSystem";
import PlayerEntity from "../entities/PlayerPrefab";
import { Behavior } from "../systems/BehaviorSystem";
import {
  ControlCameraAction,
  MoveAction,
  PlayerWinAction,
  RotateAction
} from "../actions";
import { Message, MessageAnswer, sendMessage } from "../Message";
import { HitByGolemMessage, MoveMessage, WinMessage } from "../messages";
import { KEY_MAPS } from "../constants";
import { includesKey, Key, KeyCombo } from "../Input";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import { Action } from "../Action";
import { handleRestart } from "../inputs";

type BehaviorContext = CameraState &
  InputState &
  MetaState &
  TimeState &
  ITilesState &
  BehaviorState &
  RouterState &
  EntityManagerState &
  ActionsState;

const _tileDelta = new Vector3();
const _tilePosition = new Vector3();

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

export class PlayerBehavior extends Behavior<Entity, BehaviorContext> {
  onEnter(entity: Entity, context: BehaviorContext) {
    return [new ControlCameraAction(entity, context.time)];
  }
  onUpdateEarly(entity: Entity, context: BehaviorContext) {
    if (entity.actions.size > 0) {
      return;
    }
    const { tilePosition } = entity;
    const actions = [] as Action<any, any>[];

    // Send CanMoveMessage down to press buttons
    // TODO revisit when tile system is 3D
    _tilePosition.copy(tilePosition);
    _tilePosition.z -= 1;

    const msg = new MoveMessage.Into(entity);
    sendMessage(msg, _tilePosition, context);

    const direction = getMoveDirectionFromInput(context);
    HeadingDirection.getVector(direction, _tileDelta);
    if(direction !== HeadingDirectionValue.None) {
      _tilePosition.copy(_tileDelta);
      _tilePosition.add(tilePosition);

      const responses = sendMessage(
        new MoveMessage.Into(entity),
        _tilePosition,
        context
      );
      const response = MoveMessage.reduceResponses(responses);
      if (response === MoveMessage.Response.Allowed) {
        actions.push(new MoveAction(entity, context.time, _tileDelta));
      }
      if (direction !== entity.headingDirection) {
        actions.push(new RotateAction(entity, context.time, direction));
      }
    }

    if (entity.outbox.getAll(WinMessage).size > 0) {
      actions.push(new PlayerWinAction(entity, context.time));
    }

    // TODO keep applying double dispatch pattern to simplify behavior code
    if (entity.inbox.has(MoveMessage.IntoTerminal)) {
      context.currentLevelId++;
    }
    return actions;
  }

  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ): MessageAnswer<MoveMessage.Into> =>
      MoveMessage.reduceResponses(
        sendMessage(
          new MoveMessage.IntoPlayer(entity),
          message.sender.tilePosition,
          context
        )
      ),
    [HitByGolemMessage.type]: (_: Entity, context: BehaviorContext) => {
      handleRestart(context);
    },
    [MoveMessage.IntoGrass.type]: () => MoveMessage.Response.Blocked,
    [MoveMessage.IntoWall.type]: () => MoveMessage.Response.Blocked
  };
}
