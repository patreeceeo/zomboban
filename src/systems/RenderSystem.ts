import {
  Material,
  Mesh,
  OrthographicCamera,
  Scene,
  WebGLRenderer
} from "three";
import { SystemWithQueries } from "../System";
import {
  AddedTag,
  AnimationComponent,
  ChangingTag,
  ModelComponent,
  RenderOptionsComponent,
  TransformComponent
} from "../components";
import { Observable } from "../Observable";
import {
  CameraState,
  QueryState,
  RendererState,
  SceneState,
  TimeState
} from "../state";
import {
  EffectComposer,
  RenderPixelatedPass
} from "three/examples/jsm/Addons.js";
import { Some } from "../Query";
import { invariant } from "../Error";
import { VIEWPORT_SIZE } from "../constants";

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
  camera: OrthographicCamera,
  zoomObservable: Observable<number>
) {
  const composer = new EffectComposer(renderer);
  const pixelatedPass = new RenderPixelatedPass(camera.zoom, scene, camera, {
    depthEdgeStrength: -0.5,
    normalEdgeStrength: -1
  });
  composer.addPass(pixelatedPass);

  zoomObservable.subscribe((zoom) => {
    pixelatedPass.setPixelSize(zoom);
  });

  return composer;
}

type Context = QueryState &
  RendererState &
  SceneState &
  TimeState &
  CameraState;

export class RenderSystem extends SystemWithQueries<Context> {
  changingQuery = this.createQuery([ChangingTag]);
  start(state: Context) {
    const renderQuery = this.createQuery([TransformComponent, AddedTag]);
    const renderOptionsQuery = this.createQuery([
      TransformComponent,
      // AddedTag TODO
      RenderOptionsComponent,
      Some(AnimationComponent, ModelComponent)
    ]);

    this.resources.push(
      renderQuery.stream((entity) => {
        state.scene.add(entity.transform);
        this.render(state);
      }),
      renderQuery.onRemove((entity) => {
        state.scene.remove(entity.transform);
        this.render(state);
      })
    );

    this.resources.push(
      renderOptionsQuery.stream((entity) => {
        const meshes = [];
        for (const child of entity.transform.children) {
          if (child instanceof Mesh) {
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
      })
    );
  }
  render(state: Context) {
    state.composer.render(state.dt);
  }
  update(state: Context) {
    if (this.changingQuery.size > 0 || state.forceRender) {
      this.render(state);
    }
    state.forceRender = false;
  }
}
