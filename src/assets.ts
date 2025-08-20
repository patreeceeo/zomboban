import {AnimationMixer} from "three";
import {GLTFLoader, GLTF} from "./GLTFLoader";


interface IModelCacheState {
  addModel(id: string, model: GLTF): void;
  addAnimationMixer(id: string, mixer: AnimationMixer): void;
  removeAnimationMixer(id: string): void;
  listAnimationMixers(): AnimationMixer[];
  hasModel(id: string): boolean;
  getModel(id: string): GLTF | undefined;
}

export type IAssetState = IModelCacheState;

export const Loaders = {
  Model: new GLTFLoader()
}

export async function loadModel(state: IModelCacheState, id: string, url: string): Promise<void> {
  const model = await Loaders.Model.loadAsync(url);
  state.addModel(id, model);
}

