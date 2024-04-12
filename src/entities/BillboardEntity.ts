import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import {
  AddedTag,
  RenderOptionsComponent,
  TransformComponent,
  ViewportTransformComponent
} from "../components";
import { BehaviorCacheState, EntityManagerState } from "../state";

export const BillboardEntity: IEntityPrefab<
  BehaviorCacheState & EntityManagerState,
  EntityWithComponents<
    typeof TransformComponent | typeof ViewportTransformComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();
    AddedTag.add(entity);
    TransformComponent.add(entity);
    ViewportTransformComponent.add(entity);
    RenderOptionsComponent.add(entity, { renderOrder: 1, depthTest: false });
    return entity;
  },
  destroy(entity) {
    AddedTag.remove(entity);
    TransformComponent.remove(entity);
    ViewportTransformComponent.remove(entity);
    RenderOptionsComponent.remove(entity);
    return entity;
  }
};
