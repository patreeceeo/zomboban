import { QueryManager } from "../Query";
import { Texture, Scene, AnimationMixer, Vector2, OrthographicCamera, Vector3, WebGLRenderer } from "three";
import { World } from "../EntityManager";
import { IEntityPrefab } from "../EntityPrefab";
import { EntityPrefabEnum, IEntityPrefabState } from "../entities";
import { menuRoute } from "../routes";
import { Observable, ObservableArray, ObservableSet, ObservableValue } from "../Observable";
import { Behavior } from "../systems/BehaviorSystem";
import { KeyCombo } from "../Input";
import { invariant } from "../Error";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent, ServerIdComponent } from "../components";
import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { EffectComposer, GLTF } from "three/examples/jsm/Addons.js";
import { Action } from "../Action";
import { deserializeEntity } from "../functions/Networking";
import { ITilesState, TileMatrix } from "../systems/TileSystem";
import { Entity } from "../Entity";
import { SystemRegistery } from "../systems";
import { KeyMapping } from "../systems/InputSystem";
import { RouteId } from "../Route";
import { SystemManager } from "../System";
import { BehaviorEnum } from "../behaviors";
import { LoadingItem } from "../systems/LoadingSystem";
import {IEditorState} from "../systems/EditorSystem";
import {createRenderer, NullComposer, NullRenderer} from "../rendering";
import {IZoomControl, NullZoomControl } from "../ZoomControl";

export enum Mode {
  Edit,
  Replace,
  Play
}

export class State implements ITilesState, IEntityPrefabState {
  // EntityManager functionality
  #world = new World();
  get world() {
    return this.#world;
  }
  get entities() {
    return this.#world.entities;
  }
  addEntity = this.#world.addEntity.bind(this.#world);
  removeEntity = this.#world.removeEntity.bind(this.#world);
  clearWorld() {
    for (const entity of this.entities) {
      this.removeEntity(entity);
    }
  }
  addAllEntities(entities = this.entities as Iterable<any>) {
    for (const data of entities) {
      const entity = this.addEntity();
      deserializeEntity(entity, data);
    }
  }
  #queries = new QueryManager(this.world);
  query = this.#queries.query.bind(this.#queries);
  dynamicEntities = this.query([ServerIdComponent]);

  // Time functionality
  dt = 0;
  time = 0;
  timeScale = 1;
  isPaused = false;

  // Renderer functionality
  #canvas = undefined as HTMLCanvasElement | undefined
  set canvas(canvas: HTMLCanvasElement) {
    this.#canvas = canvas
    this.renderer = createRenderer(canvas);
  }
  get canvas() {
    invariant(this.#canvas !== undefined, "Expected canvas to have been set");
    return this.#canvas
  }
  renderer = new NullRenderer() as NullRenderer | WebGLRenderer
  #scene = new Scene();
  get scene() {
    return this.#scene!;
  }
  composer = new NullComposer() as EffectComposer;
  #cameraObservable = new ObservableValue<OrthographicCamera | undefined>(undefined);
  get camera() {
    return this.#cameraObservable.get();
  }
  set camera(camera: OrthographicCamera | undefined) {
    this.#cameraObservable.set(camera);
  }
  streamCameras(callback: (camera: OrthographicCamera) => void) {
    return this.#cameraObservable.stream((camera) => {
      if (camera) {
        callback(camera);
      }
    });
  }
  cameraTarget = new Vector3();
  cameraOffset = new Vector3();
  lookAtTarget = true;

  // TextureCache functionality
  #textures: Record<string, Texture> = {};
  addTexture(id: string, texture: Texture) {
    this.#textures[id] = texture;
  }
  hasTexture(id: string) {
    return id in this.#textures;
  }
  getTexture(id: string) {
    return this.#textures[id];
  }

  // ModelCache functionality
  #models: Record<string, GLTF> = {};
  #animationMixers: Record<string, AnimationMixer> = {};
  addModel(id: string, model: GLTF) {
    this.#models[id] = model;
  }
  addAnimationMixer(id: string, mixer: AnimationMixer) {
    this.#animationMixers[id] = mixer;
  }
  removeAnimationMixer(id: string) {
    delete this.#animationMixers[id];
  }
  listAnimationMixers() {
    return Object.values(this.#animationMixers);
  }
  hasModel(id: string) {
    return id in this.#models;
  }
  getModel(id: string) {
    return this.#models[id];
  }

  // Behavior functionality
  #behaviors: Partial<Record<BehaviorEnum, Behavior<any, any>>> = {};
  addBehavior(id: BehaviorEnum, behavior: Behavior<any, any>) {
    this.#behaviors[id] = behavior;
  }
  replaceBehavior(
    oldBehaviorCtor: IConstructor<Behavior<any, any>>,
    newBehaviorCtor: IConstructor<Behavior<any, any>>
  ) {
    for (const [id, behavior] of Object.entries(this.#behaviors)) {
      if (behavior instanceof oldBehaviorCtor) {
        const newBehavior = new newBehaviorCtor();
        this.addBehavior(id as BehaviorEnum, newBehavior);
      }
    }
  }
  hasBehavior(id: string) {
    return id in this.#behaviors;
  }
  getBehavior(id: BehaviorEnum): Behavior<any, any> {
    invariant(
      id in this.#behaviors,
      `Behavior ${id} has not been registered`
    );
    return this.#behaviors[id]!;
  }
  actorsById = [] as EntityWithComponents<typeof BehaviorComponent>[];

  // Router functionality
  defaultRoute = menuRoute;
  #currentRoute = this.defaultRoute;
  #currentRouteObservable = new Observable<RouteId>();
  get currentRoute() {
    return this.#currentRoute;
  }
  set currentRoute(route: RouteId) {
    if (!this.#currentRoute.equals(route)) {
      this.#currentRouteObservable.next(route);
      this.#currentRoute = route;
    }
  }
  onRouteChange(callback: () => void) {
    return this.#currentRouteObservable.subscribe(callback);
  }
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
  entityPrefabMap = new Map<EntityPrefabEnum, IEntityPrefab<any, Entity>>();

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
}

// Legacy type exports for backward compatibility
export type EntityManagerState = Pick<State, 'world' | 'entities' | 'addEntity' | 'removeEntity' | 'clearWorld' | 'addAllEntities' | 'query' | 'dynamicEntities'>;
export type TimeState = Pick<State, 'dt' | 'time' | 'timeScale' | 'isPaused'>;
export type RendererState = Pick<State, 'renderer' | 'scene' | 'composer' | 'camera' | 'streamCameras' | 'cameraTarget' | 'cameraOffset' | 'lookAtTarget'>;
export type TextureCacheState = Pick<State, 'addTexture' | 'hasTexture' | 'getTexture'>;
export type ModelCacheState = Pick<State, 'addModel' | 'addAnimationMixer' | 'removeAnimationMixer' | 'listAnimationMixers' | 'hasModel' | 'getModel'>;
export type BehaviorState = Pick<State, 'addBehavior' | 'replaceBehavior' | 'hasBehavior' | 'getBehavior' | 'actorsById'>;
export type RouterState = Pick<State, 'defaultRoute' | 'currentRoute' | 'onRouteChange' | 'registeredSystems' | 'systemManager' | 'showModal'>;
export type MetaState = Pick<State, 'mode' | 'currentLevelId'>;
export type InputState = Pick<State, 'inputs' | 'inputPressed' | 'inputRepeating' | 'inputTime' | 'inputDt' | 'pointerPosition' | 'keyMapping' | '$currentInputFeedback' | 'zoomControl'>;
export type ActionsState = Pick<State, 'pendingActions' | 'isAtStart'>;
export type ClientState = Pick<State, 'client' | 'isSignedIn'>;
export type DevToolsState = Pick<State, 'devToolsVarsFormEnabled'>;
export type LoadingState = Pick<State, 'loadingItems' | '$loadingProgress' | '$loadingGroupDescription' | 'loadingMax'>;
export type DebugState = Pick<State, 'debugTilesEnabled'>;

// Legacy exports for backward compatibility  
export const PortableState = State;
