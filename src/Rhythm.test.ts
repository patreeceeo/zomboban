import assert from "assert";
import test, { Mock } from "node:test";
import {
  addFrameRhythmCallback,
  addSteadyRhythmCallback,
  removeRhythmCallback,
  startFrameRhythms
} from "./Rhythm";
import { requestAnimationFrame, setInterval, clearInterval } from "./globals";

const rafMock = requestAnimationFrame as Mock<typeof requestAnimationFrame>;
const setIntervalMock = setInterval as Mock<typeof setInterval>;
const clearIntervalMock = clearInterval as Mock<typeof clearInterval>;

startFrameRhythms();

test("addFrameRhythmCallback", () => {
  const callback = test.mock.fn(() => {});
  const id = addFrameRhythmCallback(callback);

  const handleFrame = rafMock.mock.calls[0].arguments[0];
  handleFrame(1);
  assert.equal(callback.mock.calls.length, 1);

  removeRhythmCallback(id);
  handleFrame(2);
  assert.equal(callback.mock.calls.length, 1);
});

test("addSteadyRhythmCallback", () => {
  const callback = test.mock.fn(() => {});
  const interval = 10;
  const id = addSteadyRhythmCallback(interval, callback);

  assert(setIntervalMock.mock.calls.length === 1);
  const callback2 = setIntervalMock.mock.calls[0].arguments[0];
  callback2();
  assert(callback.mock.calls.length === 1);

  removeRhythmCallback(id);
  assert(clearIntervalMock.mock.calls.length === 1);
});
