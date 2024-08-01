// TODO find a better way to mock these

// import test from "node:test";
const test = (
  process.env.NODE_ENV === "test" ? await import("node:test") : null
)!;

const rafMock: (typeof globalThis)["requestAnimationFrame"] = (
  _callback: (time: number) => void
) => {
  return 0;
};
export const requestAnimationFrame =
  process.env.NODE_ENV === "test"
    ? test.mock.fn(rafMock)
    : globalThis.requestAnimationFrame;

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
  _intervalId: string | number | NodeJS.Timeout | undefined
) => {};
export const clearInterval =
  process.env.NODE_ENV === "test"
    ? test.mock.fn(clearIntervalMock)
    : globalThis.clearInterval;

export const localStorage: Storage =
  process.env.NODE_ENV === "test"
    ? {
        getItem: test.mock.fn(),
        setItem: test.mock.fn(),
        removeItem: test.mock.fn(),
        clear: test.mock.fn(),
        key: test.mock.fn(),
        length: 0
      }
    : globalThis.localStorage;

export const Image =
  process.env.NODE_ENV === "test"
    ? class {
        src = "";
        onload = () => {};
        onerror = () => {};
      }
    : globalThis.Image;

let Url: typeof import("node:url").URL;
export const location =
  process.env.NODE_ENV === "test"
    ? (Url = (await import("node:url")).URL) && {
        set href(value: string) {
          const url = new Url(value);
          this.protocol = url.protocol;
          this.host = url.host;
          this.hash = url.hash;
          this.search = url.search;
        },
        protocol: "http:",
        host: "localhost",
        hash: "",
        search: "",
        pathname: ""
      }
    : globalThis.location;

export const URLSearchParams =
  process.env.NODE_ENV === "test"
    ? (await import("node:url")).URLSearchParams
    : globalThis.URLSearchParams;

export const fetch =
  process.env.NODE_ENV === "test"
    ? test.mock.fn(() => Promise.resolve(new Response()))
    : globalThis.fetch;

export const window =
  process.env.NODE_ENV === "test"
    ? {
        requestAnimationFrame,
        setInterval,
        clearInterval,
        localStorage,
        Image,
        location,
        URLSearchParams,
        fetch
      }
    : globalThis;
