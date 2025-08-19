import {AnimationMixer, NearestFilter, Texture} from "three";
import {TextureLoader} from "three";
import {GLTFLoader, GLTF} from "./GLTFLoader";

interface ITextureCacheState {
  addTexture(id: string, texture: Texture): void;
  hasTexture(id: string): boolean;
  getTexture(id: string): Texture | undefined;
}

interface IModelCacheState {
  addModel(id: string, model: GLTF): void;
  addAnimationMixer(id: string, mixer: AnimationMixer): void;
  removeAnimationMixer(id: string): void;
  listAnimationMixers(): AnimationMixer[];
  hasModel(id: string): boolean;
  getModel(id: string): GLTF | undefined;
}

export type IAssetState = ITextureCacheState & IModelCacheState;

export const Loaders = {
  Texture: new TextureLoader(),
  Model: new GLTFLoader()
}

export async function loadTexture(state: ITextureCacheState, id: string, url: string): Promise<void> {
  const texture = await Loaders.Texture.loadAsync(url);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  state.addTexture(id, texture);
}

export async function loadModel(state: IModelCacheState, id: string, url: string): Promise<void> {
  const model = await Loaders.Model.loadAsync(url);
  state.addModel(id, model);
}

