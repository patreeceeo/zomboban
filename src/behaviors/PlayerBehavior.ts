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
  MoveAction,
  RotateAction
} from "../actions";
import { Message, MessageAnswer, sendMessage } from "../Message";
import { HitByMonsterMessage, MoveMessage, PressMessage, StuckInsideWallMessage } from "../messages";
import { KEY_MAPS } from "../constants";
import { includesKey, Key } from "../Input";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import { Action } from "../Action";
import { handleRestart } from "../inputs";
import { setCameraController } from "../util";

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

export class PlayerBehavior extends Behavior<Entity, BehaviorContext> {
  onEnter(entity: Entity, context: BehaviorContext) {
    setCameraController(context, entity.transform.position);
    return [];
  }
  onUpdateEarly(entity: Entity, context: BehaviorContext) {
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

      const responses = sendMessage(
        new MoveMessage.Into(entity),
        _nextTilePosition,
        context
      );
      const response = MoveMessage.reduceResponses(responses);
      if (response === MoveMessage.Response.Allowed) {
        actions.push(new MoveAction(entity, context.time, MOVE_DURATION, _tileDelta));
      }
      if (direction !== entity.headingDirection) {
        actions.push(new RotateAction(entity, context.time, direction));
      }
    }

    sendMessage(new PressMessage(entity), tilePosition, context);

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
    [HitByMonsterMessage.type]: (_: Entity, context: BehaviorContext) => {
      handleRestart(context);
    },
    [StuckInsideWallMessage.type]: (_: Entity, context: BehaviorContext) => {
      handleRestart(context);
    },
    [MoveMessage.IntoFire.type]: (_: Entity, context: BehaviorContext) => {
      handleRestart(context);
    },
    [MoveMessage.IntoWall.type]: () => MoveMessage.Response.Blocked,
    [MoveMessage.IntoBlock.type]: () => MoveMessage.Response.Allowed,
    [MoveMessage.IntoGolem.type]: () => MoveMessage.Response.Blocked,
    [MoveMessage.IntoTerminal.type]: (_: Entity, context: BehaviorContext) => {
      context.currentLevelId++;
      return MoveMessage.Response.Allowed;
    }
  };
}
