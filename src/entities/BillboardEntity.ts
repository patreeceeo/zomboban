import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { FontOptions, TypewriterWriteOptions } from "../Typewriter";
import {
  AddedTag,
  RenderOptionsComponent,
  TransformComponent,
  TypewriterCursorsComponent,
  ViewportTransformComponent
} from "../components";
import { EntityManagerState, InputState, TypewriterState } from "../state";

type Context = InputState & TypewriterState;
type Entity = EntityWithComponents<
  | typeof TransformComponent
  | typeof ViewportTransformComponent
  | typeof TypewriterCursorsComponent
>;

export const BillboardEntity: IEntityPrefab<
  EntityManagerState & Context,
  Entity
> = {
  create(state) {
    const entity = state.addEntity();
    AddedTag.add(entity);
    TransformComponent.add(entity);
    RenderOptionsComponent.add(entity, { renderOrder: 1, depthTest: false });
    ViewportTransformComponent.add(entity);
    TypewriterCursorsComponent.add(entity);

    entity.viewportTransform.position.set(16, 0);
    entity.autoScroll = true;
    entity.cursors.default = state.typewriter.createCursor(
      new TypewriterWriteOptions(
        new FontOptions("optimer", 12, 1.5, 2, 0xffffff),
        entity.transform
      )
    );
    return entity;
  },
  destroy(entity) {
    AddedTag.remove(entity);
    TransformComponent.remove(entity);
    RenderOptionsComponent.remove(entity);
    ViewportTransformComponent.remove(entity);
    TypewriterCursorsComponent.remove(entity);
    return entity;
  }
};
