import { BufferGeometry } from "three";
import { Font, TextGeometry } from "three/examples/jsm/Addons.js";
export class GlyphMap {
  #map = {} as Record<string, BufferGeometry>;
  #glyphs = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z"
  ];
  constructor(font: Font) {
    for (const glyph of this.#glyphs) {
      const geometry = new TextGeometry(glyph, {
        font: font,
        size: 18,
        depth: 5,
        curveSegments: 12
      });
      geometry.computeBoundingBox();
      this.#map[glyph] = geometry;
    }
  }

  getGeometry(glyph: string) {
    return this.#map[glyph];
  }
}