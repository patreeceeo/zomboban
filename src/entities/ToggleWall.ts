import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityPrefab";
import { ASSET_IDS } from "../Zomboban";
import { BehaviorEnum } from "../behaviors";
import {
  InSceneTag,
  BehaviorComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  ToggleableComponent,
  TransformComponent,
} from "../components";

const ToggleWallEntity: IEntityPrefab<
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof ToggleableComponent
    | typeof ModelComponent
  >
> = {
  isPlatform: false,
  create(state) {
    const entity = state.addEntity();

    ToggleableComponent.add(entity);

    BehaviorComponent.add(entity, {
      behaviorId: BehaviorEnum.ToggleWall
    });

    ModelComponent.add(entity, {
      modelId: ASSET_IDS.toggleWall
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

export default ToggleWallEntity;
