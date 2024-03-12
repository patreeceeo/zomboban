import { QueryManager } from "../Query";
import { Texture, Camera, Renderer, Scene, Vector3 } from "three";
import { World } from "../EntityManager";
import { createRenderer } from "../systems/RenderSystem";
import { createCamera } from "../systems/CameraSystem";
import { DEFAULT_ROUTE, RouteId } from "../routes";
import { IObservableSubscription, Observable } from "../Observable";
import { Behavior } from "../systems/BehaviorSystem";
import { ActionDriver } from "../systems/ActionSystem";
import { CursorEntity } from "../entities/CursorEntity";
import { KeyCombo } from "../Input";
import { Matrix } from "../Matrix";

export interface IState extends World {
  addTexture(id: string, texture: Texture): void;
  hasTexture(id: string): boolean;
  getTexture(id: string): Texture;

  addBehavior(id: string, behavior: Behavior<any, this>): void;
  hasBehavior(id: string): boolean;
  getBehavior(id: string): Behavior<any, this>;

  actions: ActionDriver<any, this>[][];

  readonly renderer: Renderer;
  readonly camera: Camera;
  readonly scene: Scene;
  readonly dt: number;
  readonly time: number;
  query: QueryManager["query"];
  currentRoute: RouteId;
  onRouteChange(callback: () => void): IObservableSubscription;
}

export class State extends World implements IState {
  dt = 0;
  time = 0;

  #queries = new QueryManager();
  query = this.#queries.query.bind(this.#queries);

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

  #inputs: KeyCombo[] = [];
  get inputs() {
    return this.#inputs;
  }
  inputPressed = 0 as KeyCombo;
  inputRepeating = 0 as KeyCombo;
  inputTime = 0;
  inputDt = 0;

  #behaviors: Record<string, Behavior<any, this>> = {};
  addBehavior(id: string, behavior: Behavior<any, this>) {
    this.#behaviors[id] = behavior;
  }
  hasBehavior(id: string) {
    return id in this.#behaviors;
  }
  getBehavior(id: string) {
    return this.#behaviors[id];
  }

  actionPointer = 0;
  actions = [] as ActionDriver<any, this>[][];

  tiles = new Matrix<[{ position: Vector3 }]>();

  #renderer = createRenderer();
  get renderer() {
    return this.#renderer!;
  }

  #camera = createCamera();
  get camera() {
    return this.#camera!;
  }

  cameraController?: { position: Vector3 };

  #scene = new Scene();
  get scene() {
    return this.#scene!;
  }

  #editorCursor = CursorEntity.create(this);
  get editorCursor() {
    return this.#editorCursor;
  }

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
}
