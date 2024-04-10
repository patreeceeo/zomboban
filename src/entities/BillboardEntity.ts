import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { BillboardAction } from "../actions";
import {
  AddedTag,
  BehaviorComponent,
  InputReceiverTag,
  IsActiveTag,
  RenderOptionsComponent,
  TransformComponent
} from "../components";
import { BehaviorCacheState, CameraState, EntityManagerState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";

class BillboardBehavior extends Behavior<
  EntityWithComponents<typeof TransformComponent | typeof BehaviorComponent>,
  CameraState
> {
  start() {
    return [new BillboardAction()];
  }
  mapInput() {
    return [new BillboardAction()];
  }
  chain(): void {}
}

export const BillboardEntity: IEntityPrefab<
  BehaviorCacheState & EntityManagerState,
  EntityWithComponents<typeof TransformComponent>
> = {
  create(state) {
    const entity = state.addEntity();
    AddedTag.add(entity);
    TransformComponent.add(entity);
    InputReceiverTag.add(entity);
    IsActiveTag.add(entity);
    RenderOptionsComponent.add(entity, { renderOrder: 1, depthTest: false });
    BehaviorComponent.add(entity, { behaviorId: "behavior/billboard" });
    if (!state.hasBehavior(entity.behaviorId)) {
      state.addBehavior(entity.behaviorId, new BillboardBehavior());
    }
    return entity;
  },
  destroy(entity) {
    AddedTag.remove(entity);
    TransformComponent.remove(entity);
    InputReceiverTag.remove(entity);
    IsActiveTag.remove(entity);
    RenderOptionsComponent.remove(entity);
    BehaviorComponent.remove(entity);
    return entity;
  }
};
