import { Application, Sprite } from "pixi.js";
import { invariant } from "../Error";
import { EntityStore } from "../Entity";
import {
  EntityFrameOperation,
  EntityFrameOperationComponent,
} from "../components/EntityFrameOperation";
import { Behavior, BehaviorComponent } from "../components/Behavior";
import {
  LoadingState,
  LoadingStateComponent,
} from "../components/LoadingState";
import { SERVER_COMPONENTS } from "../constants";
import {
  loadEntity,
  loadServerEntityIds,
  postEntity,
  putEntity,
} from "../functions/Client";
import { ComponentFilter, ComponentFilterRegistry, Query } from "../Query";
import { ComponentBase, ComponentConstructor } from "../Component";
import { IsAddedComponent } from "../components/IsAddedComponent";
import { IsRemovedComponent } from "../components/IsRemovedComponent";
import { createComponentRegistery } from "./components";
import {
  DisplayContainerComponent,
  GuidComponent,
  PromiseComponent,
  ShouldSaveComponent,
  WorldIdComponent,
} from "../components";

const WorldQuery = Query.build("WorldQuery")
  .addParam("worldId", 0)
  .complete(({ entityId, worldId }) => {
    const { has, get } = state.getComponent(WorldIdComponent);
    return has(entityId) && get(entityId) === worldId;
  });

class State {
  #pixiApp?: Application;
  #isAddedFilterId: number;
  #isRemovedFilterId: number;

  constructor() {
    this.#isAddedFilterId = this.registerComponentFilter(
      new ComponentFilter([this.getComponent(IsAddedComponent)]),
    );
    this.#isRemovedFilterId = this.registerComponentFilter(
      new ComponentFilter([this.getComponent(IsRemovedComponent)]),
    );
  }

  assertPixiApp() {
    invariant(this.#pixiApp !== undefined, "pixiApp is not initialized");
  }

  get pixiApp() {
    this.assertPixiApp();
    return this.#pixiApp!;
  }

  set pixiApp(app: Application) {
    this.#pixiApp = app;
  }

  #entities = new EntityStore();
  get addedEntities() {
    return this.getComponentFilterResults(this.#isAddedFilterId);
  }
  get removedEntities() {
    return this.getComponentFilterResults(this.#isRemovedFilterId);
  }

  isSane = this.#entities.isSane.bind(this.#entities);

  addEntity = (
    factory?: (entityId: number) => void,
    entityId?: number,
    errorIfAlreadyAdded = true,
  ) => {
    const id = this.#entities.add(factory, entityId, errorIfAlreadyAdded);
    this.getComponent(IsAddedComponent).addSet(id, true);
    this.getComponent(IsRemovedComponent).remove(id);
    return id;
  };
  setEntity = (entityId: number) => {
    this.addEntity(undefined, entityId, false);
  };
  removeEntity = (entityId: number) => {
    this.getComponent(IsAddedComponent).remove(entityId);
    this.getComponent(IsRemovedComponent).addSet(entityId, true);
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
    for (const filter of this.#componentFilters.values()) {
      filter.handleAdd(entityId);
    }
  };
  handleRemoveComponent = (
    _type: ComponentConstructor<any>,
    entityId: number,
  ) => {
    for (const filter of this.#componentFilters.values()) {
      filter.handleRemove(entityId);
    }
  };

  #components = createComponentRegistery(
    this.handleAddComponent,
    this.handleRemoveComponent,
  );

  #componentFilters = new ComponentFilterRegistry();

  registerComponentFilter = (filter: ComponentFilter) => {
    return this.#componentFilters.register(filter);
  };
  getComponentFilterResults = (index: number) => {
    const filters = this.#componentFilters;
    invariant(filters.has(index), `ComponentFilter ${index} does not exist`);
    return filters.get(index).results;
  };

  #serverComponents = SERVER_COMPONENTS.reduce(
    (acc, klass) => {
      acc[klass.name] = this.#components.get(klass)!;
      return acc;
    },
    {} as Record<string, ComponentBase<any, any>>,
  );

  #currentWorldId = 0;
  get currentWorldId() {
    return this.#currentWorldId;
  }

  getEntitiesOfWorld(worldId: number) {
    return WorldQuery.setParam("worldId", worldId).execute(this.addedEntities);
  }

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
    WorldQuery.setParam("worldId", worldId);
    const entities = WorldQuery.execute(this.removedEntities);
    for (const entityId of entities) {
      this.recycleEntity(entityId);
    }
  };

  loadWorld = async (worldId: number) => {
    // TODO when will they be recycled?
    state.removeEntitiesFromWorld(this.#currentWorldId);
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
        this.#serverComponents,
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
      postEntity(entityId, this.#serverComponents),
    );
  };

  putEntity = async (entityId: number) => {
    const serverEntityId = this.get(GuidComponent, entityId);
    this.set(
      PromiseComponent,
      entityId,
      putEntity(entityId, serverEntityId, this.#serverComponents),
    );
  };

  getComponent = <Klass extends ComponentConstructor<any, any>>(
    klass: Klass,
  ) => {
    return this.#components.get(klass) as InstanceType<Klass>;
  };
  getComponents = (...klasses: ComponentConstructor<any, any>[]) => {
    return klasses.map((klass) => this.getComponent(klass)!);
  };
  hasComponent = (klass: ComponentConstructor<any, any>, entityId: number) => {
    return this.getComponent(klass)!.has(entityId);
  };

  getComponentValue = (
    klass: ComponentConstructor<any, any>,
    entityId: number,
  ) => {
    return this.getComponent(klass)!.get(entityId);
  };

  get components() {
    return this.#components[Symbol.iterator]();
  }
  get serverComponents() {
    return this.#serverComponents;
  }

  has<T>(ctor: ComponentConstructor<T, any>, entityId: number) {
    return this.getComponent(ctor).has(entityId);
  }
  get<T>(
    ctor: ComponentConstructor<T, any>,
    entityId: number,
    defaultValue?: T,
  ): T {
    return this.getComponent(ctor).get(entityId, defaultValue);
  }
  is<T>(ctor: ComponentConstructor<T, any>, entityId: number, value: T) {
    return this.getComponent(ctor).is(entityId, value);
  }
  set<T>(ctor: ComponentConstructor<T, any>, entityId: number, value: T) {
    this.getComponent(ctor).addSet(entityId, value);
  }
  remove<T>(ctor: ComponentConstructor<T, any>, entityId: number) {
    this.getComponent(ctor).remove(entityId);
  }

  hasSprite = (entityId: number) => {
    const { has, get } = this.getComponent(DisplayContainerComponent);
    return has(entityId) && get(entityId) instanceof Sprite;
  };
  getSprite = (entityId: number) => {
    invariant(
      this.hasSprite(entityId),
      `entity ${entityId} does not have a Sprite instance as its DisplayContainer`,
    );
    return this.get(DisplayContainerComponent, entityId) as Sprite;
  };
  setSprite = (entityId: number, sprite: Sprite) => {
    this.set(DisplayContainerComponent, entityId, sprite);
  };
  removeSprite = (entityId: number) => {
    this.remove(DisplayContainerComponent, entityId);
  };

  isBehavior = (
    entityId: number,
    behavior: new (entityId: number) => Behavior,
  ) => {
    const { has, get } = this.getComponent(BehaviorComponent);
    return has(entityId) && get(entityId) instanceof behavior;
  };

  isLoadingState = (entityId: number, state: LoadingState) => {
    const { has, get } = this.getComponent(LoadingStateComponent);
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
    operation: EntityFrameOperation,
  ) => {
    const { has, get } = this.getComponent(EntityFrameOperationComponent);
    return has(entityId) && get(entityId) === operation;
  };

  setToBeRemovedThisFrame = (entityId: number) => {
    const { addSet } = this.getComponent(EntityFrameOperationComponent);
    addSet(entityId, EntityFrameOperation.REMOVE);
  };

  setToBeRestoredThisFrame = (entityId: number) => {
    const { addSet } = this.getComponent(EntityFrameOperationComponent);
    addSet(entityId, EntityFrameOperation.RESTORE);
  };

  shouldSaveEntity = (entityId: number) => {
    const { has, get } = this.getComponent(ShouldSaveComponent);
    return has(entityId) && get(entityId);
  };
}

export const state = new State();

// (window as any).state = state;
