import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityPrefab";
import {
  InSceneTag,
  AnimationComponent,
  BehaviorComponent,
  RenderOptionsComponent,
  TransformComponent,
  CursorTag
} from "../components";
import { invariant } from "../Error";
import {
  AnimationClipJson,
  AnimationJson,
  KeyframeTrackJson
} from "../Animation";
import { ASSET_IDS } from "../Zomboban";
import { BehaviorEnum } from "../behaviors";
import {isClient} from "../util";

const CursorEntity: IEntityPrefab<
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof AnimationComponent
  >
> = {
  isPlatform: false,
  create(world) {
    const entity = world.addEntity();

    invariant(
      isClient,
      `Editor cursor should only be created on the client`
    );

    BehaviorComponent.add(entity, {
      behaviorId: BehaviorEnum.Cursor
    });

    const animation = new AnimationJson([
      new AnimationClipJson("normal", 0, [
        new KeyframeTrackJson(
          "default",
          "string",
          [0],
          [ASSET_IDS.editorNormalCursor]
        )
      ]),
      new AnimationClipJson("replace", 0, [
        new KeyframeTrackJson(
          "default",
          "string",
          [0],
          [ASSET_IDS.editorReplaceCursor]
        )
      ])
    ]);

    AnimationComponent.add(entity, {
      animation
    });

    TransformComponent.add(entity);

    RenderOptionsComponent.add(entity, {
      renderOrder: 1,
      depthTest: false,
      opacity: 1
    });

    InSceneTag.add(entity);

    CursorTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};

export default CursorEntity;
