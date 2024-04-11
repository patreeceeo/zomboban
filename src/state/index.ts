import { QueryManager } from "../Query";
import { Texture, Scene, Vector3, Object3D } from "three";
import { World } from "../EntityManager";
import {
  createEffectComposer,
  createRenderer,
  createRenderer
} from "../systems/RenderSystem";
import { createCamera } from "../systems/CameraSystem";
import { DEFAULT_ROUTE, RouteId } from "../routes";
import { Observable, ObservableArray } from "../Observable";
import { Behavior } from "../systems/BehaviorSystem";
import { ActionDriver } from "../systems/ActionSystem";
import { CursorEntity } from "../entities/CursorEntity";
import { KeyCombo } from "../Input";
import { Matrix } from "../Matrix";
import { invariant } from "../Error";
import { MixinType, composeMixins, hasMixin } from "../Mixins";
import { EntityWithComponents } from "../Component";
import { BehaviorComponent, TransformComponent } from "../components";
import { NetworkedEntityClient } from "../NetworkedEntityClient";
import { Typewriter } from "../Typewritter";
import { Root } from "react-dom/client";
import { createRef } from "react";

export function EntityManagerMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    #world = new World();
    get entities() {
      return this.#world.entities;
    }
    addEntity = this.#world.addEntity.bind(this.#world);
    removeEntity = this.#world.removeEntity.bind(this.#world);
  };
}
export type EntityManagerState = MixinType<typeof EntityManagerMixin>;

export function TimeMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    dt = 0;
    time = 0;
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
    #camera = createCamera();
    get camera() {
      return this.#camera!;
    }
    cameraController?: { position: Vector3 };
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

declare const rootElement: HTMLElement;
export function RendererMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    /** deprecated ? */
    // #renderer = createRenderer();
    /** deprecated ? */
    // #composer = createEffectComposer(
    //   this.#renderer,
    //   (this as unknown as SceneState).scene,
    //   (this as unknown as CameraState).camera,
    //   (this as unknown as CameraState).cameraZoomObservable
    // );
    /** deprecated ? */
    // get renderer() {
    //   return this.#renderer!;
    // }

    /** deprecated ? */
    // get composer() {
    //   return this.#composer!;
    // }

    renderObservable = new Observable<true>();

    domElement = rootElement;

    renderer = createRenderer(rootElement);
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
    #models: Record<string, Object3D> = {};
    addModel(id: string, model: Object3D) {
      this.#models[id] = model;
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

export function EditorCursorMixin<TBase extends IConstructor>(Base: TBase) {
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
export type EditorCursorState = MixinType<typeof EditorCursorMixin>;

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
  };
}
export type InputState = MixinType<typeof InputMixin>;

export function ActionsMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    pendingActions = [] as ActionDriver<
      EntityWithComponents<typeof BehaviorComponent>,
      any
    >[];
    completedActions = new ObservableArray<ActionDriver<any, any>[]>();
    undo = false;
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
  RouterMixin
];

// TODO ServerState

export const PortableState = composeMixins(...PortableStateMixins);

export const State = composeMixins(
  ...PortableStateMixins,
  RendererMixin,
  EditorCursorMixin,
  ModelCacheMixin,
  ClientMixin,
  TypewriterMixin
);
