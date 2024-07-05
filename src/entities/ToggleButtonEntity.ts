import { BehaviorState, EntityManagerState, TimeState } from "../state";
import { IEntityPrefab } from "../EntityManager";
import { EntityWithComponents } from "../Component";
import {
  AddedTag,
  AnimationComponent,
  BehaviorComponent,
  IsGameEntityTag,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { ASSETS } from "../constants";
import { Behavior } from "../systems/BehaviorSystem";
// import { Message } from "../Message";
import { convertToPixels } from "../units/convert";
import {
  AnimationClipJson,
  AnimationJson,
  KeyframeTrackJson
} from "../Animation";

type BehaviorContext = TimeState & BehaviorState;

type Entity = ReturnType<typeof ToggleButtonEntity.create>;

export class ToggleButtonBehavior extends Behavior<Entity, BehaviorContext> {
  static id = "behavior/toggleButton";
  onUpdateEarly(_entity: ReturnType<typeof ToggleButtonEntity.create>) {}
  // onReceive(message: Message<any>, entity: Entity, context: BehaviorContext) {}
}

export const ToggleButtonEntity: IEntityPrefab<
  EntityManagerState,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof TilePositionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: ToggleButtonBehavior.id
    });

    TransformComponent.add(entity);
    const { position } = entity.transform;
    position.setZ(position.z + convertToPixels(1 as Tile));

    TilePositionComponent.add(entity);

    AnimationComponent.add(entity, {
      animation: new AnimationJson([
        new AnimationClipJson("default", 0, [
          new KeyframeTrackJson("default", "string", [0], [ASSETS.toggleButton])
        ])
      ])
    });

    IsGameEntityTag.add(entity);

    AddedTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};
