import { QueryManager } from "../Query";
import { Texture, Scene, AnimationMixer, Vector2 } from "../Three";
import { World } from "../EntityManager";
import { IEntityPrefab } from "../EntityPrefab";
import { EntityPrefabEnum, IEntityPrefabState } from "../entities";
import { createEffectComposer, createRenderer } from "../systems/RenderSystem";
import {
  ICameraController,
  createOrthographicCamera
} from "../systems/CameraSystem";
import { menuRoute } from "../routes";
import { Observable, ObservableArray, ObservableSet } from "../Observable";
import { Behavior } from "../systems/BehaviorSystem";
import { KeyCombo } from "../Input";
import { invariant } from "../Error";
import { MixinType, composeMixins } from "../Mixins";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent } from "../components";
import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { GLTF } from "three/examples/jsm/Addons.js";
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

// Create Object abstraction inspired by Pharo & Koi. Focus on
// - Composability: compose complex objects out of basic objects. Basic objects represent a single value/type and give it a name. Use valueOf or toString to convert them to primatives.
// - Basic objects support observability

export function EntityManagerMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    #world = new World();
    get entities() {
      return this.#world.entities;
    }
    addEntity = this.#world.addEntity.bind(this.#world);
    removeEntity = this.#world.removeEntity.bind(this.#world);
    registerComponent = this.#world.registerComponent.bind(this.#world);
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
    originalWorld = [] as any[];
  };
}
export type EntityManagerState = MixinType<typeof EntityManagerMixin>;

export function TimeMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    dt = 0;
    time = 0;
    timeScale = 1;
    isPaused = false;
  };
}
export type TimeState = MixinType<typeof TimeMixin>;

export function QueryMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    #queries = new QueryManager();
    query = this.#queries.query.bind(this.#queries);
  };
}
export type QueryState = MixinType<typeof QueryMixin>;

export function CameraMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    #camera = createOrthographicCamera();
    get camera() {
      return this.#camera!;
    }
    cameraController?: ICameraController;
    zoom = 1;
  };
}
export type CameraState = MixinType<typeof CameraMixin>;

export function SceneMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    #scene = new Scene();
    get scene() {
      return this.#scene!;
    }
  };
}
export type SceneState = MixinType<typeof SceneMixin>;

export function RendererMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    readonly renderer = createRenderer();
    readonly composer = createEffectComposer(
      this.renderer,
      (this as unknown as SceneState).scene,
      (this as unknown as CameraState).camera
    );
  };
}
export type RendererState = MixinType<typeof RendererMixin>;

export function TextureCacheMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
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
  };
}
export type TextureCacheState = MixinType<typeof TextureCacheMixin>;

export function ModelCacheMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
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
  };
}
export type ModelCacheState = MixinType<typeof ModelCacheMixin>;

export function BehaviorMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
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
  };
}
export type BehaviorState = MixinType<typeof BehaviorMixin>;

export function RouterMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
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
  };
}
export type RouterState = MixinType<typeof RouterMixin>;

export enum MetaStatus {
  Edit,
  Replace,
  Play
}
export function MetaMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    metaStatus = MetaStatus.Play;
    currentLevelId = 0;
  };
}

export type MetaState = MixinType<typeof MetaMixin>;

export function InputMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
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
  };
}
export type InputState = MixinType<typeof InputMixin>;

export function ActionsMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    pendingActions = new ObservableArray<
      Action<EntityWithComponents<typeof BehaviorComponent>, any>
    >();
    isAtStart = true;
  };
}
export type ActionsState = MixinType<typeof ActionsMixin>;

export function TilesMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base implements ITilesState {
    tiles = new TileMatrix();
  };
}

export function ClientMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    client = new NetworkedEntityClient(fetch.bind(globalThis));
    isSignedIn = false;
  };
}
export type ClientState = MixinType<typeof ClientMixin>;

export function PrefabEntityMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base implements IEntityPrefabState {
    entityPrefabMap = new Map<EntityPrefabEnum, IEntityPrefab<any, Entity>>();
  };
}

export function DevToolsMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    devToolsVarsFormEnabled = false;
  };
}

export type DevToolsState = MixinType<typeof DevToolsMixin>;

export function LoadingStateMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    loadingItems = new ObservableSet<LoadingItem>();
    $loadingProgress = 1;
    $loadingGroupDescription = "";
    loadingMax = 0;
  };
}
export type LoadingState = MixinType<typeof LoadingStateMixin>;

export function EditorMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    editor = {
      commandQueue: [],
      undoStack: [],
      redoStack: [],
    } as IEditorState["editor"];
  };
}

export function DebugMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    debugTilesEnabled = false;
  };
}
export type DebugState = MixinType<typeof DebugMixin>;


export const PortableStateMixins = [
  EntityManagerMixin,
  TimeMixin,
  QueryMixin,
  TextureCacheMixin,
  InputMixin,
  BehaviorMixin,
  ActionsMixin,
  TilesMixin,
  CameraMixin,
  SceneMixin,
  RouterMixin,
  MetaMixin,
  LoadingStateMixin,
  EditorMixin,
  DebugMixin,
];

// TODO ServerState

export const PortableState = composeMixins(...PortableStateMixins);

export const State = composeMixins(
  ...PortableStateMixins,
  RendererMixin,
  ModelCacheMixin,
  ClientMixin,
  PrefabEntityMixin,
  DevToolsMixin
);

export type State = InstanceType<typeof State>;
