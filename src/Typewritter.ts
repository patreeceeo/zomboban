import { Group, Mesh, MeshPhongMaterial, Vector2 } from "three";
import { GlyphMap } from "./GlyphMap";
import { Font } from "three/examples/jsm/Addons.js";
import { invariant } from "./Error";

export class Typewriter {
  #map = {} as Record<string, GlyphMap>;
  addFont(name: string, font: Font) {
    this.#map[name] ??= new GlyphMap(font);
  }
  hasFont(name: string) {
    return this.#map[name] !== undefined;
  }
  write(cursor: Vector2, fontFamily: string, text: string): Group {
    const group = new Group();
    for (const char of text) {
      const glyphMap = this.#map[fontFamily];
      invariant(glyphMap !== undefined, `font family ${fontFamily} not found`);
      switch (char) {
        case " ":
          cursor.x += 10;
          break;
        case "\n":
          cursor.x = 0;
          cursor.y -= 32;
          break;
        default:
          const geometry = glyphMap.getGeometry(char);
          const bbox = geometry.boundingBox!;
          const mesh = new Mesh(geometry, new MeshPhongMaterial());
          mesh.position.x = cursor.x;
          mesh.position.y = cursor.y;
          group.add(mesh);
          cursor.x += bbox.max.x - bbox.min.x + 3;
      }
    }
    return group;
  }
}
