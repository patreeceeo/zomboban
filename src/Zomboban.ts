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
import {AmbientLight, DirectionalLight, NearestFilter, Texture, TextureLoader} from "three";
import {AssetLoader} from "./AssetLoader";
import {ASSET_IDS, IMAGE_PATH, MODEL_PATH} from "./assets";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import {GLTFLoader} from "./GLTFLoader";
import {BASE_URL} from "./constants";
import {addFrameRhythmCallback, addSteadyRhythmCallback, startFrameRhythms} from "./Rhythm";

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

export async function start(state: State) {
  const { registeredSystems, keyMapping } = state;
  const loader = createAssetLoader();
  const assetIds = Object.values(ASSET_IDS);

  registerSystems(registeredSystems);
  registerInputHandlers(keyMapping);

  await loadAssets(state, loader, assetIds);

  for(const System of systemConstructors) {
    state.systemManager.push(System);
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

export function createAssetLoader() {
  const loader = new AssetLoader(
    {
      [IMAGE_PATH]: TextureLoader,
      [MODEL_PATH]: GLTFLoader
    },
    BASE_URL
  );

  return loader;
}

export async function loadAssets(state: State, loader: AssetLoader<any>, assetIds: string[]) {
  loader.onLoad((event) => {
    const assetId = event.id;
    if (assetId.startsWith(IMAGE_PATH)) {
      const texture = event.asset as Texture;
      texture.magFilter = NearestFilter;
      texture.minFilter = NearestFilter;
      state.addTexture(event.id, event.asset);
    }
    if (assetId.startsWith(MODEL_PATH)) {
      const gltf = event.asset as GLTF;
      state.addModel(event.id, gltf);
    }
  });
  await Promise.all(assetIds.map((id) => loader.load(id)));
}

function action(
  state: State
) {
  const { systemManager } = state;
  addSteadyRhythmCallback(100, () => systemManager.updateServices());
  addFrameRhythmCallback((dt) => {
    const { timeScale } = state;
    state.dt = dt * timeScale;
    // NOTE: state.time is updated in ActionSystem
    systemManager.update();
  });
  startFrameRhythms();
}
