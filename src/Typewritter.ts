import { Group, Mesh, MeshPhongMaterial, Object3D, Vector2 } from "three";
import { GlyphMap } from "./GlyphMap";
import { Font } from "three/examples/jsm/Addons.js";
import { invariant } from "./Error";

// TODO consider using a library like
// - troika-three-text

export class FontOptions {
  constructor(
    public name: string,
    public size: number,
    public letterSpacing: number,
    public lineHeight: number,
    public color: number
  ) {}
}

const defaultFont = new FontOptions("default", 12, 3, 1.5, 0xffffff);

export class TypewriterWriteOptions {
  constructor(
    public font = defaultFont,
    public target: Object3D = new Group(),
    public cursor = new Vector2()
  ) {}
}

const defaultOptions = new TypewriterWriteOptions();

export class Typewriter {
  #map = {} as Record<string, GlyphMap>;
  addFont(name: string, font: Font) {
    this.#map[name] ??= new GlyphMap(font);
  }
  hasFont(name: string) {
    return this.#map[name] !== undefined;
  }
  write(text: string, options = defaultOptions): Object3D {
    const { cursor, target } = options;
    const {
      name: fontFamily,
      color,
      size,
      letterSpacing,
      lineHeight
    } = options.font;
    for (const char of text) {
      const glyphMap = this.#map[fontFamily];
      invariant(glyphMap !== undefined, `font family ${fontFamily} not found`);
      switch (char) {
        case " ":
          cursor.x += size + letterSpacing;
          break;
        case "\n":
          cursor.x = 0;
          cursor.y -= lineHeight * size;
          break;
        default:
          const geometry = glyphMap.getGeometry(char);
          const bbox = geometry.boundingBox!;
          const mesh = new Mesh(geometry, new MeshPhongMaterial({ color }));
          mesh.position.x = cursor.x;
          mesh.position.y = cursor.y;
          mesh.scale.setScalar(size);
          target.add(mesh);
          cursor.x += (bbox.max.x - bbox.min.x) * size + letterSpacing;
      }
    }
    return target;
  }
}
