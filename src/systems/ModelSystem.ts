import { SystemWithQueries } from "../System";
import { ModelComponent, TransformComponent } from "../components";
import { ModelCacheState, QueryState, TimeState } from "../state";
import { EntityWithComponents } from "../Component";
import { AnimationMixer } from "three";
import { BLOCK_HEIGHT } from "../constants";
import { invariant } from "../Error";
import { GLTF, SkeletonUtils } from "three/examples/jsm/Addons.js";

type Context = QueryState & ModelCacheState & TimeState;

export class ModelSystem extends SystemWithQueries<Context> {
  modelQuery = this.createQuery([ModelComponent, TransformComponent]);
  start(context: Context): void {
    this.modelQuery.stream(async (entity) => {
      const { modelId } = entity;
      const model = context.getModel(modelId);
      invariant(model !== undefined, `Model not found: ${modelId}`);
      this.setModelForEntity(entity, context, model);
    });
  }
  getModelFromEntity(entity: EntityWithComponents<typeof TransformComponent>) {
    return entity.transform.children[0];
  }
  setModelForEntity(
    entity: EntityWithComponents<typeof TransformComponent>,
    context: Context,
    model: GLTF
  ) {
    this.removeModelFromEntity(entity);
    // TODO(perf) use InstancedMesh
    const clone = SkeletonUtils.clone(model.scene);
    clone.position.z -= BLOCK_HEIGHT / 2;
    clone.rotateX(Math.PI / 2);
    clone.userData.modelId = model.userData.modelId;
    entity.transform.add(clone);

    if (model.animations.length > 0) {
      const mixer = new AnimationMixer(clone);
      const firstClip = Object.values(model.animations)[0];
      const action = mixer.clipAction(firstClip);
      action.play();
      context.addAnimationMixer(clone, mixer);
    }
  }
  removeModelFromEntity(
    entity: EntityWithComponents<typeof TransformComponent>
  ) {
    entity.transform.children.pop();
  }

  update(context: Context): void {
    const dt = context.dt;

    for (const mixer of context.listAnimationMixers()) {
      mixer.update(dt / 1000);
    }
  }
}
