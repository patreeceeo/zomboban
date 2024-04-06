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
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
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
  renderer.setSize(SCREENX_PX, SCREENY_PX);
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
  renderOptionsQuery = this.createQuery([
    TransformComponent,
    // AddedTag TODO
    RenderOptionsComponent,
    Some(AnimationComponent, ModelComponent)
  ]);
  start(state: Context) {
    const renderQuery = this.createQuery([TransformComponent, AddedTag]);
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
  }
  render(state: Context) {
    state.composer.render(state.dt);
  }
  update(state: Context) {
    if (this.changingQuery.size > 0) {
      this.render(state);
    }
    for (const entity of this.renderOptionsQuery) {
      if (entity.transform.children.length > 0) {
        const mesh = entity.transform.children[0] as Mesh;
        mesh.renderOrder = entity.renderOrder;
        invariant(
          mesh.material instanceof Material,
          `Multiple materials per mesh not supported`
        );
        mesh.material.depthTest = entity.depthTest;
      }
    }
  }
}
