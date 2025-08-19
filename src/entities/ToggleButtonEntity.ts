import { State } from "../state";
import { IEntityPrefab } from "../EntityPrefab";
import { EntityWithComponents } from "../Component";
import {
  InSceneTag,
  AnimationComponent,
  BehaviorComponent,
  IsGameEntityTag,
  TilePositionComponent,
  TransformComponent,
  PlatformTag
} from "../components";
import {
  AnimationClipJson,
  AnimationJson,
  KeyframeTrackJson
} from "../Animation";
import { ASSET_IDS } from "../Zomboban";
import { BehaviorEnum } from "../behaviors";

const ToggleButtonEntity: IEntityPrefab<
  State,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof AnimationComponent
    | typeof TilePositionComponent
  >
> = {
  isPlatform: true,
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: BehaviorEnum.ToggleButton
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    AnimationComponent.add(entity, {
      animation: new AnimationJson([
        new AnimationClipJson("default", 0, [
          new KeyframeTrackJson("fg", "string", [0], [ASSET_IDS.toggleButton])
        ]),
        new AnimationClipJson("press", 0, [
          new KeyframeTrackJson(
            "fg",
            "string",
            [0],
            [ASSET_IDS.toggleButtonPress]
          )
        ])
      ])
    });

    IsGameEntityTag.add(entity);

    InSceneTag.add(entity);

    PlatformTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

export default ToggleButtonEntity;
