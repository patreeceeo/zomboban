import { World } from "./EntityManager";
import { invariant } from "./Error";
import { Camera, Renderer, Scene, Texture, Vector3 } from "three";

class State extends World {
  #renderer?: Renderer;
  #camera?: Camera;
  #cameraTarget?: Vector3;
  #scene?: Scene;

  #textures: Record<string, Texture> = {};
  addTexture(id: string, texture: Texture) {
    this.#textures[id] = texture;
  }
  getTexture(id: string) {
    return this.#textures[id];
  }

  assertRenderer() {
    invariant(this.#renderer !== undefined, "renderer is not initialized");
  }

  assertCamera() {
    invariant(this.#camera !== undefined, "camera is not initialized");
  }

  assertCameraTarget() {
    invariant(
      this.#cameraTarget !== undefined,
      "cameraTarget is not initialized"
    );
  }

  assertScene() {
    invariant(this.#scene !== undefined, "scene is not initialized");
  }

  get renderer() {
    this.assertRenderer();
    return this.#renderer!;
  }

  set renderer(renderer: Renderer) {
    this.#renderer = renderer;
  }

  get camera() {
    this.assertCamera();
    return this.#camera!;
  }

  set camera(camera: Camera) {
    this.#camera = camera;
  }

  get cameraTarget() {
    this.assertCameraTarget();
    return this.#cameraTarget!;
  }

  set cameraTarget(target: Vector3) {
    this.#cameraTarget = target;
  }

  get scene() {
    this.assertScene();
    return this.#scene!;
  }

  set scene(scene: Scene) {
    this.#scene = scene;
  }
}

export const state = new State();
