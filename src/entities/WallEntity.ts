import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { Message } from "../Message";
import {
  AddedTag,
  BehaviorComponent,
  IdComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { ASSETS } from "../constants";
import { CanMoveMessage } from "../messages";
import { BehaviorState, EntityManagerState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";

export class WallBehavior extends Behavior<any, any> {
  static id = "behavior/wall";
  onReceive(message: Message<any>) {
    if (message instanceof CanMoveMessage) {
      message.answer = false;
    }
  }
}

type Context = EntityManagerState & BehaviorState;
export const WallEntity: IEntityPrefab<
  Context,
  EntityWithComponents<typeof BehaviorComponent | typeof TransformComponent>
> = {
  create(state) {
    const entity = state.addEntity();

    IdComponent.add(entity);

    BehaviorComponent.add(entity, {
      behaviorId: WallBehavior.id
    });

    ModelComponent.add(entity, {
      modelId: ASSETS.wall
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    IsGameEntityTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};
