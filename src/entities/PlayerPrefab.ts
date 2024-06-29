import { Vector3 } from "three";
import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Key } from "../Input";
import { Message, createMessage, hasAnswer, sendMessage } from "../Message";
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
  TimeState,
  TilesState
} from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { HeadingDirection } from "../HeadingDirection";
import { CanMoveMessage, WinMessage } from "../messages";
import { WallBehavior } from "./WallEntity";
import { Action } from "../Action";

type BehaviorContext = CameraState &
  InputState &
  MetaState &
  TimeState &
  TilesState &
  BehaviorState;

const delta = new Vector3();

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

    if (inputPressed in KEY_MAPS.MOVE) {
      const direction = KEY_MAPS.MOVE[inputPressed as Key];
      HeadingDirection.getVector(direction, delta);
      const receiver = CanMoveMessage.getReceiver(
        delta,
        entity.tilePosition,
        context
      );

      if (receiver) {
        sendMessage(
          createMessage(CanMoveMessage, delta).from(entity).to(receiver),
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
        const moveAction = new MoveAction(entity, context.time, delta);
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
