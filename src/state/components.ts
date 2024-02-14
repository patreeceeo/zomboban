import { ComponentRegistry } from "../Component";
import * as index from "../components";

export function createComponentRegistery(
  onAddComponent: (
    type: index.ComponentConstructor<any>,
    entityId: number,
    value: any,
  ) => void,
  onRemoveComponent: (
    type: index.ComponentConstructor<any>,
    entityId: number,
  ) => void,
) {
  const isRenderDirty = new index.IsRenderDirtyComponent();
  const reg = new ComponentRegistry(onAddComponent, onRemoveComponent);
  const posX = new index.PositionXComponent(isRenderDirty);
  const posY = new index.PositionYComponent(isRenderDirty);
  const components = [
    new index.AnimationComponent(),
    new index.ImageComponent(),
    new index.ImageIdComponent(isRenderDirty),
    new index.IsVisibleComponent(isRenderDirty),
    new index.LayerIdComponent(),
    new index.LoadingStateComponent(),
    posX,
    posY,
    new index.TintComponent(isRenderDirty),
    new index.VelocityXComponent(),
    new index.VelocityYComponent(),
    new index.WorldIdComponent(),
    new index.PromiseComponent(),
    new index.BehaviorComponent(),
    new index.CameraFollowComponent(),
    new index.DisplayContainerComponent(isRenderDirty),
    new index.EntityFrameOperationComponent(),
    new index.GuidComponent(),
    new index.IsAddedComponent(),
    new index.IsRemovedComponent(),
    new index.ShouldSaveComponent(),
    isRenderDirty,
  ];
  for (const component of components) {
    reg.register(component);
  }
  reg.register(new index.PositionComponent(posX, posY));
  return reg;
}
