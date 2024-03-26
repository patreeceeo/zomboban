import {
  AddedTag,
  BehaviorComponent,
  InputReceiverTag,
  IsActiveTag,
  IsGameEntityTag,
  ServerIdComponent,
  SpriteComponent2
} from "../components";

export function deserializeEntity(entity: any, data: any) {
  if (ServerIdComponent.canDeserialize(data)) {
    ServerIdComponent.add(entity, data);
  }
  if (SpriteComponent2.canDeserialize(data)) {
    SpriteComponent2.add(entity, data);
  }
  if (BehaviorComponent.canDeserialize(data)) {
    BehaviorComponent.add(entity, data);
  }
  if (IsActiveTag.canDeserialize(data)) {
    IsActiveTag.add(entity, data);
  } else {
    IsActiveTag.remove(entity);
  }
  if (IsGameEntityTag.canDeserialize(data)) {
    IsGameEntityTag.add(entity, data);
  } else {
    IsGameEntityTag.remove(entity);
  }
  if (InputReceiverTag.canDeserialize(data)) {
    InputReceiverTag.add(entity, data);
  } else {
    InputReceiverTag.remove(entity);
  }
  if (AddedTag.canDeserialize(data)) {
    AddedTag.add(entity, data);
  } else {
    AddedTag.remove(entity);
  }
  return entity;
}

export function serializeEntity(entity: any, target = {}) {
  if (ServerIdComponent.has(entity)) {
    ServerIdComponent.serialize(entity, target);
  }
  if (SpriteComponent2.has(entity)) {
    SpriteComponent2.serialize(entity, target);
  }
  if (BehaviorComponent.has(entity)) {
    BehaviorComponent.serialize(entity, target);
  }
  if (IsActiveTag.has(entity)) {
    IsActiveTag.serialize(entity, target);
  }
  if (IsGameEntityTag.has(entity)) {
    IsGameEntityTag.serialize(entity, target);
  }
  if (InputReceiverTag.has(entity)) {
    InputReceiverTag.serialize(entity, target);
  }
  if (AddedTag.has(entity)) {
    AddedTag.serialize(entity, target);
  }
  return target;
}

export function serializeObject<O extends {}>(object: O): string {
  return JSON.stringify(object, null, 2);
}
