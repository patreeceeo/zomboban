import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityPrefab";
import {
  InSceneTag,
  BehaviorComponent,
  HeadingDirectionComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { BehaviorState, EntityManagerState } from "../state";
import { ASSET_IDS } from "../assets";
import { BehaviorEnum } from "../behaviors";

type Context = EntityManagerState & BehaviorState;
const MonsterEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof TilePositionComponent
    | typeof HeadingDirectionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: BehaviorEnum.Monster
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSET_IDS.monster
    });

    HeadingDirectionComponent.add(entity);

    IsGameEntityTag.add(entity);

    InSceneTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

export default MonsterEntity;
