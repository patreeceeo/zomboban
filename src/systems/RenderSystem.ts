import {
  Sprite,
  Material,
  Mesh,
  OrthographicCamera,
  Scene,
  WebGLRenderer
} from "../Three";
import { SystemWithQueries } from "../System";
import {
  InSceneTag,
  RenderOptionsComponent,
  TransformComponent
} from "../components";
import {
  CameraState,
  QueryState,
  RendererState,
  SceneState,
  TimeState
} from "../state";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPixelatedPass } from "three/examples/jsm/postprocessing/RenderPixelatedPass.js";
import { invariant } from "../Error";
import { VIEWPORT_SIZE } from "../constants";
import { EntityWithComponents } from "../Component";

declare const canvas: HTMLCanvasElement;

export function createRenderer() {
  invariant(
    canvas instanceof HTMLCanvasElement,
    `Missing canvas element with id "canvas"`
  );
  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    precision: "lowp",
    powerPreference: "low-power"
  });
  renderer.setSize(VIEWPORT_SIZE.x, VIEWPORT_SIZE.y);
  // We want these to be set with CSS
  Object.assign(canvas.style, {
    width: "",
    height: ""
  });

  return renderer;
}

export function createEffectComposer(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: OrthographicCamera
) {
  const composer = new EffectComposer(renderer);
  const pixelatedPass = new RenderPixelatedPass(2, scene, camera, {
    depthEdgeStrength: -0.5,
    normalEdgeStrength: -1
  });
  composer.addPass(pixelatedPass);

  return composer;
}

type Context = QueryState &
  RendererState &
  SceneState &
  TimeState &
  CameraState;

export class RenderSystem extends SystemWithQueries<Context> {
  renderOptionsQuery = this.createQuery([
    RenderOptionsComponent,
    TransformComponent,
    InSceneTag
  ]);
  start(state: Context) {
    const renderQuery = this.createQuery([TransformComponent, InSceneTag]);

    this.resources.push(
      renderQuery.stream((entity) => {
        const { scene } = state;
        const { transform } = entity;
        transform.removeFromParent();
        transform.parent = scene;
        scene.children.push(transform);
        state.shouldRerender = true;
      }),
      renderQuery.onRemove((entity) => {
        const { scene } = state;
        const { transform } = entity;
        const index = scene.children.indexOf(transform);
        invariant(index !== -1, `Entity not found in scene`);
        transform.parent = null;
        scene.children.splice(index, 1);
        state.shouldRerender = true;
      })
    );
  }
  render(state: Context) {
    state.composer.render(state.dt);
  }
  setRenderOptions(
    entity: EntityWithComponents<
      typeof RenderOptionsComponent | typeof TransformComponent
    >
  ) {
    const meshes = [];
    for (const child of entity.transform.children) {
      if (child instanceof Mesh || child instanceof Sprite) {
        meshes.push(child);
      }
    }
    for (const mesh of meshes) {
      mesh.renderOrder = entity.renderOrder;
      invariant(
        mesh.material instanceof Material,
        `Multiple materials per mesh not supported`
      );
      mesh.material.depthTest = entity.depthTest;
    }
  }
  update(state: Context) {
    if (state.shouldRerender) {
      for (const entity of this.renderOptionsQuery) {
        this.setRenderOptions(entity);
      }

      this.render(state);
      state.shouldRerender = false;
    }
  }
}
