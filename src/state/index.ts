import { QueryManager } from "../Query";
import { Texture, Scene, Vector3 } from "three";
import { World } from "../EntityManager";
import { createRenderer } from "../systems/RenderSystem";
import { createCamera } from "../systems/CameraSystem";
import { DEFAULT_ROUTE, RouteId } from "../routes";
import { Observable, ObservableCollection } from "../Observable";
import { Behavior } from "../systems/BehaviorSystem";
import { ActionDriver } from "../systems/ActionSystem";
import { CursorEntity } from "../entities/CursorEntity";
import { KeyCombo } from "../Input";
import { Matrix } from "../Matrix";
import { invariant } from "../Error";
import { MixinType, composeMixins, hasMixin } from "../Mixins";

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
    #renderer = createRenderer();
    get renderer() {
      return this.#renderer!;
    }
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
      entity.visible = false;
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
    pendingActions = [] as ActionDriver<any, any>[];
    completedActions = new ObservableCollection<ActionDriver<any, any>[]>();
  };
}
export type ActionsState = MixinType<typeof ActionsMixin>;

export function TilesMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    tiles = new Matrix<[{ position: Vector3 }]>();
  };
}
export type TilesState = MixinType<typeof TilesMixin>;

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
  EditorCursorMixin
];

export const PortableState = composeMixins(...PortableStateMixins);

export const State = composeMixins(...PortableStateMixins, RendererMixin);
