import { QueryManager } from "../Query";
import { Texture, Scene, AnimationMixer } from "three";
import { World } from "../EntityManager";
import { createEffectComposer, createRenderer } from "../systems/RenderSystem";
import {
  ICameraController,
  createOrthographicCamera
} from "../systems/CameraSystem";
import { DEFAULT_ROUTE, RouteId } from "../routes";
import { Observable, ObservableArray } from "../Observable";
import { Behavior } from "../systems/BehaviorSystem";
import { CursorEntity } from "../entities/CursorEntity";
import { KeyCombo } from "../Input";
import { Matrix } from "../Matrix";
import { invariant } from "../Error";
import { MixinType, composeMixins, hasMixin } from "../Mixins";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent, TransformComponent } from "../components";
import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { Typewriter } from "../Typewriter";
import { GLTF } from "three/examples/jsm/Addons.js";
import { LogBundle } from "../systems/LogSystem";
import { Action } from "../systems/ActionSystem";
import { deserializeEntity } from "../functions/Networking";

export function EntityManagerMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    #world = new World();
    get entities() {
      return this.#world.entities;
    }
    addEntity = this.#world.addEntity.bind(this.#world);
    removeEntity = this.#world.removeEntity.bind(this.#world);
    registerComponent = this.#world.registerComponent.bind(this.#world);
    resetWorld(entities = this.entities as Iterable<any>) {
      const { originalWorld } = this;
      for (const entity of entities) {
        this.removeEntity(entity);
      }
      for (const data of originalWorld) {
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
    cameraZoomObservable = new Observable<number>();
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
      (this as unknown as CameraState).camera,
      (this as unknown as CameraState).cameraZoomObservable
    );
    shouldRerender = false;
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

export function BehaviorCacheMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    #behaviors: Record<string, Behavior<any, any>> = {};
    addBehavior(id: string, behavior: Behavior<any, any>) {
      this.#behaviors[id] = behavior;
    }
    hasBehavior(id: string) {
      return id in this.#behaviors;
    }
    getBehavior(id: string) {
      return this.#behaviors[id];
    }
  };
}
export type BehaviorCacheState = MixinType<typeof BehaviorCacheMixin>;

export function RouterMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    #currentRoute: RouteId = DEFAULT_ROUTE;
    #currentRouteObservable = new Observable<RouteId>();
    get currentRoute(): RouteId {
      return this.#currentRoute;
    }
    set currentRoute(route: RouteId) {
      if (this.#currentRoute !== route) {
        this.#currentRouteObservable.next(route);
        this.#currentRoute = route;
      }
    }
    onRouteChange(callback: () => void) {
      return this.#currentRouteObservable.subscribe(callback);
    }
  };
}
export type RouterState = MixinType<typeof RouterMixin>;

export function EditorMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    #editorCursor = (() => {
      invariant(
        hasMixin(this, EntityManagerMixin),
        "EditorCursorMixin requires EntityManagerMixin"
      );
      invariant(
        hasMixin(this, BehaviorCacheMixin),
        "EditorCursorMixin requires BehaviorCacheMixin"
      );
      const entity = CursorEntity.create(this as any);
      return entity;
    })();
    get editorCursor() {
      return this.#editorCursor;
    }
  };
}
export type EditorState = MixinType<typeof EditorMixin>;

export enum MetaStatus {
  Play,
  Win,
  Restart
}
export function MetaMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    metaStatus = MetaStatus.Play;
  };
}

export type GameState = MixinType<typeof MetaMixin>;

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
    // TODO remove
    inputUnderstood = true;
  };
}
export type InputState = MixinType<typeof InputMixin>;

export function ActionsMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    pendingActions = new ObservableArray<
      Action<EntityWithComponents<typeof BehaviorComponent>, any>
    >();
    completedActions = new ObservableArray<
      Action<EntityWithComponents<typeof BehaviorComponent>, any>
    >();
    undoingActions = new ObservableArray<
      Action<EntityWithComponents<typeof BehaviorComponent>, any>
    >();
    undoInProgress = false;
    undoUntilTime = 0;
  };
}
export type ActionsState = MixinType<typeof ActionsMixin>;

export function TilesMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    tiles = new Matrix<[EntityWithComponents<typeof TransformComponent>]>();
  };
}
export type TilesState = MixinType<typeof TilesMixin>;

export function ClientMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    client = new NetworkedEntityClient(fetch.bind(window));
    lastSaveRequestTime = -Infinity;
    isSignedIn = false;
  };
}
export type ClientState = MixinType<typeof ClientMixin>;

export function TypewriterMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    #typewriter = new Typewriter();
    get typewriter() {
      return this.#typewriter;
    }
  };
}
export type TypewriterState = MixinType<typeof TypewriterMixin>;

export function LogMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    logs = new LogBundle();
  };
}

export type LogState = MixinType<typeof LogMixin>;

export const PortableStateMixins = [
  EntityManagerMixin,
  TimeMixin,
  QueryMixin,
  TextureCacheMixin,
  InputMixin,
  BehaviorCacheMixin,
  ActionsMixin,
  TilesMixin,
  CameraMixin,
  SceneMixin,
  RouterMixin,
  LogMixin
];

// TODO ServerState

export const PortableState = composeMixins(...PortableStateMixins);

export const State = composeMixins(
  ...PortableStateMixins,
  RendererMixin,
  EditorMixin,
  ModelCacheMixin,
  ClientMixin,
  TypewriterMixin
);
