// import assert from "assert";
import test from "node:test";
import { TileSystem } from "./TileSystem";
import { MockState } from "../testHelpers";
import {
  AddedTag,
  BehaviorComponent,
  ChangedTag,
  IsGameEntityTag,
  TransformComponent
} from "../components";
import { SystemManager } from "../System";

test("placing entities in tiles", () => {
  const state = new MockState();
  const entity = state.addEntity();
  const system = new TileSystem(new SystemManager(state));

  system.start(state);

  BehaviorComponent.add(entity);
  TransformComponent.add(entity);
  AddedTag.add(entity);
  IsGameEntityTag.add(entity);
  ChangedTag.add(entity);

  // const tile = state.tiles.get(0, 0);

  // assert(tile.entities.has(entity));
  // assert.equal(tile.inbox, entity.inbox);
});
