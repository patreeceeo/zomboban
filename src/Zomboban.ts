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
import {RenderSystem} from "./systems/RenderSystem";
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
import {combineKeys, Key} from "./Input";

export function setupCanvas(state: State) {
  const { registeredSystems, keyMapping } = state;

  registerSystems(registeredSystems)
  registerInputHandlers(keyMapping);
}

export function registerSystems(registery: SystemRegistery) {
  for (const [key, system] of [
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
  ] as const) {
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
    mapping.set(key, handler);
  }
}

