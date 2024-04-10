import test from "node:test";
import { GlyphMap } from "./GlyphMap";
import { MockFont } from "./testHelpers";
import { Box3, BufferGeometry } from "three";
import assert from "node:assert";

test("getting geometry for a given glyph", () => {
  const font = new MockFont();
  const map = new GlyphMap(font);
  const geometry = map.getGeometry("A");
  assert(geometry instanceof BufferGeometry);
  assert(geometry.boundingBox instanceof Box3);
});
