import { Vector3 } from "../Three";
import {
  BehaviorState,
  CameraState,
  InputState,
  MetaState,
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
import {
  Message,
  createMessage,
  getReceivers,
  hasAnswer,
  sendMessage
} from "../Message";
import {
  MoveIntoMessage,
  MoveIntoTerminalMessage,
  WinMessage
} from "../messages";
import { KEY_MAPS } from "../constants";
import { Key } from "../Input";
import { HeadingDirection } from "../HeadingDirection";
import { convertPropertiesToTiles } from "../units/convert";
import { Action } from "../Action";
import { WallBehavior } from "./WallBehavior";

type BehaviorContext = CameraState &
  InputState &
  MetaState &
  TimeState &
  ITilesState &
  BehaviorState;

const vecInPixels = new Vector3();
const vecInTiles = new Vector3();

type Entity = ReturnType<typeof PlayerEntity.create>;

export class PlayerBehavior extends Behavior<Entity, BehaviorContext> {
  onEnter(entity: Entity, context: BehaviorContext) {
    return [new ControlCameraAction(entity, context.time)];
  }
  onUpdateEarly(entity: Entity, context: BehaviorContext) {
    if (entity.actions.size > 0) {
      return;
    }
    const { inputPressed } = context;
    const { tilePosition } = entity;

    // Send CanMoveMessage down to press buttons
    // TODO revisit when tile system is 3D
    vecInTiles.copy(tilePosition);
    vecInTiles.z -= 1;
    const receivers = getReceivers(context.tiles, vecInTiles);

    for (const receiver of receivers) {
      sendMessage(
        createMessage(MoveIntoMessage).from(entity).to(receiver),
        context
      );
    }

    if (inputPressed in KEY_MAPS.MOVE) {
      const direction = KEY_MAPS.MOVE[inputPressed as Key];
      HeadingDirection.getVector(direction, vecInPixels);
      vecInTiles.copy(vecInPixels);
      convertPropertiesToTiles(vecInTiles);
      vecInTiles.add(tilePosition);
      const receivers = getReceivers(context.tiles, vecInTiles);

      for (const receiver of receivers) {
        sendMessage(
          createMessage(MoveIntoMessage).from(entity).to(receiver),
          context
        );
      }
    }
  }

  onUpdateLate(entity: Entity, context: BehaviorContext) {
    if (entity.actions.size > 0) {
      return;
    }
    const { inputPressed } = context;
    const actions = [] as Action<any, any>[];

    if (inputPressed in KEY_MAPS.MOVE) {
      const direction = KEY_MAPS.MOVE[inputPressed as Key];

      // TODO encapsulate shared logic b/t monster and player
      const canMoveMessages = entity.outbox.getAll(MoveIntoMessage);
      if (canMoveMessages.size === 0 || !hasAnswer(canMoveMessages, false)) {
        const moveAction = new MoveAction(entity, context.time, vecInPixels);
        actions.push(moveAction);
      }

      // Add rotate action after move action because undo looks for the player's last move.
      if (direction !== entity.headingDirection) {
        actions.push(new RotateAction(entity, context.time, direction));
      }
    }

    if (entity.outbox.getAll(WinMessage).size > 0) {
      actions.push(new PlayerWinAction(entity, context.time));
    }

    // TODO keep applying double dispatch pattern to simplify behavior code
    if (entity.inbox.has(MoveIntoTerminalMessage)) {
      context.currentLevelId++;
    }

    return actions;
  }

  onReceive(message: Message<any>) {
    WallBehavior.prototype.onReceive(message);
  }
}
