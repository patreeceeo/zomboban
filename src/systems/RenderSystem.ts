import {
  LinearSRGBColorSpace,
  OrthographicCamera,
  Scene,
  WebGLRenderer
} from "three";
import { SystemWithQueries } from "../System";
import { AddedTag, SpriteComponent2 } from "../components";
import { SCREENX_PX, SCREENY_PX } from "../units/convert";
import { IObservableSubscription, Observable } from "../Observable";
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

export function createRenderer() {
  const parentEl = document.getElementById("game")!;
  const renderer = new WebGLRenderer();
  renderer.setSize(SCREENX_PX, SCREENY_PX);
  // We want these to be set with CSS
  Object.assign(renderer.domElement.style, {
    width: "",
    height: ""
  });
  parentEl.appendChild(renderer.domElement);

  // ensure that textures are not color-shifted
  renderer.outputColorSpace = LinearSRGBColorSpace;

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
  #subscriptions = [] as IObservableSubscription[];
  start(state: Context) {
    const spriteQuery = this.createQuery([SpriteComponent2, AddedTag]);
    this.#subscriptions.push(
      spriteQuery.stream((entity) => {
        const { sprite } = entity;
        state.scene.add(sprite);
      }),
      spriteQuery.onRemove((entity) => {
        state.scene.remove(entity.sprite);
      })
    );
  }
  update(state: Context) {
    state.composer.render(state.dt);
  }
  stop() {
    for (const sub of this.#subscriptions) {
      sub.unsubscribe();
    }
  }
}
