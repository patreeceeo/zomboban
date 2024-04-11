import {Canvas, RootState, invalidate} from "@react-three/fiber";
import { ColorManagement, OrthographicCamera, Scene, WebGLRenderer, WebGLRendererParameters} from "three";
import {CameraState, RendererState, SceneState} from "./state";
import {Observable} from "./Observable";
import {forwardRef, useEffect, useMemo} from "react";
import {PixelationEffect} from "postprocessing";
import {SCREENX_PX, SCREENY_PX} from "./units/convert";
import {
  EffectComposer,
  RenderPixelatedPass
} from "three/examples/jsm/Addons.js";

interface IProps {
  scene: Scene;
  camera: OrthographicCamera;
  renderObservable: Observable<true>;
  zoomObservable: Observable<number>;
}

const renderOptions = {
  alpha: false,
  antialias: false,
  precision: "lowp",
  powerPreference: "low-power",
} as WebGLRendererParameters;

function requestRender() {
  invalidate();
}

// function createPixelationEffect(props: IProps) {
//   const effect = new PixelationEffect(props.camera.zoom);
//   // effect.setSize(SCREENX_PX, SCREENY_PX);
//   // TODO unsubscribe?
//   props.zoomObservable.subscribe((zoom) => {
//     console.log("zoom", zoom);
//     effect.granularity = zoom;
//     // effect.setSize(SCREENX_PX, SCREENY_PX);
//   });
//   return effect;
// }

// export const Pixelation = forwardRef<any, IProps>((props, ref) => {
//   const effect = useMemo(() => createPixelationEffect(props), [props.zoomObservable])
//   return <primitive ref={ref} object={effect} dispose={null} />
// })

function handleCanvasCreated(state: RootState) {
  // const domElement = state.gl.domElement;
  // console.log("domElement dimensions", domElement.clientWidth, domElement.clientHeight);
  // state.setSize(SCREENX_PX, SCREENY_PX);
  // console.log("domElement dimensions", domElement.clientWidth, domElement.clientHeight);
}
function createWebGLRenderer(context: WebGL2RenderingContext | WebGLRenderingContext) {
  // invariant(
  //   canvas instanceof HTMLCanvasElement,
  //   `Missing canvas element with id "canvas"`
  // );
  const renderer = new WebGLRenderer({
    context,
    antialias: false,
    precision: "lowp",
    powerPreference: "low-power"
  });
  renderer.setSize(SCREENX_PX, SCREENY_PX);
  // We want these to be set with CSS
  // Object.assign(canvas.style, {
  //   width: "",
  //   height: ""
  // });

  return renderer;
}

export function createEffectComposer(
  context: WebGL2RenderingContext | WebGLRenderingContext,
  scene: Scene,
  camera: OrthographicCamera,
  zoomObservable: Observable<number>
) {
  const renderer = createWebGLRenderer(context);
  const composer = new EffectComposer(renderer);
  const pixelatedPass = new RenderPixelatedPass(camera.zoom, scene, camera, {
    depthEdgeStrength: -0.5,
    normalEdgeStrength: -1
  });
  composer.addPass(pixelatedPass);

  zoomObservable.subscribe((zoom) => {
    pixelatedPass.setPixelSize(zoom);
  });

  composer.domElement = renderer.domElement;

  Object.assign(renderer.domElement.style, {
    width: `${SCREENX_PX}px`,
    height: `${SCREENY_PX}px`
  })
  console.log("dimensions", renderer.domElement.clientWidth, renderer.domElement.clientHeight);


  return composer as unknown as WebGLRenderer;
}


const R3FApp: React.FC<IProps> = (props) => {
  useEffect(() => props.renderObservable.subscribe(requestRender).release);
  return (
    <Canvas onCreated={handleCanvasCreated} camera={props.camera as any} gl={(canvas) => createEffectComposer(canvas.getContext("webgl2")!, props.scene, props.camera, props.zoomObservable)} scene={props.scene} frameloop="demand" linear>
      {/* <EffectComposer> */}
      {/*   <Pixelation {...props} /> */}
      {/* </EffectComposer> */}
    </Canvas>
  )
}

type State = RendererState & SceneState & CameraState;

export function renderR3FApp(state: State) {
  ColorManagement.enabled = true;
  state.renderer.render(<R3FApp scene={state.scene} camera={state.camera} renderObservable={state.renderObservable} zoomObservable={state.cameraZoomObservable} />);
}
