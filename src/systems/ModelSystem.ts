import { SystemWithQueries } from "../System";
import { ModelComponent, TransformComponent } from "../components";
import { ModelCacheState, QueryState } from "../state";
import { EntityWithComponents } from "../Component";
import { Object3D } from "three";
import { BLOCK_HEIGHT } from "../constants";
import { invariant } from "../Error";

type Context = QueryState & ModelCacheState;

export class ModelSystem extends SystemWithQueries<Context> {
  modelQuery = this.createQuery([ModelComponent, TransformComponent]);
  start(context: Context): void {
    this.modelQuery.stream(async (entity) => {
      const { modelId } = entity;
      const model = context.getModel(modelId);
      invariant(model !== undefined, `Model not found: ${modelId}`);
      this.setModelForEntity(entity, model);
    });
  }
  getModelFromEntity(entity: EntityWithComponents<typeof TransformComponent>) {
    return entity.transform.children[0];
  }
  setModelForEntity(
    entity: EntityWithComponents<typeof TransformComponent>,
    model: Object3D
  ) {
    this.removeModelFromEntity(entity);
    // TODO(perf) use InstancedMesh
    const clone = model.clone(true);
    clone.position.z -= BLOCK_HEIGHT / 2;
    clone.rotateX(Math.PI / 2);
    clone.userData.modelId = model.userData.modelId;
    entity.transform.add(clone);
  }
  removeModelFromEntity(
    entity: EntityWithComponents<typeof TransformComponent>
  ) {
    entity.transform.children.pop();
  }
}
