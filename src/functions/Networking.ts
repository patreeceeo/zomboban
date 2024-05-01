import { IComponentDefinition } from "../Component";
import {
  AddedTag,
  AnimationComponent,
  BehaviorComponent,
  IsActiveTag,
  IsGameEntityTag,
  ModelComponent,
  ServerIdComponent,
  TransformComponent
} from "../components";

function set(entity: any, component: IComponentDefinition<any>, data: any) {
  // check before adding because adding always notifies observers
  if (!component.has(entity)) {
    component.add(entity, data);
  }
}

function update(entity: any, component: IComponentDefinition<any>, data: any) {
  if (component.canDeserialize(data)) {
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

const components = [
  ServerIdComponent,
  TransformComponent,
  AnimationComponent,
  ModelComponent,
  BehaviorComponent,
  IsActiveTag,
  IsGameEntityTag,
  AddedTag
];

export function deserializeEntity(entity: any, data: any) {
  for (const component of components) {
    update(entity, component, data);
  }
  return entity;
}

export function serializeEntity(entity: any, target = {}) {
  for (const component of components) {
    maybeSerialize(entity, component, target);
  }
  return target;
}

export function serializeObject<O extends {}>(object: O): string {
  return JSON.stringify(object, null, 2);
}
