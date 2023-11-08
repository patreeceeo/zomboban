// TODO find a better way to mock these

import test from "node:test";

const rafMock: (typeof globalThis)["requestAnimationFrame"] = (
  _callback: (time: number) => void,
) => {
  return 0;
};
export const requestAnimationFrame =
  globalThis.requestAnimationFrame || test.mock.fn(rafMock);
const setIntervalMock: Omit<
  (typeof globalThis)["setInterval"],
  "__promisify__"
> = (_callback: () => void, _interval: number) => {
  return 0;
};
export const setInterval =
  process.env.NODE_ENV === "test"
    ? test.mock.fn(setIntervalMock as any)
    : globalThis.setInterval;
const clearIntervalMock: (typeof globalThis)["clearInterval"] = (
  _intervalId: string | number | NodeJS.Timeout | undefined,
) => {};
export const clearInterval =
  process.env.NODE_ENV === "test"
    ? test.mock.fn(clearIntervalMock)
    : globalThis.clearInterval;
