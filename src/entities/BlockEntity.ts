import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityPrefab";
import {
  InSceneTag,
  BehaviorComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { ASSET_IDS } from "../Zomboban";
import { BehaviorEnum } from "../behaviors";

const BlockEntity: IEntityPrefab<
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof TilePositionComponent
  >
> = {
  isPlatform: false,
  create(world) {
    const entity = world.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: BehaviorEnum.Block
    });

    ModelComponent.add(entity, {
      modelId: ASSET_IDS.block
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

export default BlockEntity;
