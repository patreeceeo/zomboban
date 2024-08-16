import { EntityManagerState } from "../state";
import { IEntityPrefab } from "../EntityPrefab";
import { EntityWithComponents } from "../Component";
import {
  InSceneTag,
  AnimationComponent,
  BehaviorComponent,
  IsGameEntityTag,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { convertToPixels } from "../units/convert";
import {
  AnimationClipJson,
  AnimationJson,
  KeyframeTrackJson
} from "../Animation";
import { ASSET_IDS } from "../assets";
import { BehaviorEnum } from "../behaviors";

export const ToggleButtonEntity: IEntityPrefab<
  EntityManagerState,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof AnimationComponent
    | typeof TilePositionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: BehaviorEnum.ToggleButton
    });

    TransformComponent.add(entity);
    const { position } = entity.transform;
    position.setZ(position.z + convertToPixels(1 as Tile));

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

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};
