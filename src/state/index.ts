import { QueryManager } from "../Query";
import { World } from "../EntityManager";
import { IEntityPrefab } from "../EntityPrefab";
import { EntityPrefabEnum } from "../entities";
import { ObservableArray, ObservableSet } from "../Observable";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent, ServerIdComponent, CursorTag, TransformComponent } from "../components";
import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { Action } from "../Action";
import { Entity } from "../Entity";
import { SystemManager } from "../System";
import { TileMatrix } from "../systems/TileSystem";
import { LoadingItem } from "../systems/LoadingSystem";
import {TextureState, TextureStateInit} from "./texture";
import {ModelState, ModelStateInit} from "./model";
import {AnimationMixerState} from "./animation_mixer";
import {TimeState} from "./time";
import {RenderState} from "./render";
import {BehaviorState} from "./behavior";
import {RouteState} from "./route";
import {InputState} from "./input";
import {DevToolsState} from "./dev_tools";
import {IZoomControl, NullZoomControl} from "../ZoomControl";
import {EditorState} from "./editor";

export enum Mode {
  Edit,
  Replace,
  Play
}

export interface StateInit {
  texture?: TextureStateInit;
  model?: ModelStateInit;
}

export class State {
  // EntityManager functionality
  world = new World();

  query = new QueryManager(this.world);
  dynamicEntities = this.query.create([ServerIdComponent]);
  cursorEntities = this.query.create([CursorTag, TransformComponent, BehaviorComponent]);

  // Time functionality
  time = new TimeState();

  render = new RenderState();
  behavior = new BehaviorState();
  route = new RouteState();
  input = new InputState();
  devTools = new DevToolsState();

  texture: TextureState;
  model: ModelState;
  animationMixer = new AnimationMixerState();

  systemManager = new SystemManager(this);
  showModal = false;
  isSignInFormOpen = false;

  mode = Mode.Play;
  currentLevelId = 0;

  zoomControl: IZoomControl = new NullZoomControl();
  $currentInputFeedback = "";

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

  // Loading functionality
  loadingItems = new ObservableSet<LoadingItem>();
  loadingProgress = 1;
  loadingGroupDescription = "";
  loadingMax = 0;

  // Editor functionality
  editor = new EditorState();

  // Debug functionality
  debugTilesEnabled = false;

  constructor(thisInit: StateInit = {}) {
    this.texture = new TextureState(thisInit?.texture);
    this.model = new ModelState(thisInit?.model);
  }
}

// Legacy type exports for backward compatibility
export type MetaState = Pick<State, 'mode' | 'currentLevelId'>;
export type ActionsState = Pick<State, 'pendingActions' | 'isAtStart'>;
export type ClientState = Pick<State, 'client' | 'isSignedIn'>;
export type DebugState = Pick<State, 'debugTilesEnabled'>;

// Legacy exports for backward compatibility  
export const PortableState = State;
