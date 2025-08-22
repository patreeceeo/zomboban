import { QueryManager } from "../Query";
import { Vector2 } from "three";
import { World } from "../EntityManager";
import { IEntityPrefab } from "../EntityPrefab";
import { EntityPrefabEnum, IEntityPrefabState } from "../entities";
import { ObservableArray, ObservableSet } from "../Observable";
import { KeyCombo } from "../Input";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent, ServerIdComponent } from "../components";
import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { Action } from "../Action";
import { ITilesState, TileMatrix } from "../systems/TileSystem";
import { Entity } from "../Entity";
import { KeyMapping } from "../systems/InputSystem";
import { SystemManager } from "../System";
import { SystemRegistery } from "../systems";
import { LoadingItem } from "../systems/LoadingSystem";
import {IEditorState} from "../systems/EditorSystem";
import {IZoomControl, NullZoomControl } from "../ZoomControl";
import {TextureState, TextureStateInit} from "./texture";
import {ModelState, ModelStateInit} from "./model";
import {AnimationMixerState} from "./animation_mixer";
import {TimeState} from "./time";
import {RenderState} from "./render";
import {BehaviorState} from "./behavior";
import {RouteState} from "./route";

export enum Mode {
  Edit,
  Replace,
  Play
}

export interface StateInit {
  texture?: TextureStateInit;
  model?: ModelStateInit;
}

export class State implements ITilesState, IEntityPrefabState {
  // EntityManager functionality
  world = new World();

  query = new QueryManager(this.world);
  dynamicEntities = this.query.create([ServerIdComponent]);

  // Time functionality
  time = new TimeState();
  // Just here for UI bindings since the UI library doesn't support nested properties at the moment (TODO)
  get isPaused() {
    return this.time.isPaused;
  }

  render = new RenderState();
  behavior = new BehaviorState();
  route = new RouteState();

  texture: TextureState;
  model: ModelState;
  animationMixer = new AnimationMixerState();

  registeredSystems = new SystemRegistery();
  systemManager = new SystemManager(this);
  showModal = false;

  // Meta functionality
  mode = Mode.Play;
  currentLevelId = 0;

  // Input functionality
  #inputs: KeyCombo[] = [];
  get inputs() {
    return this.#inputs;
  }
  inputPressed = 0 as KeyCombo;
  inputRepeating = 0 as KeyCombo;
  inputTime = 0;
  inputDt = 0;
  pointerPosition = new Vector2();
  keyMapping = new KeyMapping<State>();
  $currentInputFeedback = "";
  zoomControl: IZoomControl = new NullZoomControl();

  // Actions functionality
  pendingActions = new ObservableArray<
    Action<EntityWithComponents<typeof BehaviorComponent>, any>
  >();
  isAtStart = true;

  // Tiles functionality
  tiles = new TileMatrix();

  // Client functionality
  client = new NetworkedEntityClient(fetch.bind(globalThis));
  isSignedIn = false;

  // PrefabEntity functionality
  entityPrefabMap = new Map<EntityPrefabEnum, IEntityPrefab<Entity>>();

  // DevTools functionality
  devToolsVarsFormEnabled = false;

  // Loading functionality
  loadingItems = new ObservableSet<LoadingItem>();
  $loadingProgress = 1;
  $loadingGroupDescription = "";
  loadingMax = 0;

  // Editor functionality
  editor = {
    commandQueue: [],
    undoStack: [],
    redoStack: [],
  } as IEditorState["editor"];

  // Debug functionality
  debugTilesEnabled = false;

  constructor(thisInit: StateInit = {}) {
    this.texture = new TextureState(thisInit?.texture);
    this.model = new ModelState(thisInit?.model);
  }
}

// Legacy type exports for backward compatibility
export type MetaState = Pick<State, 'mode' | 'currentLevelId'>;
export type InputState = Pick<State, 'inputs' | 'inputPressed' | 'inputRepeating' | 'inputTime' | 'inputDt' | 'pointerPosition' | 'keyMapping' | '$currentInputFeedback' | 'zoomControl'>;
export type ActionsState = Pick<State, 'pendingActions' | 'isAtStart'>;
export type ClientState = Pick<State, 'client' | 'isSignedIn'>;
export type DevToolsState = Pick<State, 'devToolsVarsFormEnabled'>;
export type DebugState = Pick<State, 'debugTilesEnabled'>;

// Legacy exports for backward compatibility  
export const PortableState = State;
