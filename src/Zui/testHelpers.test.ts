import test, { describe } from "node:test";
import { FakeElement, FakeText, installGlobalFakes } from "./testHelpers";
import assert from "node:assert";

installGlobalFakes();

describe("FakeElement", () => {
  test("textContent", () => {
    const el = new FakeElement([
      new FakeText("Green Dome "),
      new FakeElement([new FakeText("Da Puzzle")])
    ]);

    el.update();
    assert.equal(el.textContent, "Green Dome Da Puzzle");
  });
});
