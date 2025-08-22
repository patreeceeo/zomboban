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
import { ASSET_IDS } from "../Zomboban";
import { BehaviorEnum } from "../behaviors";

const MonsterEntity: IEntityPrefab<
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof TilePositionComponent
    | typeof HeadingDirectionComponent
  >
> = {
  isPlatform: false,
  create(world) {
    const entity = world.addEntity();

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
