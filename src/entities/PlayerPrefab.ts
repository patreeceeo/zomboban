import { Vector3 } from "three";
import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key } from "../Input";
import {
  Message,
  createMessage,
  getReceiver,
  hasAnswer,
  sendMessage
} from "../Message";
import {
  ControlCameraAction,
  MoveAction,
  PlayerWinAction,
  RotateAction
} from "../actions";
import {
  AddedTag,
  BehaviorComponent,
  HeadingDirectionComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { ASSETS, KEY_MAPS } from "../constants";
import {
  BehaviorState,
  CameraState,
  EntityManagerState,
  MetaState,
  InputState,
  TimeState
} from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { HeadingDirection } from "../HeadingDirection";
import { CanMoveMessage, WinMessage } from "../messages";
import { WallBehavior } from "./WallEntity";
import { Action } from "../Action";
import { convertPropertiesToTiles } from "../units/convert";
import { ITilesState } from "../systems/TileSystem";

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
  static id = "behavior/player";
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
    vecInTiles.copy(tilePosition);
    vecInTiles.z -= 1;
    const receiver = getReceiver(context.tiles, vecInTiles);

    if (receiver) {
      sendMessage(
        createMessage(CanMoveMessage, vecInPixels).from(entity).to(receiver),
        context
      );
    }

    if (inputPressed in KEY_MAPS.MOVE) {
      const direction = KEY_MAPS.MOVE[inputPressed as Key];
      HeadingDirection.getVector(direction, vecInPixels);
      vecInTiles.copy(vecInPixels);
      convertPropertiesToTiles(vecInTiles);
      vecInTiles.add(tilePosition);
      const receiver = getReceiver(context.tiles, vecInTiles);

      if (receiver) {
        sendMessage(
          createMessage(CanMoveMessage, vecInPixels).from(entity).to(receiver),
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

      const canMoveMessages = entity.outbox.getAll(CanMoveMessage);
      if (canMoveMessages.size === 0 || hasAnswer(canMoveMessages, true)) {
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

    return actions;
  }

  onReceive(message: Message<any>) {
    WallBehavior.prototype.onReceive(message);
  }
}

type Context = EntityManagerState & BehaviorState;
export const PlayerEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof TilePositionComponent
    | typeof ModelComponent
    | typeof HeadingDirectionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: "behavior/player"
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    HeadingDirectionComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSETS.player
    });

    IsGameEntityTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};
