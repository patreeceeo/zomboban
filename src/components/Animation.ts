import {
  BaseTexture,
  FrameObject,
  Spritesheet as PixiSpritesheet,
  Texture,
} from "pixi.js";

interface SpriteSheetJson {
  frames: Record<string, SpriteSheetFrame>;
  meta: {
    image: string;
    size: {
      w: number;
      h: number;
    };
    scale: string;
  };
  animations: Record<string, string[]>;
}

interface SpriteSheetFrame {
  duration: number;
  frame: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  rotated: boolean;
  trimmed: boolean;
}

export interface AnimationSource {
  from: string;
  key: string;
}

export class Animation {
  #frames: FrameObject[] = [];

  onload = (_event: Event) => {};
  onerror = (_event: Event) => {};

  constructor(public src: AnimationSource) {}

  get frames() {
    return this.#frames;
  }

  async load() {
    const res = await fetch(this.src.from);
    const data = (await res.json()) as SpriteSheetJson;
    const sheet = new PixiSpritesheet(BaseTexture.from(data.meta.image), data);
    await sheet.parse();
    const texturesMap = sheet.animations as Record<string, Texture[]>;
    for (const [index, texture] of texturesMap[this.src.key].entries()) {
      this.#frames.push({
        texture,
        time: data.frames[data.animations[this.src.key][index]].duration,
      });
    }
  }
}
