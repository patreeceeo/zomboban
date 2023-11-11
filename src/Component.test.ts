import test, { Mock } from "node:test";
import { localStorage } from "./globals";
import { savePartialComponent, loadPartialComponent } from "./Component";
import assert from "node:assert";
import { executeFilterQuery } from "./Query";
import { peekNextEntityId, registerEntity } from "./Entity";

function testSave<T>(
  key: string,
  data: ReadonlyArray<T>,
  selectedEntities: ReadonlyArray<number>,
  expectedData: ReadonlyArray<T>,
) {
  savePartialComponent(key, data, selectedEntities);
  const setItemMock = (
    localStorage.setItem as Mock<typeof Storage.prototype.setItem>
  ).mock;

  const lastCall = setItemMock.calls[setItemMock.calls.length - 1];
  assert(lastCall.arguments[0] === key);
  assert(lastCall.arguments[1] === JSON.stringify(expectedData));
}

test("savePartialComponent", () => {
  testSave("Color", [8, 6, 7, 5, 3], [2, 3, 4], [7, 5, 3]);
  testSave("Mass", [8, 6, 7, 5, 3], [0, 2, 4], [8, 7, 3]);
});

function testLoad<T>(
  key: string,
  data: T[],
  loadedData: ReadonlyArray<T>,
  nextEntityId: number,
  expectedData: ReadonlyArray<T>,
  expectedQueryResult: ReadonlyArray<number>,
) {
  const getItemMock = (
    localStorage.getItem as Mock<typeof Storage.prototype.getItem>
  ).mock;
  getItemMock.mockImplementation(() => JSON.stringify(loadedData));
  loadPartialComponent(key, data, nextEntityId);

  assert.deepEqual(data, expectedData);

  for (let i = 0; i < data.length; i++) {
    registerEntity(i);
  }
  const queryResult = executeFilterQuery((_id) => true, []);
  assert.deepEqual(queryResult, expectedQueryResult);
  assert.equal(peekNextEntityId(), expectedQueryResult.length);
}

test("loadPartialComponent", () => {
  testLoad("Color", [], [7, 5, 3], 3, [, , , 7, 5, 3], [0, 1, 2, 3, 4, 5]);
  testLoad("Mass", [], [7, 5, 3], 3, [, , , 7, 5, 3], [0, 1, 2, 3, 4, 5]);
});
