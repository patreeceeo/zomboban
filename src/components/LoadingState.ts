import { ComponentName, initComponentData } from "../ComponentData";

export enum LoadingState {
  Queued,
  Started,
  PreCompleted,
  Completed,
  Failed,
}

const NAME = ComponentName.LoadingState;
const DATA = initComponentData(NAME) as LoadingState[];

export function setLoadingState(entityId: number, value: LoadingState) {
  DATA[entityId] = value;
}

export function hasLoadingQueued(entityId: number): boolean {
  return DATA[entityId] === LoadingState.Queued;
}

export function hasLoadingStarted(entityId: number): boolean {
  return DATA[entityId] === LoadingState.Started;
}

export function hasLoadingPreCompleted(entityId: number): boolean {
  return DATA[entityId] === LoadingState.PreCompleted;
}

export function hasLoadingCompleted(entityId: number): boolean {
  return DATA[entityId] === LoadingState.Completed;
}

export function hasLoadingFailed(entityId: number): boolean {
  return DATA[entityId] === LoadingState.Failed;
}
