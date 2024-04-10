import { Group, Mesh, MeshPhongMaterial } from "three";
import { GlyphMap } from "./GlyphMap";
import { Font } from "three/examples/jsm/Addons.js";
import { invariant } from "./Error";

export class Typewriter {
  #map = {} as Record<string, GlyphMap>;
  addFont(name: string, font: Font) {
    this.#map[name] ??= new GlyphMap(font);
  }
  write(fontFamily: string, text: string): Group {
    const group = new Group();
    let x = 0;
    for (const char of text) {
      const glyphMap = this.#map[fontFamily];
      invariant(glyphMap !== undefined, `font family ${fontFamily} not found`);
      const geometry = glyphMap.getGeometry(char);
      const bbox = geometry.boundingBox!;
      const mesh = new Mesh(geometry, new MeshPhongMaterial());
      mesh.position.x = x;
      group.add(mesh);
      x += bbox.max.x - bbox.min.x + 2;
    }
    return group;
  }
}
