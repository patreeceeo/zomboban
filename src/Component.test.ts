import test from "node:test";
import {
  appendComponentData,
  getComponentData,
  defineComponent,
} from "./Component";
import assert from "node:assert";
import { executeFilterQuery } from "./Query";
import { getNextEntityId, registerEntity } from "./Entity";

await test("initComponentData", () => {
  const NAME = "isVisible";
  const getIsVisible = (entityId: number): boolean => DATA[entityId];
  const setIsVisible = (entityId: number, value: boolean) => {
    DATA[entityId] = value;
  };
  const hasIsVisible = (entityId: number): boolean =>
    DATA[entityId] !== undefined;
  const removeIsVisible = (entityId: number) => {
    delete DATA[entityId];
  };
  const DATA = defineComponent(
    NAME,
    [],
    hasIsVisible,
    getIsVisible,
    setIsVisible,
    removeIsVisible,
  );
  const COMPONENT_DATA = getComponentData();

  assert.equal(DATA, COMPONENT_DATA[NAME]);

  // hot reload
  DATA[0] = true;
  assert.equal(
    DATA,
    defineComponent(
      NAME,
      DATA,
      hasIsVisible,
      getIsVisible,
      setIsVisible,
      removeIsVisible,
    ),
  );
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
  assert.equal(getNextEntityId(), expectedEntities.length);
}

await test("appendComponentData", () => {
  testAppend([7, 5, 3], [], 3, [, , , 7, 5, 3], [0, 1, 2, 3, 4, 5]);
  testAppend([7, 5, 3], [], 3, [, , , 7, 5, 3], [0, 1, 2, 3, 4, 5]);
});