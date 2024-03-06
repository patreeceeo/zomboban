import { ComponentRegistry } from "../Component";
import { Vector3 } from "../Vector3";
import * as index from "../components";

export function createComponentRegistery(
  onAddComponent: (
    type: index.ComponentConstructor<any>,
    entityId: number,
    value: any
  ) => void,
  onRemoveComponent: (
    type: index.ComponentConstructor<any>,
    entityId: number
  ) => void
) {
  const reg = new ComponentRegistry(onAddComponent, onRemoveComponent);

  const SPRITE_COMPONENT = new index.SpriteComponent();
  const POSITION_COMPONENT = new index.PositionComponent();
  const VISIBLE_COMPONENT = new index.IsVisibleComponent();
  const components = [
    // new index.AnimationComponent(),
    new index.TextureComponentOld(),
    new index.TextureIdComponentOld(),
    VISIBLE_COMPONENT,
    new index.LayerIdComponent(),
    new index.LoadingStateComponentOld(),
    SPRITE_COMPONENT,
    POSITION_COMPONENT,
    new index.PositionXComponent(),
    new index.PositionYComponent(),
    new index.TintComponent(),
    new index.VelocityXComponent(),
    new index.VelocityYComponent(),
    new index.WorldIdComponent(),
    new index.PromiseComponent(),
    new index.BehaviorComponent(),
    new index.CameraFollowComponent(),
    new index.EntityFrameOperationComponent(),
    new index.GuidComponent(),
    new index.IsAddedComponent(),
    new index.IsRemovedComponent(),
    new index.ShouldSaveComponent()
  ];
  for (const component of components) {
    reg.register(component);
  }

  SPRITE_COMPONENT.addMultiEventListener(
    ["add", "change"],
    ({ entityId, value }) => {
      // an object3d.position and the value of the position component shall be the same object
      // so that changes to one are reflected in the other
      POSITION_COMPONENT.set(entityId, value.position as Vector3<Px>);

      VISIBLE_COMPONENT.set(entityId, value.visible);
    }
  );

  SPRITE_COMPONENT.addEventListener("remove", ({ entityId }) => {
    POSITION_COMPONENT.remove(entityId);
    VISIBLE_COMPONENT.remove(entityId);
  });

  // It's okay to sync the visible state with the sprite component this way because we
  // won't be changing the visible state of the sprite component very often.
  VISIBLE_COMPONENT.addMultiEventListener(
    ["add", "change"],
    ({ entityId, value }) => {
      if (SPRITE_COMPONENT.has(entityId)) {
        SPRITE_COMPONENT.get(entityId).visible = value;
      }
    }
  );

  return reg;
}
