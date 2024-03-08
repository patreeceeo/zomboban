import { invariant } from "../Error";
import { EntityStore } from "../Entity";
import {
  EntityFrameOperation,
  EntityFrameOperationComponent
} from "../components/EntityFrameOperation";
import {
  Behavior as OldBehavior,
  BehaviorComponent
} from "../components/Behavior";
import {
  LoadingState,
  LoadingStateComponentOld
} from "../components/LoadingState";
import {
  loadEntity,
  loadServerEntityIds,
  postEntity,
  putEntity
} from "../functions/Client";
import { ComponentFilterRegistry, Query, QueryManager } from "../Query";
import { ComponentConstructor } from "../Component";
import { IsAddedComponent } from "../components/IsAddedComponent";
import { IsRemovedComponent } from "../components/IsRemovedComponent";
import { createComponentRegistery } from "./components";
import {
  GuidComponent,
  PromiseComponent,
  ShouldSaveComponent,
  WorldIdComponent
} from "../components";
import { Texture, Camera, Renderer, Scene, Vector3 } from "three";
import { SERVER_COMPONENTS } from "../constants";
import { World } from "../EntityManager";
import { createRenderer } from "../systems/RenderSystem";
import { createCamera } from "../systems/CameraSystem";
import { DEFAULT_ROUTE, RouteId } from "../routes";
import { IObservableSubscription, Observable } from "../Observable";
import { Behavior } from "../systems/BehaviorSystem";
import { Action } from "../systems/ActionSystem";
import { CursorEntity } from "../entities/CursorEntity";

export interface IState extends World {
  addTexture(id: string, texture: Texture): void;
  hasTexture(id: string): boolean;
  getTexture(id: string): Texture;

  addBehavior(id: string, behavior: Behavior<any, this>): void;
  hasBehavior(id: string): boolean;
  getBehavior(id: string): Behavior<any, this>;

  addActions(actions: Action<any, this>[]): void;

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

  #actions: Action<any, this>[] = [];
  addActions(actions: Action<any, this>[]) {
    this.#actions.push(...actions);
  }

  #renderer = createRenderer();
  get renderer() {
    return this.#renderer!;
  }

  #camera = createCamera();
  get camera() {
    return this.#camera!;
  }

  #cameraTarget = new Vector3();
  get cameraTarget() {
    return this.#cameraTarget!;
  }

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

/*
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * TODO remove old code
 */

interface QueryDefinition {
  name: string;
  all: ComponentConstructor<any>[];
  none: ComponentConstructor<any>[];
  includeRemoved?: boolean;
}

class StateOld {
  #renderer?: Renderer;
  #camera?: Camera;
  #scene?: Scene;

  assertRenderer() {
    invariant(this.#renderer !== undefined, "renderer is not initialized");
  }

  assertCamera() {
    invariant(this.#camera !== undefined, "camera is not initialized");
  }

  assertScene() {
    invariant(this.#scene !== undefined, "scene is not initialized");
  }

  get renderer() {
    this.assertRenderer();
    return this.#renderer!;
  }

  set renderer(renderer: Renderer) {
    this.#renderer = renderer;
  }

  get camera() {
    this.assertCamera();
    return this.#camera!;
  }

  set camera(camera: Camera) {
    this.#camera = camera;
  }

  get scene() {
    this.assertScene();
    return this.#scene!;
  }

  set scene(scene: Scene) {
    this.#scene = scene;
  }

  #entities = new EntityStore();

  isSane = this.#entities.isSane.bind(this.#entities);

  reset() {
    this.#currentWorldId = 0;
    this.#entities.reset();
    // TODO
    // this.#components.reset();
    // this.#componentFilters.reset();
  }

  addEntity = (
    factory?: (entityId: number) => void,
    entityId?: number,
    errorIfAlreadyAdded = true
  ) => {
    const id = this.#entities.add(factory, entityId, errorIfAlreadyAdded);
    this.getComponent(IsAddedComponent).set(id, true);
    this.getComponent(IsRemovedComponent).remove(id);
    return id;
  };
  setEntity = (entityId: number) => {
    this.addEntity(undefined, entityId, false);
  };
  removeEntity = (entityId: number) => {
    this.getComponent(IsAddedComponent).remove(entityId);
    this.getComponent(IsRemovedComponent).set(entityId, true);
  };
  recycleEntity = (entityId: number) => {
    for (const component of this.#components) {
      if (component.has(entityId)) {
        component.remove(entityId);
      }
    }
    this.#entities.recycle(entityId);
  };

  handleAddComponent = (_type: ComponentConstructor<any>, entityId: number) => {
    // TODO move this to ComponentFilterRegistry
    for (const filter of this.#componentFilters.values()) {
      filter.handleAdd(entityId);
    }
  };
  handleRemoveComponent = (
    _type: ComponentConstructor<any>,
    entityId: number
  ) => {
    // TODO move this to ComponentFilterRegistry
    for (const filter of this.#componentFilters.values()) {
      filter.handleRemove(entityId);
    }
  };

  #components = createComponentRegistery(
    this.handleAddComponent,
    this.handleRemoveComponent
  );

  #componentFilters = new ComponentFilterRegistry();

  #defaultQueryOptions: Partial<QueryDefinition> = {
    includeRemoved: false
  };

  buildQuery = (options = this.#defaultQueryOptions) => {
    const componentKlasses = options.all ?? [];
    return Query.buildWithComponentFilterEntitySource(
      this.#components,
      this.#componentFilters,
      options.includeRemoved
        ? componentKlasses
        : [IsAddedComponent, ...componentKlasses],
      this.#entities.values(),
      options.name
    );
  };

  #worldIdQuery = this.buildQuery({ all: [WorldIdComponent] })
    .addParam("worldId", 0)
    .complete(({ entityId, worldId }) => {
      return this.get(WorldIdComponent, entityId) === worldId;
    });

  #addedEntitiesQuery = this.buildQuery().complete();
  get addedEntities() {
    return this.#addedEntitiesQuery();
  }

  #removedEntitiesQuery = this.buildQuery({
    all: [IsRemovedComponent],
    includeRemoved: true
  }).complete();

  get removedEntities() {
    return this.#removedEntitiesQuery();
  }

  // #serverComponents = SERVER_COMPONENTS.reduce(
  //   (acc, klass) => {
  //     acc[klass.name] = this.#components.get(klass)!;
  //     return acc;
  //   },
  //   {} as Record<string, ComponentBase<any, any>>
  // );

  #currentWorldId = 0;
  get currentWorldId() {
    return this.#currentWorldId;
  }

  getEntitiesOfWorld(worldId: number) {
    return this.#worldIdQuery.setParam("worldId", worldId).execute();
  }
  // BEGIN TODO do these methods belong here {

  removeEntitiesFromWorld = (worldId: number) => {
    const entities = this.getEntitiesOfWorld(worldId);
    let count = 0;
    for (const entityId of entities) {
      this.setToBeRemovedThisFrame(entityId);
      count++;
    }
    return count;
  };

  recycleEntitiesFromWorld = (worldId: number) => {
    for (const entityId of this.getEntitiesOfWorld(worldId)) {
      this.recycleEntity(entityId);
    }
  };

  loadWorld = async (worldId: number) => {
    // TODO when will they be recycled?
    stateOld.removeEntitiesFromWorld(this.#currentWorldId);
    /* Fetch the server entity ids for the world */
    this.#currentWorldId = worldId;
    const loadWorldPromise = loadServerEntityIds(worldId);

    this.addEntity((id) => {
      this.set(PromiseComponent, id, loadWorldPromise);
    });

    const serverEntityIds = await loadWorldPromise;

    /* use the server entity ids to load the entities' components */
    const entityPromises = [];

    for (const serverEntityId of serverEntityIds) {
      const clientEntityId = this.addEntity();
      const promise = loadEntity(
        clientEntityId,
        serverEntityId,
        this.#serverComponents
      );
      this.set(PromiseComponent, clientEntityId, promise);
      entityPromises.push(promise);
    }

    await Promise.all(entityPromises);
  };

  postEntity = async (entityId: number) => {
    this.set(
      PromiseComponent,
      entityId,
      postEntity(entityId, this.#serverComponents)
    );
  };

  putEntity = async (entityId: number) => {
    const serverEntityId = this.get(GuidComponent, entityId);
    this.set(
      PromiseComponent,
      entityId,
      putEntity(entityId, serverEntityId, this.#serverComponents)
    );
  };
  // END TODO do these methods belong here?

  getComponent = (klass: ComponentConstructor<any>) => {
    return this.#components.get(klass) as InstanceType<
      ComponentConstructor<any>
    >;
  };
  hasComponent = (klass: ComponentConstructor<any>, entityId: number) => {
    return this.getComponent(klass)!.has(entityId);
  };

  get components() {
    return this.#components[Symbol.iterator]();
  }

  #serverComponents = SERVER_COMPONENTS.map((klass) =>
    this.getComponent(klass)
  );

  get serverComponents() {
    return this.#serverComponents;
  }

  has<T>(ctor: ComponentConstructor<T, any>, entityId: number) {
    return this.getComponent(ctor).has(entityId);
  }
  get<I>(
    ctor: ComponentConstructor<I, any>,
    entityId: number,
    defaultValue?: I
  ): I {
    return this.getComponent(ctor).get(entityId, defaultValue);
  }
  is<T>(ctor: ComponentConstructor<T, any>, entityId: number, value: T) {
    return this.getComponent(ctor).is(entityId, value);
  }
  set<T>(ctor: ComponentConstructor<T, any>, entityId: number, value: T) {
    this.getComponent(ctor).set(entityId, value);
  }
  acquire<T>(ctor: ComponentConstructor<T, any>, entityId: number) {
    return this.getComponent(ctor).acquire(entityId);
  }
  copy<T>(ctor: ComponentConstructor<T, any>, entity: number, src: T) {
    const comp = this.getComponent(ctor);
    comp.copy(comp.get(entity), src);
  }
  remove<T>(ctor: ComponentConstructor<T, any>, entityId: number) {
    this.getComponent(ctor).remove(entityId);
  }

  // TODO remove the rest of these methods
  isBehavior = (
    entityId: number,
    behavior: new (entityId: number) => OldBehavior
  ) => {
    const { has, get } = this.getComponent(BehaviorComponent);
    return has(entityId) && get(entityId) instanceof behavior;
  };

  isLoadingState = (entityId: number, state: LoadingState) => {
    const { has, get } = this.getComponent(LoadingStateComponentOld);
    return has(entityId) && get(entityId) === state;
  };

  isLoadingStarted = (entityId: number) =>
    this.isLoadingState(entityId, LoadingState.Started);
  isLoadingCompleted = (entityId: number) =>
    this.isLoadingState(entityId, LoadingState.Completed);
  isLoadingFailed = (entityId: number) =>
    this.isLoadingState(entityId, LoadingState.Failed);

  isEntityRemovedThisFrame = (entityId: number) =>
    this.isEntityDoingThisFrame(entityId, EntityFrameOperation.REMOVE);

  isEntityRestoredThisFrame = (entityId: number) =>
    this.isEntityDoingThisFrame(entityId, EntityFrameOperation.RESTORE);

  isEntityDoingThisFrame = (
    entityId: number,
    operation: EntityFrameOperation
  ) => {
    const { has, get } = this.getComponent(EntityFrameOperationComponent);
    return has(entityId) && get(entityId) === operation;
  };

  setToBeRemovedThisFrame = (entityId: number) => {
    const { set: addSet } = this.getComponent(EntityFrameOperationComponent);
    addSet(entityId, EntityFrameOperation.REMOVE);
  };

  setToBeRestoredThisFrame = (entityId: number) => {
    const { set: addSet } = this.getComponent(EntityFrameOperationComponent);
    addSet(entityId, EntityFrameOperation.RESTORE);
  };

  shouldSaveEntity = (entityId: number) => {
    const { has, get } = this.getComponent(ShouldSaveComponent);
    return has(entityId) && get(entityId);
  };
}

export const stateOld = new StateOld();
