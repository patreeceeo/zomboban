import { SystemWithQueries } from "../System";
import { ModelComponent, TransformComponent } from "../components";
import { State } from "../state";
import {
  AnimationClip,
  AnimationMixer,
  Object3D,
} from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { BLOCK_HEIGHT } from "../constants";

type Context = State;

const nullObject = new Object3D();
const nullMixer = new AnimationMixer(nullObject);

export class Model3D {
  #object = nullObject;
  source: undefined | GLTF = undefined;
  constructor(readonly parent: Object3D) {}

  setObject(object: Object3D) {
    const { parent } = this;
    parent.children.length = 0;
    object.position.z -= BLOCK_HEIGHT / 2;
    object.rotateX(Math.PI / 2);
    parent.add(object);
    this.#object = object;
  }

  get object() {
    return this.#object;
  }

  static fromGltf(gltf: GLTF, parent: Object3D) {
    const clone = cloneSkeleton(gltf.scene);
    const model =
      gltf.animations.length > 0
        ? new AnimatedModel3d(parent, gltf.animations)
        : new Model3D(parent);
    model.setObject(clone);
    model.source = gltf;
    return model;
  }

  isAnimated(): this is AnimatedModel3d {
    return false;
  }
}

export class AnimatedModel3d extends Model3D {
  #mixer = nullMixer;
  constructor(
    parent: Object3D,
    readonly animations: AnimationClip[]
  ) {
    super(parent);
  }

  setObject(object: Object3D): void {
    super.setObject(object);
    this.#mixer = new AnimationMixer(object);
  }

  isAnimated(): this is AnimatedModel3d {
    return true;
  }

  playAnimation(index: number) {
    const clip = Object.values(this.animations)[index];
    const action = this.#mixer.clipAction(clip);
    action.play();
  }

  get mixer() {
    return this.#mixer;
  }
}

export class ModelSystem extends SystemWithQueries<Context> {
  modelQuery = this.createQuery([ModelComponent, TransformComponent]);
  transformQuery = this.createQuery([TransformComponent]);
  start(context: Context): void {
    this.modelQuery.onRemove((entity) => {
      context.removeAnimationMixer(entity.transform.uuid);
    });
  }

  update(context: Context): void {
    const dt = context.dt;

    for (const entity of this.modelQuery) {
      const { modelId, model, transform } = entity;
      const gltf = context.getModel(modelId);
      if (model.source !== gltf) {
        const newModel = (entity.model = Model3D.fromGltf(gltf, transform));
        if (newModel.isAnimated()) {
          context.addAnimationMixer(transform.uuid, newModel.mixer);
          newModel.playAnimation(0);
        }
      }
    }

    for (const mixer of context.listAnimationMixers()) {
      mixer.update(dt / 1000);
    }
  }
}
