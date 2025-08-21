import {State} from "./state";
import {SystemEnum, SystemRegistery} from "./systems";
import {ActionSystem} from "./systems/ActionSystem";
import {AnimationSystem} from "./systems/AnimationSystem";
import {BehaviorSystem} from "./systems/BehaviorSystem";
import {EditorSystem} from "./systems/EditorSystem";
import {GameSystem} from "./systems/GameSystem";
import {InputSystem, KeyMapping} from "./systems/InputSystem";
import {LoadingSystem} from "./systems/LoadingSystem";
import {ModelSystem} from "./systems/ModelSystem";
import {createOrthographicCamera, RenderSystem} from "./systems/RenderSystem";
import {SceneManagerSystem} from "./systems/SceneManagerSystem";
import {TileSystem} from "./systems/TileSystem";
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
import {AmbientLight, DirectionalLight} from "three";
import {addFrameRhythmCallback, addSteadyRhythmCallback, removeRhythmCallback, startFrameRhythms} from "./Rhythm";

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
  const { registeredSystems, keyMapping } = state;

  registerSystems(registeredSystems);
  registerInputHandlers(keyMapping);

  for(const SystemConstructor of systemConstructors) {
    state.systemManager.push(SystemConstructor);
  }

  lights(state);
  camera(state);
  action(state);
}

const systems = [
    [SystemEnum.Loading, LoadingSystem],
    [SystemEnum.SceneManager, SceneManagerSystem],
    [SystemEnum.Action, ActionSystem],
    [SystemEnum.Animation, AnimationSystem],
    [SystemEnum.Behavior, BehaviorSystem],
    [SystemEnum.Editor, EditorSystem],
    [SystemEnum.Game, GameSystem],
    [SystemEnum.Input, InputSystem],
    [SystemEnum.Model, ModelSystem],
    [SystemEnum.Render, RenderSystem],
    [SystemEnum.Tile, TileSystem]
  ] as const

export function registerSystems(registery: SystemRegistery) {
  for (const [key, system] of systems) {
    registery.set(key, system);
  }
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
  const lights = state.addEntity();
  TransformComponent.add(lights);
  const { transform: lightTransform } = lights;
  InSceneTag.add(lights);
  lightTransform.add(new DirectionalLight(0xffffff, 5));
  lightTransform.add(new AmbientLight(0xffffff, 2));
  lightTransform.position.set(0, -100, 595);
  lightTransform.lookAt(0, 0, 0);
}

export function camera(state: State) {
  state.camera = createOrthographicCamera();
  state.cameraOffset.set(0, -450, 1000);
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
