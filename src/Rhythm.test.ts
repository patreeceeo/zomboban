import assert from "assert";
import test, { Mock } from "node:test";
import { FrameRhythm, SteadyRhythm, FixedStepRhythm } from "./Rhythm";
import { requestAnimationFrame, setInterval, clearInterval } from "./globals";

const rafMock = requestAnimationFrame as Mock<typeof requestAnimationFrame>;
const setIntervalMock = setInterval as Mock<typeof setInterval>;
const clearIntervalMock = clearInterval as Mock<typeof clearInterval>;

test("FrameRhythm", () => {
  const callback = test.mock.fn((_dt: number, _elapsed: number) => {});
  const rhythm = new FrameRhythm(callback);

  // Before start, no RAF should be called
  const rafCallsBefore = rafMock.mock.calls.length;

  rhythm.start();

  // After start, RAF should be called
  assert.equal(rafMock.mock.calls.length, rafCallsBefore + 1);
  const handleFrame = rafMock.mock.calls[rafCallsBefore].arguments[0];

  // Simulate frame callback
  handleFrame(1);
  assert.equal(callback.mock.calls.length, 0); // First frame sets up timing, no callback yet

  handleFrame(2);
  assert.equal(callback.mock.calls.length, 1); // Now callback should be called
  // Check the arguments passed to the callback
  const [deltaTime, elapsedTime] = callback.mock.calls[0].arguments as [number, number];
  assert.equal(deltaTime, 1); // deltaTime
  assert.equal(elapsedTime, 2); // elapsedTime

  rhythm.stop();

  // After stop, callback should not be called anymore
  handleFrame(3);
  assert.equal(callback.mock.calls.length, 1); // Still only 1 call
});

test("SteadyRhythm", () => {
  const callback = test.mock.fn(() => {});
  const interval = 10;
  const rhythm = new SteadyRhythm(callback, interval);

  // Before start, no interval should be set
  const intervalCallsBefore = setIntervalMock.mock.calls.length;

  rhythm.start();

  // After start, setInterval should be called
  assert.equal(setIntervalMock.mock.calls.length, intervalCallsBefore + 1);
  assert.equal(setIntervalMock.mock.calls[intervalCallsBefore].arguments[1], interval);

  // Get the interval callback
  const intervalCallback = setIntervalMock.mock.calls[intervalCallsBefore].arguments[0];

  // Simulate interval firing
  intervalCallback();
  assert.equal(callback.mock.calls.length, 1);

  intervalCallback();
  assert.equal(callback.mock.calls.length, 2);

  const clearIntervalCallsBefore = clearIntervalMock.mock.calls.length;
  rhythm.stop();

  // After stop, clearInterval should be called
  assert.equal(clearIntervalMock.mock.calls.length, clearIntervalCallsBefore + 1);
});

test("Multiple FrameRhythm instances", () => {
  const callback1 = test.mock.fn((_dt: number, _elapsed: number) => {});
  const callback2 = test.mock.fn((_dt: number, _elapsed: number) => {});

  const rhythm1 = new FrameRhythm(callback1);
  const rhythm2 = new FrameRhythm(callback2);

  const rafCallsBefore = rafMock.mock.calls.length;

  rhythm1.start();
  rhythm2.start();

  // Each rhythm should have its own RAF loop
  assert.equal(rafMock.mock.calls.length, rafCallsBefore + 2);

  const handleFrame1 = rafMock.mock.calls[rafCallsBefore].arguments[0];
  const handleFrame2 = rafMock.mock.calls[rafCallsBefore + 1].arguments[0];

  // Simulate frames for rhythm1
  handleFrame1(1);
  handleFrame1(2);
  assert.equal(callback1.mock.calls.length, 1);
  assert.equal(callback2.mock.calls.length, 0);

  // Simulate frames for rhythm2
  handleFrame2(1);
  handleFrame2(2);
  assert.equal(callback1.mock.calls.length, 1);
  assert.equal(callback2.mock.calls.length, 1);

  rhythm1.stop();
  rhythm2.stop();
});

test("FixedStepRhythm basic functionality", () => {
  const callback = test.mock.fn((_fixedDelta: number) => {});
  const fixedDelta = 16.67;
  const rhythm = new FixedStepRhythm(callback, fixedDelta);

  // Before start, no RAF should be called
  const rafCallsBefore = rafMock.mock.calls.length;

  rhythm.start();

  // After start, RAF should be called
  assert.equal(rafMock.mock.calls.length, rafCallsBefore + 1);
  const handleFrame = rafMock.mock.calls[rafCallsBefore].arguments[0];

  // First frame sets up timing, no callback yet
  handleFrame(0);
  assert.equal(callback.mock.calls.length, 0);

  // Second frame with small delta - should not trigger callback yet
  handleFrame(10);
  assert.equal(callback.mock.calls.length, 0);

  // Frame with enough delta to trigger one fixed step
  handleFrame(10 + fixedDelta);
  assert.equal(callback.mock.calls.length, 1);
  const [receivedDelta] = callback.mock.calls[0].arguments as [number];
  assert.equal(receivedDelta, fixedDelta);

  rhythm.stop();

  // After stop, callback should not be called anymore
  handleFrame(100);
  assert.equal(callback.mock.calls.length, 1);
});

test("FixedStepRhythm accumulator behavior", () => {
  const callback = test.mock.fn((_fixedDelta: number) => {});
  const fixedDelta = 16.67;
  const rhythm = new FixedStepRhythm(callback, fixedDelta);

  const rafCallsBefore = rafMock.mock.calls.length;
  rhythm.start();
  const handleFrame = rafMock.mock.calls[rafCallsBefore].arguments[0];

  // Setup timing
  handleFrame(100);

  // Frame with exactly 2 fixed steps worth of time
  handleFrame(100 + fixedDelta * 2);

  // Should have called callback twice
  assert.equal(callback.mock.calls.length, 2);
  assert.equal(callback.mock.calls[0].arguments[0], fixedDelta);
  assert.equal(callback.mock.calls[1].arguments[0], fixedDelta);

  // Add a partial frame (not enough for another step)
  handleFrame(100 + fixedDelta * 2 + fixedDelta * 0.5);

  // Still only 2 calls
  assert.equal(callback.mock.calls.length, 2);

  // Add the remaining partial frame plus a bit more
  handleFrame(100 + fixedDelta * 2 + fixedDelta * 1.5);

  // Should trigger one more step
  assert.equal(callback.mock.calls.length, 3);

  rhythm.stop();
});

test("FixedStepRhythm maxFrameTime protection", () => {
  const callback = test.mock.fn((_fixedDelta: number) => {});
  const fixedDelta = 16.67;
  const maxFrameTime = 50;
  const rhythm = new FixedStepRhythm(callback, fixedDelta, maxFrameTime);

  const rafCallsBefore = rafMock.mock.calls.length;
  rhythm.start();
  const handleFrame = rafMock.mock.calls[rafCallsBefore].arguments[0];

  // Setup timing
  handleFrame(100);

  // Simulate a very long frame (500ms) that would normally cause many steps
  handleFrame(600);

  // Should be capped to maxFrameTime (50ms), so only ~3 steps (50 / 16.67)
  const expectedSteps = Math.floor(maxFrameTime / fixedDelta);
  assert.equal(callback.mock.calls.length, expectedSteps);

  rhythm.stop();
});

test("FixedStepRhythm constructor validation", () => {
  const callback = (_fixedDelta: number) => {};

  // Should throw for negative fixedDelta
  assert.throws(() => new FixedStepRhythm(callback, -1));

  // Should throw for zero fixedDelta
  assert.throws(() => new FixedStepRhythm(callback, 0));

  // Should throw for negative maxFrameTime
  assert.throws(() => new FixedStepRhythm(callback, 16.67, -1));

  // Should throw if maxFrameTime < fixedDelta
  assert.throws(() => new FixedStepRhythm(callback, 50, 10));

  // Should not throw for valid parameters
  assert.doesNotThrow(() => new FixedStepRhythm(callback, 16.67, 250));
});