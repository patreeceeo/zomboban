import {GLTFLoader, GLTF} from "../GLTFLoader";

export interface ModelStateInit {
  loader?: GLTFLoader;
}

export class ModelState {
  #map = new Map<string, GLTF>();
  #loader: GLTFLoader;

  constructor({loader = new GLTFLoader()}: ModelStateInit = {}) {
    this.#loader = loader;
  }

  async load(id: string, url: string): Promise<GLTF> {
    const model = await this.#loader.loadAsync(url);
    this.#map.set(id, model);
    return model;
  }

  has(id: string): boolean {
    return this.#map.has(id);
  }

  get(id: string): GLTF | undefined {
    return this.#map.get(id);
  }
}
