import {
  AnimationClipJson,
  AnimationJson,
  KeyframeTrackJson
} from "../Animation";
import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityPrefab";
import { ASSET_IDS } from "../assets";
import { BehaviorEnum } from "../behaviors";
import {
  InSceneTag,
  AnimationComponent,
  BehaviorComponent,
  IsGameEntityTag,
  TilePositionComponent,
  ToggleableComponent,
  TransformComponent
} from "../components";
import { BehaviorState, EntityManagerState } from "../state";

type Context = EntityManagerState & BehaviorState;
const ToggleWallEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof ToggleableComponent
    | typeof AnimationComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    ToggleableComponent.add(entity);

    BehaviorComponent.add(entity, {
      behaviorId: BehaviorEnum.ToggleWall
    });

    AnimationComponent.add(entity, {
      animation: new AnimationJson([
        new AnimationClipJson("default", 0, [
          new KeyframeTrackJson("fg", "string", [0], [ASSET_IDS.toggleWall])
        ]),
        new AnimationClipJson("off", 0, [
          new KeyframeTrackJson("fg", "string", [0], [ASSET_IDS.toggleWallOff])
        ])
      ])
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
