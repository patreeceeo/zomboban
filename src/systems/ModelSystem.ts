import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { SystemWithQueries } from "../System";
import { ModelComponent, TransformComponent } from "../components";
import { ModelCacheState, QueryState } from "../state";
import { EntityWithComponents } from "../Component";
import { Object3D } from "three";
import { BASE_URL, BLOCK_HEIGHT } from "../constants";

type Context = QueryState & ModelCacheState;

export class ModelSystem extends SystemWithQueries<Context> {
  modelQuery = this.createQuery([ModelComponent, TransformComponent]);
  start(context: Context): void {
    this.modelQuery.stream(async (entity) => {
      const { modelId } = entity;
      if (!context.hasModel(modelId)) {
        const model = await this.loadModel(modelId, context);
        this.setModelForEntity(entity, model);
      } else {
        const model = context.getModel(modelId);
        this.setModelForEntity(entity, model);
      }
    });
  }
  #loader = new GLTFLoader();
  loadModel(modelId: string, context: Context) {
    return new Promise<Object3D>((resolve) => {
      this.#loader.load(`${BASE_URL}/${modelId}`, ({ scene }) => {
        scene.userData.modelId = modelId;
        context.addModel(modelId, scene);
        resolve(scene);
      });
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
