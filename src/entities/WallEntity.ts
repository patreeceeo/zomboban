import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityPrefab";
import {ASSET_IDS} from "../Zomboban";
import { BehaviorEnum } from "../behaviors";
import {
  InSceneTag,
  BehaviorComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";

const WallEntity: IEntityPrefab<
  EntityWithComponents<typeof BehaviorComponent | typeof TransformComponent>
> = {
  isPlatform: false,
  create(world) {
    const entity = world.addEntity();

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
