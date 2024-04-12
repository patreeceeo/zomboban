import {
  LoadingManager,
  NearestFilter,
  Texture,
  TextureLoader as TextureLoader3
} from "three";
import { TextureCacheState } from "../state";

export function getTextureLoader(state: TextureCacheState) {
  return class TextureLoader extends TextureLoader3 {
    constructor(manager?: LoadingManager | undefined) {
      super(manager);
    }
    load(
      url: string,
      onLoad?: ((data: Texture) => void) | undefined,
      onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined,
      onError?: ((err: unknown) => void) | undefined
    ): Texture {
      const result = super.load(url, onLoad, onProgress, onError);
      result.magFilter = NearestFilter;
      result.minFilter = NearestFilter;
      state.addTexture(url, result);
      return result;
    }
  };
}
