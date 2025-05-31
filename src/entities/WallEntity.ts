import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityPrefab";
import { ASSET_IDS } from "../assets";
import { BehaviorEnum } from "../behaviors";
import {
  InSceneTag,
  BehaviorComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { BehaviorState, EntityManagerState } from "../state";

type Context = EntityManagerState & BehaviorState;
const WallEntity: IEntityPrefab<
  Context,
  EntityWithComponents<typeof BehaviorComponent | typeof TransformComponent>
> = {
  isPlatform: false,
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: BehaviorEnum.Wall
    });

    ModelComponent.add(entity, {
      modelId: ASSET_IDS.wall
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    IsGameEntityTag.add(entity);

    InSceneTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

export default WallEntity;
