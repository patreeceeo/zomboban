import {TextureLoader, Texture, NearestFilter} from "three";

export interface TextureStateInit {
  loader?: TextureLoader;
}

export class TextureState {
  #map = new Map<string, Texture>();
  #loader: TextureLoader;

  constructor({loader = new TextureLoader()}: TextureStateInit = {}) {
    this.#loader = loader;
  }

  async load(id: string, url: string): Promise<Texture> {
    const texture = await this.#loader.loadAsync(url);
    texture.magFilter = NearestFilter;
    texture.minFilter = NearestFilter;
    this.#map.set(id, texture);
    return texture;
  }

  has(id: string): boolean {
    return this.#map.has(id);
  }

  get(id: string): Texture | undefined {
    return this.#map.get(id);
  }
}
