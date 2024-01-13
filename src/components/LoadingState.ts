import { defineComponent } from "../Component";
import { invariant } from "../Error";

export enum LoadingState {
  Queued,
  Started,
  PreCompleted,
  Completed,
  Failed,
}

const DATA = defineComponent(
  "LoadingState",
  [],
  hasLoadingState,
  getLoadingState,
  setLoadingState,
  removeLoadingState,
);

export function hasLoadingState(entityId: number): boolean {
  return DATA[entityId] !== undefined;
}

export function getLoadingState(entityId: number): LoadingState {
  invariant(
    DATA[entityId] !== undefined,
    `Entity ${entityId} does not have a LoadingState`,
  );
  return DATA[entityId];
}

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

export function removeLoadingState(entityId: number) {
  delete DATA[entityId];
}
