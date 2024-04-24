import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import {
  AddedTag,
  TransformComponent,
  TypewriterCursorsComponent
} from "../components";
import { EntityManagerState, InputState, TypewriterState } from "../state";

type Context = InputState & TypewriterState;
type Entity = EntityWithComponents<
  typeof TransformComponent | typeof TypewriterCursorsComponent
>;

export const BillboardEntity: IEntityPrefab<
  EntityManagerState & Context,
  Entity
> = {
  create(state) {
    const entity = state.addEntity();
    AddedTag.add(entity);
    TransformComponent.add(entity);
    TypewriterCursorsComponent.add(entity);

    entity.cursors.default = state.typewriter.createCursor();
    return entity;
  },
  destroy(entity) {
    for (const cursor of Object.values(entity.cursors)) {
      cursor.destroy();
    }
    AddedTag.remove(entity);
    TransformComponent.remove(entity);
    TypewriterCursorsComponent.remove(entity);
    return entity;
  }
};
