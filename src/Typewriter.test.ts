import assert from "assert";
import test from "node:test";
import { MockFont } from "./testHelpers";
import { Typewriter } from "./Typewritter";
import { Group, Vector2 } from "three";

test("create a group from a glyph map and a string", () => {
  const font = new MockFont();
  const typewriter = new Typewriter();
  typewriter.addFont("mock", font);
  const cursor = new Vector2();
  const group = typewriter.write(cursor, "mock", "HELLO");
  assert(group instanceof Group);
  assert(group.children.length === 5);
});
