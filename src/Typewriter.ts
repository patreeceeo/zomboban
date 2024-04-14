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
    public target: Object3D = new Group()
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
  createCursor(options = defaultOptions) {
    return new Cursor(this.#map, options);
  }
}

export interface ITypewriterTargetData {
  outputHeight: number;
}

class Cursor {
  #initialY = 0;
  #initialX = 0;
  constructor(
    readonly glyphMaps: Record<string, GlyphMap>,
    readonly options: TypewriterWriteOptions,
    readonly position = new Vector2()
  ) {
    this.#initialY = position.y;
    this.#initialX = position.x;
  }
  write(text: string) {
    const { options, position } = this;
    const { target, font } = options;
    const { name: fontFamily, size, letterSpacing, lineHeight } = font;
    const initialY = this.#initialY;
    for (const char of text) {
      const glyphMap = this.glyphMaps[fontFamily];
      invariant(glyphMap !== undefined, `font family ${fontFamily} not found`);
      const scaledLineHeight = lineHeight * size;
      switch (char) {
        case " ":
          position.x += size / 2 + letterSpacing;
          break;
        case "\n":
          position.x = 0;
          position.y -= scaledLineHeight;
          break;
        default:
          const geometry = glyphMap.getGeometry(char);
          const bbox = geometry.boundingBox!;
          const mesh = new Mesh(
            geometry,
            new MeshPhongMaterial({ color: font.color })
          );
          mesh.position.x = position.x;
          mesh.position.y = position.y - scaledLineHeight;
          mesh.scale.setScalar(size);
          mesh.castShadow = true;
          mesh.rotation.y = -0.001;
          target.add(mesh);
          position.x += (bbox.max.x - bbox.min.x) * size + letterSpacing;
      }
    }
    const data = target.userData as ITypewriterTargetData;
    data.outputHeight = position.y - initialY;
    return target;
  }
  clone() {
    return new Cursor(this.glyphMaps, this.options, this.position.clone());
  }
  clear() {
    const { target } = this.options;
    target.children.length = 0;
    target.userData = {};
    this.position.set(this.#initialX, this.#initialY);
  }
}

export type ITypewriterCursor = Cursor;
