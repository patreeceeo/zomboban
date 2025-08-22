import {State} from "./state";
import {
  ActionSystem,
  AnimationSystem,
  BehaviorSystem,
  GameSystem,
  InputSystem,
  LoadingSystem,
  ModelSystem,
  RenderSystem,
  SceneManagerSystem,
  TileSystem,
  type KeyMapping
} from "./systems";
import {
  decreaseTimeScale,
  handleEditorRedo,
  handleEditorUndo,
  handleRestart,
  handleToggleEditor,
  increaseTimeScale,
  toggleDebugTiles
} from "./inputs";
import {combineKeys, Key, KeyCombo} from "./Input";
import {InSceneTag, TransformComponent} from "./components";
import {AmbientLight, DirectionalLight, OrthographicCamera} from "three";
import {addFrameRhythmCallback, addSteadyRhythmCallback, removeRhythmCallback, startFrameRhythms} from "./Rhythm";
import {VIEWPORT_SIZE} from "./constants";

const systemConstructors = [
  LoadingSystem,
  SceneManagerSystem,
  TileSystem,
  BehaviorSystem,
  ActionSystem,
  ModelSystem,
  AnimationSystem,
  RenderSystem,
  InputSystem,
  GameSystem
]

const IMAGE_PATH = "/assets/images";
const MODEL_PATH = "/assets/models";

export const ASSET_IDS = {
  editorNormalCursor: `${IMAGE_PATH}/normal_cursor.gif`,
  editorReplaceCursor: `${IMAGE_PATH}/replace_cursor.gif`,
  toggleButton: `${IMAGE_PATH}/green_button.gif`,
  toggleButtonPress: `${IMAGE_PATH}/green_button_press.gif`,
  toggleWall: `${MODEL_PATH}/wall_green.glb`,
  toggleWallOff: `${IMAGE_PATH}/green_wall_off.gif`,
  player: `${MODEL_PATH}/player.glb`,
  block: `${MODEL_PATH}/block.glb`,
  wall: `${MODEL_PATH}/wall_red.glb`,
  monster: `${MODEL_PATH}/monster.glb`,
  terminal: `${MODEL_PATH}/terminal.glb`,
  fire: `${MODEL_PATH}/fire.glb`
};

export async function start(state: State) {
  const { keyMapping } = state.input;

  registerInputHandlers(keyMapping);

  for(const SystemConstructor of systemConstructors) {
    state.systemManager.push(SystemConstructor);
  }

  lights(state);
  camera(state);
  action(state);
}

const mappingPairs = [
    [Key.Space, handleToggleEditor],
    [combineKeys(Key.Shift, Key.r), handleRestart],
    [Key.u, handleEditorUndo],
    [combineKeys(Key.Shift, Key.u), handleEditorRedo],
    [combineKeys(Key.Shift, Key.ArrowDown), decreaseTimeScale],
    [combineKeys(Key.Shift, Key.ArrowUp), increaseTimeScale],
    [combineKeys(Key.i, Key.t), toggleDebugTiles],
  ] as const

export function registerInputHandlers(mapping: KeyMapping<State>) {
  for (const [key, handler] of mappingPairs) {
    mapping.add(key as KeyCombo, handler);
  }
}

export function lights(state: State) {
  const lights = state.world.addEntity();
  TransformComponent.add(lights);
  const { transform: lightTransform } = lights;
  InSceneTag.add(lights);
  lightTransform.add(new DirectionalLight(0xffffff, 5));
  lightTransform.add(new AmbientLight(0xffffff, 2));
  lightTransform.position.set(0, -100, 595);
  lightTransform.lookAt(0, 0, 0);
}

export function camera(state: State) {
  const offsetWidth = VIEWPORT_SIZE.x;
  const offsetHeight = VIEWPORT_SIZE.y;
  const camera = new OrthographicCamera(
    offsetWidth / -2,
    offsetWidth / 2,
    offsetHeight / 2,
    offsetHeight / -2,
    0.1,
    10000
  );

  camera.zoom = 1;
  camera.updateProjectionMatrix();
  camera.updateMatrix();
  camera.lookAt(0, 0, 0);

  state.render.camera = camera;
  state.render.cameraOffset.set(0, -450, 1000);
}

const abortController = new AbortController();
function action(
  state: State
) {
  const { systemManager } = state;
  const steadyRhythm = addSteadyRhythmCallback(100, () => systemManager.updateServices());
  const frameRhythm = addFrameRhythmCallback((dt) => {
    const { timeScale } = state.time;
    state.time.frameDelta = dt * timeScale;
    // NOTE: state.time is updated in ActionSystem
    systemManager.update();
  });

  startFrameRhythms();

  abortController.abort();
  window.addEventListener("blur", () => {
    removeRhythmCallback(steadyRhythm);
    removeRhythmCallback(frameRhythm);
  }, {signal: abortController.signal});

  window.addEventListener("focus", () => action(state), {signal: abortController.signal})
}
