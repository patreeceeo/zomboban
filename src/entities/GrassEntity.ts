import { EntityManagerState } from "../state";
import { IEntityPrefab } from "../EntityPrefab";
import { EntityWithComponents } from "../Component";
import {
  InSceneTag,
  BehaviorComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { ASSET_IDS } from "../assets";
import { BehaviorEnum } from "../behaviors";

const GrassEntity: IEntityPrefab<
  EntityManagerState,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof TilePositionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: BehaviorEnum.Grass
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSET_IDS.grass
    });

    IsGameEntityTag.add(entity);

    InSceneTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

export default GrassEntity;
