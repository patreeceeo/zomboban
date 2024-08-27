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
import { Message, sendMessage, sendMessageToEachWithin } from "../Message";
import {
  MoveIntoBlockMessage,
  MoveIntoGolemMessage,
  MoveIntoGrassMessage,
  MoveIntoMessage,
  MoveIntoPlayerMessage,
  MoveIntoTerminalMessage,
  MoveIntoWallMessage,
  WinMessage
} from "../messages";
import { KEY_MAPS } from "../constants";
import { Key } from "../Input";
import { HeadingDirection } from "../HeadingDirection";
import { convertPropertiesToTiles } from "../units/convert";
import { Action } from "../Action";

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

    sendMessageToEachWithin(
      (receiver) => new MoveIntoMessage(receiver, entity),
      context,
      vecInTiles
    );

    if (inputPressed in KEY_MAPS.MOVE) {
      const direction = KEY_MAPS.MOVE[inputPressed as Key];
      HeadingDirection.getVector(direction, vecInPixels);
      vecInTiles.copy(vecInPixels);
      convertPropertiesToTiles(vecInTiles);
      vecInTiles.add(tilePosition);

      sendMessageToEachWithin(
        (receiver) => new MoveIntoMessage(receiver, entity),
        context,
        vecInTiles
      );
    }
  }

  #blockingMessages = [
    MoveIntoWallMessage,
    MoveIntoGrassMessage,
    MoveIntoGolemMessage
  ];

  onUpdateLate(entity: Entity, context: BehaviorContext) {
    if (entity.actions.size > 0) {
      return;
    }
    const { inputPressed } = context;
    const actions = [] as Action<any, any>[];

    if (inputPressed in KEY_MAPS.MOVE) {
      const direction = KEY_MAPS.MOVE[inputPressed as Key];

      // TODO encapsulate shared logic b/t monster and player
      // const canMoveMessages = entity.outbox.getAll(MoveIntoMessage);
      const { inbox, outbox } = entity;

      if (inbox.getAll(MoveIntoBlockMessage).size > 0) {
        // console.log("Player received MoveIntoBlock");
        const msgs = outbox.getAll(MoveIntoMessage);
        // console.log("MoveInto messages from Player's outbox", msgs);
        for (const msg of msgs) {
          if (msg.response === false) return [];
        }
      }

      const blockingMessageCount = inbox.count(this.#blockingMessages);

      if (blockingMessageCount === 0) {
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

  messageHandlers = {
    [MoveIntoMessage.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ) => sendMessage(new MoveIntoPlayerMessage(message.sender, entity), context)
  };
}
