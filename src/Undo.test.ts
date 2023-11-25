import test from "node:test";
import assert from "node:assert";
import { addEntity } from "./Entity.js";
import { popUndo, pushUndo } from "./Undo.js";
import { removePosition, setPosition } from "./components/Position.js";
import { getPositionX } from "./components/PositionX.js";
import { getPositionY } from "./components/PositionY.js";
import { getVelocityX } from "./components/VelocityX.js";
import { getVelocityY } from "./components/VelocityY.js";

const enum ActionType {
  PUSH = "PUSH",
  POP = "POP",
}

interface Action<Type extends ActionType> {
  type: Type;
  data: Type extends ActionType.PUSH
    ? ([number, number] | undefined)[]
    : undefined;
}

function randomPosition() {
  return Math.floor(Math.random() * 100 - 50);
}

function pretty(data: any) {
  return JSON.stringify(data, null, 2);
}

function createRandomTestData() {
  const data: Array<Action<ActionType>> = [];
  let pushCount = 0;
  for (let actionIndex = 0; actionIndex < 1000; actionIndex++) {
    if (Math.random() < 0.5 && pushCount > 0) {
      pushCount--;
      data.push({ type: ActionType.POP, data: undefined });
    } else {
      pushCount++;
      const action = {
        type: ActionType.PUSH,
        data: [],
      } as Action<ActionType.PUSH>;
      for (let entityIndex = 0; entityIndex < 10; entityIndex++) {
        action.data.push([randomPosition(), randomPosition()]);
      }
      data.push(action);
    }
  }
  while (pushCount > 0) {
    pushCount--;
    data.push({ type: ActionType.POP, data: undefined });
  }
  return data;
}

test("Undo", () => {
  const idMap = [];
  const actionsTaken: Array<Action<ActionType.PUSH>> = [];
  const TEST_DATA = createRandomTestData();
  let popCount = 0;
  try {
    for (const action of TEST_DATA) {
      switch (action.type) {
        case ActionType.PUSH:
          const push = action as Action<ActionType.PUSH>;
          actionsTaken.push(push);
          for (const [index, entityData] of push.data.entries()) {
            let id: number;
            if (idMap[index] === undefined) {
              id = idMap[index] = addEntity();
            } else {
              id = idMap[index];
            }
            if (entityData === undefined) {
              continue;
            }
            const [x, y] = entityData;
            setPosition(id, x as Px, y as Px);
          }
          pushUndo(idMap);
          break;
        case ActionType.POP:
          const previousX = [];
          const previousY = [];
          for (const id of idMap) {
            previousX[id] = getPositionX(id);
            previousY[id] = getPositionY(id);
          }
          popUndo(idMap);
          const lastPush = actionsTaken.pop() as Action<ActionType.PUSH>;

          let assertCount = 0;
          for (const [index, entityData] of lastPush.data.entries()) {
            if (entityData === undefined) {
              continue;
            }
            const id = idMap[index];
            const [x, y] = entityData;
            assert.equal(getVelocityX(id), x - previousX[id]);
            assert.equal(getVelocityY(id), y - previousY[id]);
            assertCount++;
          }
          assert(assertCount > 0);
          popCount++;
          break;
      }
    }
  } catch (error) {
    console.log("actions taken", pretty(actionsTaken));
    console.log("id map", pretty(idMap));
    console.log("test data", pretty(TEST_DATA));
    throw error;
  }

  assert.equal(popCount, TEST_DATA.length / 2);

  assert.throws(() => {
    popUndo([]);
  });

  for (const id of idMap) {
    removePosition(id);
  }
});
