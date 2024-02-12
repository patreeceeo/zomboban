import { Application, Sprite, Text } from "pixi.js";
import { invariant } from "../Error";
import { EntityStore } from "../Entity";
import { ComponentDictionary } from "../components";
import { LayerId } from "../components/LayerId";
import { EntityFrameOperation } from "../components/EntityFrameOperation";
import { Behavior } from "../components/Behavior";
import { LoadingState } from "../components/LoadingState";
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

const WorldQuery = Query.build("WorldQuery")
  .addParam("worldId", 0)
  .complete(({ entityId, worldId }) => {
    return state.hasWorldId(entityId) && state.getWorldId(entityId) === worldId;
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

  addEntity(
    factory?: (entityId: number) => void,
    entityId?: number,
    errorIfAlreadyAdded = true,
  ) {
    const id = this.#entities.add(factory, entityId, errorIfAlreadyAdded);
    this.getComponent(IsAddedComponent).addSet(id, true);
    this.getComponent(IsRemovedComponent).remove(id);
    return id;
  }
  setEntity(entityId: number) {
    this.addEntity(undefined, entityId, false);
  }
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

  handleAddComponent = (entityId: number) => {
    for (const filter of this.#componentFilters.values()) {
      filter.handleAdd(entityId);
    }
  };
  handleRemoveComponent = (entityId: number) => {
    for (const filter of this.#componentFilters.values()) {
      filter.handleRemove(entityId);
    }
  };

  #components = new ComponentDictionary(
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
      this.setPromise(id, loadWorldPromise);
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
      this.setPromise(clientEntityId, promise);
      entityPromises.push(promise);
    }

    await Promise.all(entityPromises);
  };

  postEntity = async (entityId: number) => {
    this.setPromise(entityId, postEntity(entityId, this.#serverComponents));
  };

  putEntity = async (entityId: number) => {
    const serverEntityId = this.getGuid(entityId);
    this.setPromise(
      entityId,
      putEntity(entityId, serverEntityId, this.#serverComponents),
    );
  };

  getComponent = (klass: ComponentConstructor<any, any>) => {
    return this.#components.get(klass);
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

  hasGuid = this.#components.Guid.has;
  getGuid = this.#components.Guid.get;
  setGuid = this.#components.Guid.addSet;
  removeGuid = this.#components.Guid.remove;

  hasPositionX = this.#components.PositionX.has;
  getPositionX = this.#components.PositionX.get;
  setPositionX = this.#components.PositionX.addSet;
  removePositionX = this.#components.PositionX.remove;

  hasPositionY = this.#components.PositionY.has;
  getPositionY = this.#components.PositionY.get;
  setPositionY = this.#components.PositionY.addSet;
  removePositionY = this.#components.PositionY.remove;

  setPosition = (entityId: number, x: Px, y: Px) => {
    this.setPositionX(entityId, x);
    this.setPositionY(entityId, y);
  };

  hasTint = this.#components.Tint.has;
  getTint = this.#components.Tint.get;
  setTint = this.#components.Tint.addSet;
  removeTint = this.#components.Tint.remove;

  isOnLayer = (layerId: LayerId, entityId: number) => {
    const { has, get } = this.#components.LayerId;
    return has(entityId) && get(entityId) === layerId;
  };
  getLayerId = this.#components.LayerId.get;
  setLayer = this.#components.LayerId.addSet;
  removeLayer = this.#components.LayerId.remove;

  hasImage = this.#components.Image.has;
  getImage = this.#components.Image.get;
  setImage = this.#components.Image.addSet;
  removeImage = this.#components.Image.remove;

  hasImageId = this.#components.ImageId.has;
  getImageId = this.#components.ImageId.get;
  setImageId = this.#components.ImageId.addSet;
  removeImageId = this.#components.ImageId.remove;

  hasSprite = (entityId: number) => {
    const DisplayContainer = this.#components.DisplayContainer;
    return (
      DisplayContainer.has(entityId) &&
      DisplayContainer.get(entityId) instanceof Sprite
    );
  };
  getSprite = (entityId: number) => {
    invariant(
      this.hasSprite(entityId),
      `entity ${entityId} does not have a Sprite instance as its DisplayContainer`,
    );
    return this.getDisplayContainer(entityId) as Sprite;
  };
  setSprite = (entityId: number, sprite: Sprite) => {
    this.setDisplayContainer(entityId, sprite);
  };
  removeSprite = (entityId: number) => {
    this.removeDisplayContainer(entityId);
  };

  hasAnimation = this.#components.Animation.has;
  getAnimation = this.#components.Animation.get;
  setAnimation = this.#components.Animation.addSet;
  removeAnimation = this.#components.Animation.remove;

  get playerId() {
    return this.#components.Behavior.playerId;
  }

  hasBehavior = this.#components.Behavior.has;
  getBehavior = this.#components.Behavior.get;
  isBehavior = (
    entityId: number,
    behavior: new (entityId: number) => Behavior,
  ) => {
    return (
      this.hasBehavior(entityId) &&
      this.getBehavior(entityId) instanceof behavior
    );
  };
  setBehavior = this.#components.Behavior.addSet;
  removeBehavior = this.#components.Behavior.remove;
  registerBehaviorType = this.#components.Behavior.registerType;

  isVisible = this.#components.IsVisible.get;
  setVisible = this.#components.IsVisible.addSet;

  // TODO: every system that touches the stage/scene should have its own display object component.
  // There should be no generic "DisplayContainer" component.
  hasDisplayContainer = this.#components.DisplayContainer.has;
  getDisplayContainer = this.#components.DisplayContainer.get;
  setDisplayContainer = this.#components.DisplayContainer.addSet;
  removeDisplayContainer = this.#components.DisplayContainer.remove;

  /** @deprecated */
  isTextDisplayContainer = (entityId: number) => {
    return this.getDisplayContainer(entityId) instanceof Text;
  };

  // TODO: Do we need to have entities for text? See also: simplifying the RenderSystem
  /** @deprecated */
  displayText = (entityId: number, text: string) => {
    invariant(
      this.isTextDisplayContainer(entityId),
      `entity ${entityId} does not have a Text instance as its DisplayContainer`,
    );
    (this.getDisplayContainer(entityId) as Text).text = text;
  };

  setLoadingState = this.#components.LoadingState.addSet;
  isLoadingState = (entityId: number, state: LoadingState) => {
    const { has, get } = this.#components.LoadingState;
    return has(entityId) && get(entityId) === state;
  };

  isLoadingStarted = (entityId: number) =>
    this.isLoadingState(entityId, LoadingState.Started);
  isLoadingCompleted = (entityId: number) =>
    this.isLoadingState(entityId, LoadingState.Completed);
  isLoadingFailed = (entityId: number) =>
    this.isLoadingState(entityId, LoadingState.Failed);
  // isAllLoadingCompleted = (entityIds = this.addedEntities) => {
  //   for (const entityId of entityIds) {
  //     if (!this.isLoadingCompleted(entityId)) {
  //       return false;
  //     }
  //   }
  //   return true;
  // };

  isEntityRemovedThisFrame = (entityId: number) =>
    this.isEntityDoingThisFrame(entityId, EntityFrameOperation.REMOVE);

  isEntityRestoredThisFrame = (entityId: number) =>
    this.isEntityDoingThisFrame(entityId, EntityFrameOperation.RESTORE);

  isEntityDoingThisFrame = (
    entityId: number,
    operation: EntityFrameOperation,
  ) => {
    const Operation = this.#components.EntityFrameOperation;
    return Operation.has(entityId) && Operation.get(entityId) === operation;
  };

  setToBeRemovedThisFrame = (entityId: number) => {
    const Operation = this.#components.EntityFrameOperation;
    Operation.addSet(entityId, EntityFrameOperation.REMOVE);
  };

  setToBeRestoredThisFrame = (entityId: number) => {
    const Operation = this.#components.EntityFrameOperation;
    Operation.addSet(entityId, EntityFrameOperation.RESTORE);
  };

  clearEntityFrameOperation = this.#components.EntityFrameOperation.remove;

  hasCameraFollow = this.#components.CameraFollow.has;
  getCameraFollow = this.#components.CameraFollow.get;
  setCameraFollow = this.#components.CameraFollow.addSet;
  removeCameraFollow = this.#components.CameraFollow.remove;

  shouldSaveEntity = (entityId: number) => {
    const ShouldSave = this.#components.ShouldSave;
    return ShouldSave.has(entityId) && ShouldSave.get(entityId);
  };

  setShouldSaveEntity = this.#components.ShouldSave.addSet;

  hasPromise = this.#components.Promise.has;
  getPromise = this.#components.Promise.get;
  setPromise = this.#components.Promise.addSet;
  removePromise = this.#components.Promise.remove;

  hasWorldId = this.#components.WorldId.has;
  getWorldId = this.#components.WorldId.get;
  setWorldId = this.#components.WorldId.addSet;
  removeWorldId = this.#components.WorldId.remove;
}

export const state = new State();

// (window as any).state = state;
