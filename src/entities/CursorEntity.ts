import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { SpriteComponent2 } from "../components";
import { IMAGES } from "../constants";

function createCursorEntity() {
  const entity = {};
  SpriteComponent2.add(entity, {
    animations: [
      {
        name: "default",
        duration: 0,
        tracks: [
          {
            name: "default",
            type: "string",
            values: [IMAGES.editorNormalCursor],
            times: new Float32Array(1)
          }
        ]
      }
    ]
  });
  return entity;
}

function destroyCursorEntity(
  entity: EntityWithComponents<typeof SpriteComponent2>
) {
  SpriteComponent2.remove(entity);
  return entity;
}

export const CursorEntity: IEntityPrefab<
  EntityWithComponents<typeof SpriteComponent2>
> = {
  create: createCursorEntity,
  destroy: destroyCursorEntity
};
