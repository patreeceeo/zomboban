import assert from "node:assert";
import test from "node:test";
import { Loader, LoadingManager } from "three";
import { AssetLoader } from "./AssetLoader";

const _assets = {} as Record<string, object>;

class MockLoader extends Loader {
  constructor(public manager: LoadingManager) {
    super(manager);
  }
  async load(url: string, cb: (result: any) => void) {
    cb(_assets[url]);
  }
  loadAsync(url: string): Promise<object> {
    return new Promise((resolve) => {
      this.load(url, resolve);
    });
  }
}

test("loading", async () => {
  const loader = new AssetLoader({
    "test/mock": MockLoader
  });

  const id = "test/mock/foo";
  const expected = (_assets[id] = {});
  const result = await loader.load(id);
  assert.equal(result, expected);
});

test("base url", async () => {
  const loader = new AssetLoader(
    {
      mock: MockLoader
    },
    "base/"
  );

  const expected = (_assets["base/mock/foo"] = {});
  const result = await loader.load("mock/foo");
  assert.equal(result, expected);
});
