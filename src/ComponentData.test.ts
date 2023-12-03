import test from "node:test";
import {
  ComponentName,
  appendComponentData,
  getComponentData,
  initComponentData,
} from "./ComponentData";
import assert from "node:assert";
import { executeFilterQuery } from "./Query";
import { peekNextEntityId, registerEntity } from "./Entity";

await test("initComponentData", () => {
  const NAME = ComponentName.IsVisible;
  const DATA = initComponentData(NAME) as boolean[];
  const COMPONENT_DATA = getComponentData();

  assert.equal(DATA, COMPONENT_DATA[NAME]);

  // hot reload
  DATA[0] = true;
  assert.equal(DATA, initComponentData(NAME));
});

function testAppend<T>(
  source: T[],
  data: T[],
  nextEntityId: number,
  expectedData: ReadonlyArray<T>,
  expectedEntities: ReadonlyArray<number>,
) {
  appendComponentData(source, data, nextEntityId);

  assert.deepEqual(data, expectedData);

  for (let i = 0; i < data.length; i++) {
    registerEntity(i);
  }
  const queryResult = executeFilterQuery((_id) => true, []);
  assert.deepEqual(queryResult, expectedEntities);
  assert.equal(peekNextEntityId(), expectedEntities.length);
}

await test("appendComponentData", () => {
  testAppend([7, 5, 3], [], 3, [, , , 7, 5, 3], [0, 1, 2, 3, 4, 5]);
  testAppend([7, 5, 3], [], 3, [, , , 7, 5, 3], [0, 1, 2, 3, 4, 5]);
});
