import { State } from "../state";
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
import { ASSET_IDS } from "../Zomboban";
import { BehaviorEnum } from "../behaviors";

const TerminalEntity: IEntityPrefab<
  State,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof TilePositionComponent
  >
> = {
  isPlatform: false,
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: BehaviorEnum.Terminal
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSET_IDS.terminal
    });

    IsGameEntityTag.add(entity);

    InSceneTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

export default TerminalEntity;
