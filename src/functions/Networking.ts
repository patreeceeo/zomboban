import {
  BehaviorComponent,
  InputReceiverTag,
  IsActiveTag,
  IsGameEntityTag,
  ServerIdComponent,
  SpriteComponent2
} from "../components";

export function deserializeEntity(entity: any, entityData: string) {
  const data = JSON.parse(entityData);
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
  }
  if (IsGameEntityTag.canDeserialize(data)) {
    IsGameEntityTag.add(entity, data);
  }
  if (InputReceiverTag.canDeserialize(data)) {
    InputReceiverTag.add(entity, data);
  }
  return entity;
}

export function serializeEntity(entity: any, target = {}): string {
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
  return JSON.stringify(target);
}
