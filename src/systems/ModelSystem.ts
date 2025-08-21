import { SystemWithQueries } from "../System";
import { ModelComponent, TransformComponent } from "../components";
import { State } from "../state";
import {
  AnimationClip,
  AnimationMixer,
  Object3D,
} from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { BASE_URL, BLOCK_HEIGHT } from "../constants";
import {GLTF} from "../GLTFLoader";
import {invariant} from "../Error";
import {LoadingItem} from "./LoadingSystem";
import {joinPath} from "../util";
import {EntityForQueryResults} from "../Query";

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

export class ModelSystem extends SystemWithQueries<State> {
  modelQuery = this.createQuery([ModelComponent, TransformComponent]);
  transformQuery = this.createQuery([TransformComponent]);

  static setEntityModel(context: State, entity: EntityForQueryResults<typeof this.prototype.modelQuery>, gltf: GLTF): void {
    const newModel = (entity.model = Model3D.fromGltf(gltf, entity.transform));
    if (newModel.isAnimated()) {
      context.animationMixer.set(entity.transform.uuid, newModel.mixer);
      newModel.playAnimation(0);
    }
  }

  start(context: State): void {
    this.resources.push(
      this.modelQuery.stream((entity) => {
        // Load model if not already loaded
        const { modelId } = entity;
        if(context.model.has(modelId)) {
            const gltf = context.model.get(modelId);
            invariant(gltf !== undefined, `Model ${modelId} not found`);
            ModelSystem.setEntityModel(context, entity, gltf);
        } else {
          const item = new LoadingItem(modelId, async () => {
            const gltf = await context.model.load(modelId, joinPath(BASE_URL, modelId))
            ModelSystem.setEntityModel(context, entity, gltf);
          })
          context.loadingItems.add(item);
        }
      }),
      this.modelQuery.onRemove((entity) => {
        context.animationMixer.delete(entity.transform.uuid);
      })
    )
  }

  update(context: State): void {
    const dt = context.time.frameDelta;

    for (const mixer of context.animationMixer.values()) {
      mixer.update(dt / 1000);
    }
  }
}
