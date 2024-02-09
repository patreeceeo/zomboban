import { Application, Sprite, Text } from "pixi.js";
import { invariant } from "../Error";
import { EntityStore } from "../Entity";
import { ComponentDictionary, ComponentName } from "../components";
import { LayerId } from "../components/Layer";
import { EntityFrameOperation } from "../components/EntityFrameOperation";
import { Behavior } from "../components/Behavior";
import { LoadingState } from "../components/LoadingState";
import { SERVER_COMPONENT_NAMES } from "../constants";
import {
  loadEntity,
  loadServerEntityIds,
  postEntity,
  putEntity,
} from "../functions/Client";
import { Query } from "../Query";
import { pick } from "../util";

const WorldQuery = Query.build("WorldQuery")
  .addParam("worldId", 0)
  .complete(({ entityId, worldId }) => {
    return state.hasWorldId(entityId) && state.getWorldId(entityId) === worldId;
  });

class State {
  #pixiApp?: Application;

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
    return this.#entities.added;
  }

  get removedEntities() {
    return this.#entities.removed;
  }

  isSane = this.#entities.isSane.bind(this.#entities);

  addEntity = this.#entities.add.bind(this.#entities);
  setEntity = this.#entities.set.bind(this.#entities);
  removeEntity = this.#entities.remove.bind(this.#entities);
  recycleEntity = (entityId: number) => {
    for (const component of this.#components) {
      if (component.has(entityId)) {
        component.remove(entityId);
      }
    }
    this.#entities.recycle(entityId);
  };

  #components = new ComponentDictionary();
  #serverComponents = pick(this.#components, SERVER_COMPONENT_NAMES);

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
    mutState.removeEntitiesFromWorld(this.#currentWorldId);
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

  getComponent = (componentName: ComponentName) => {
    return this.#components.get(componentName);
  };
  hasComponent = (componentName: ComponentName, entityId: number) => {
    return this.#components.get(componentName).has(entityId);
  };

  getComponentValue = (componentName: ComponentName, entityId: number) => {
    return this.#components.get(componentName).get(entityId);
  };

  get components() {
    return this.#components[Symbol.iterator]();
  }
  get serverComponents() {
    return this.#serverComponents;
  }

  hasGuid = this.getComponent(ComponentName.Guid).has;
  getGuid = this.getComponent(ComponentName.Guid).get;
  setGuid = this.getComponent(ComponentName.Guid).addSet;
  removeGuid = this.getComponent(ComponentName.Guid).remove;

  hasPositionX = this.getComponent(ComponentName.PositionX).has;
  getPositionX = this.getComponent(ComponentName.PositionX).get;
  setPositionX = this.getComponent(ComponentName.PositionX).addSet;
  removePositionX = this.getComponent(ComponentName.PositionX).remove;

  hasPositionY = this.getComponent(ComponentName.PositionY).has;
  getPositionY = this.getComponent(ComponentName.PositionY).get;
  setPositionY = this.getComponent(ComponentName.PositionY).addSet;
  removePositionY = this.getComponent(ComponentName.PositionY).remove;

  setPosition = (entityId: number, x: number, y: number) => {
    this.setPositionX(entityId, x);
    this.setPositionY(entityId, y);
  };

  hasTint = this.getComponent(ComponentName.Tint).has;
  getTint = this.getComponent(ComponentName.Tint).get;
  setTint = this.getComponent(ComponentName.Tint).addSet;
  removeTint = this.getComponent(ComponentName.Tint).remove;

  isOnLayer = (layerId: LayerId, entityId: number) => {
    const LayerId = this.getComponent(ComponentName.LayerId);
    return LayerId.has(entityId) && LayerId.get(entityId) === layerId;
  };
  getLayerId = this.getComponent(ComponentName.LayerId).get;
  setLayer = this.getComponent(ComponentName.LayerId).addSet;

  hasImage = this.getComponent(ComponentName.Image).has;
  getImage = this.getComponent(ComponentName.Image).get;
  setImage = this.getComponent(ComponentName.Image).addSet;
  removeImage = this.getComponent(ComponentName.Image).remove;

  hasImageId = this.getComponent(ComponentName.ImageId).has;
  getImageId = this.getComponent(ComponentName.ImageId).get;
  setImageId = this.getComponent(ComponentName.ImageId).addSet;
  removeImageId = this.getComponent(ComponentName.ImageId).remove;

  hasSprite = (entityId: number) => {
    const DisplayContainer = this.getComponent(ComponentName.DisplayContainer);
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

  setLoadingState = this.getComponent(ComponentName.LoadingState).addSet;
  isLoadingState = (entityId: number, state: LoadingState) => {
    const { has, get } = this.getComponent(ComponentName.LoadingState);
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
    const Operation = this.getComponent(ComponentName.EntityFrameOperation);
    return Operation.has(entityId) && Operation.get(entityId) === operation;
  };

  setToBeRemovedThisFrame = (entityId: number) => {
    const Operation = this.getComponent(ComponentName.EntityFrameOperation);
    Operation.addSet(entityId, EntityFrameOperation.REMOVE);
  };

  setToBeRestoredThisFrame = (entityId: number) => {
    const Operation = this.getComponent(ComponentName.EntityFrameOperation);
    Operation.addSet(entityId, EntityFrameOperation.RESTORE);
  };

  clearEntityFrameOperation = this.getComponent(
    ComponentName.EntityFrameOperation,
  ).remove;

  hasCameraFollow = this.getComponent(ComponentName.CameraFollow).has;
  getCameraFollow = this.getComponent(ComponentName.CameraFollow).get;
  setCameraFollow = this.getComponent(ComponentName.CameraFollow).addSet;
  removeCameraFollow = this.getComponent(ComponentName.CameraFollow).remove;

  shouldSaveEntity = (entityId: number) => {
    const ShouldSave = this.getComponent(ComponentName.ShouldSave);
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

const _state = new State();

type ViewableState = Pick<
  State,
  | "isSane"
  | "hasComponent"
  | "getComponentValue"
  | "playerId"
  | "addedEntities"
  | "removedEntities"
  | "hasGuid"
  | "getGuid"
  | "getPositionX"
  | "hasPositionX"
  | "getPositionY"
  | "hasPositionY"
  | "getTint"
  | "hasTint"
  | "isOnLayer"
  | "getLayerId"
  | "hasImage"
  | "getImage"
  | "hasImageId"
  | "getImageId"
  | "hasSprite"
  | "hasAnimation"
  | "hasBehavior"
  | "getBehavior"
  | "isBehavior"
  | "isVisible"
  | "hasDisplayContainer"
  | "getDisplayContainer"
  | "isLoadingStarted"
  | "isLoadingCompleted"
  | "isEntityRemovedThisFrame"
  | "isEntityRestoredThisFrame"
  | "hasCameraFollow"
  | "getCameraFollow"
  | "shouldSaveEntity"
  | "hasPromise"
  | "getPromise"
  | "hasWorldId"
  | "getWorldId"
  | "currentWorldId"
  | "getEntitiesOfWorld"
>;

// TODO none of the types of these components should be mutable
// but since some are, their getter functions have to be in the modifiable state
type ModifiableState = Pick<
  State,
  | "pixiApp"
  | "addEntity"
  | "setEntity"
  | "removeEntity"
  | "recycleEntity"
  | "serverComponents"
  | "setPosition"
  | "setPositionX"
  | "setPositionY"
  | "removePositionX"
  | "removePositionY"
  | "setTint"
  | "removeTint"
  | "setLayer"
  | "setImage"
  | "removeImage"
  | "setImageId"
  | "removeImageId"
  | "getSprite"
  | "setSprite"
  | "getAnimation"
  | "setAnimation"
  | "removeAnimation"
  | "setBehavior"
  | "removeBehavior"
  | "registerBehaviorType"
  | "setVisible"
  | "setDisplayContainer"
  | "removeDisplayContainer"
  | "setLoadingState"
  | "setToBeRemovedThisFrame"
  | "setToBeRestoredThisFrame"
  | "clearEntityFrameOperation"
  | "setCameraFollow"
  | "removeCameraFollow"
  | "setShouldSaveEntity"
  | "setPromise"
  | "removePromise"
  | "setWorldId"
  | "removeWorldId"
  | "setGuid"
  | "removeGuid"
  | "removeEntitiesFromWorld"
  | "recycleEntitiesFromWorld"
  | "currentWorldId"
  | "loadWorld"
  | "postEntity"
  | "putEntity"
>;

export const state = _state as ViewableState;
export const mutState = _state as ModifiableState;

// (window as any).state = state;
