import test, { describe } from "node:test";
import {
  FakeElement,
  FakeText,
  FakeTreeWalker,
  installGlobalFakes
} from "./testHelpers";
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

describe("FakeTreeWalker", () => {
  test("nextNode", () => {
    const text1 = new FakeText("Green Dome ");
    const text2 = new FakeText("Da Puzzle");
    const el = new FakeElement([text1, new FakeElement([text2])]);
    const walker = new FakeTreeWalker(el, Node.TEXT_NODE);

    assert.equal(walker.nextNode(), text1);
    assert.equal(walker.nextNode(), text2);
    assert.equal(walker.nextNode(), null);
  });
});
