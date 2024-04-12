import { GLTF, GLTFLoader as GLTFLoader3 } from "three/examples/jsm/Addons.js";
import { ModelCacheState } from "../state";
import { LoadingManager } from "three";

export function getGLTFLoader(state: ModelCacheState) {
  return class GLTFLoader extends GLTFLoader3 {
    constructor(manager?: LoadingManager | undefined) {
      super(manager);
    }

    load(
      url: string,
      onLoad: (data: GLTF) => void,
      onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined,
      onError?: ((err: unknown) => void) | undefined
    ) {
      super.load(
        url,
        (result) => {
          state.addModel(url, result.scene);
          onLoad(result);
        },
        onProgress,
        onError
      );
    }
  };
}
