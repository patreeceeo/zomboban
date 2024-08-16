import { IComponentDefinition } from "../Component";
import { LogLevel } from "../Log";
import { log } from "../util";
import {
  AnimationComponent,
  BehaviorComponent,
  HeadingDirectionComponent,
  IsActiveTag,
  IsGameEntityTag,
  LevelIdComponent,
  ModelComponent,
  ServerIdComponent,
  TilePositionComponent,
  ToggleableComponent,
  TransformComponent
} from "../components";

const NETWORK_COMPONENTS = [
  LevelIdComponent,
  ServerIdComponent,
  TransformComponent,
  TilePositionComponent,
  AnimationComponent,
  ModelComponent,
  BehaviorComponent,
  HeadingDirectionComponent,
  IsActiveTag,
  IsGameEntityTag,
  ToggleableComponent
];

function set(entity: any, component: IComponentDefinition<any>, data: any) {
  // check before adding because adding always notifies observers
  if (!component.has(entity)) {
    component.add(entity, data);
  }
}

function update(entity: any, component: IComponentDefinition<any>, data: any) {
  if (component.canDeserialize(data)) {
    log.append(
      `entity deserialized from ${JSON.stringify(data, null, 2)} to ${entity}`,
      LogLevel.Normal,
      deserializeEntity,
      entity
    );
    set(entity, component, data);
  } else {
    component.remove(entity);
  }
}

function maybeSerialize(
  entity: any,
  component: IComponentDefinition<any>,
  target: any
) {
  if (component.has(entity)) {
    component.serialize(entity, target);
  }
}

export function deserializeEntity(entity: any, data: any) {
  for (const component of NETWORK_COMPONENTS) {
    update(entity, component, data);
  }

  return entity;
}

export function serializeEntity(entity: any, target = {}) {
  for (const component of NETWORK_COMPONENTS) {
    maybeSerialize(entity, component, target);
  }
  return target;
}

export function serializeObject<O extends {}>(object: O): string {
  return JSON.stringify(object, null, 2);
}
