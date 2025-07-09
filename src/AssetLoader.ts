import { Loader, LoadingManager } from "three";
import { joinPath } from "./util";
import { invariant } from "./Error";
import { Observable } from "./Observable";

interface ILoaderConstructorMap {
  // TODO key should be a glob pattern?
  [key: string]: new (manager: LoadingManager) => Loader;
}

type ILoaderMap<ConstructorMap extends ILoaderConstructorMap> = {
  [key in keyof ConstructorMap]: Loader;
};

interface IAssetLoadEvent {
  id: string;
  asset: any;
}

export class AssetLoader<T extends ILoaderConstructorMap> {
  #manager = new LoadingManager();
  #loadObserver = new Observable<IAssetLoadEvent>();
  loaderMap = {} as ILoaderMap<T>;
  constructor(
    readonly loaderConstructorMap: T,
    readonly baseUrl = ""
  ) {
    for (const [key, LoaderClass] of Object.entries(loaderConstructorMap)) {
      this.loaderMap[key as keyof T] = new LoaderClass(this.#manager);
    }
  }
  getLoaderId(id: string): keyof T {
    const segments = id.split("/");
    segments.pop();
    return segments.join("/");
  }
  async load(id: string) {
    const loaderId = this.getLoaderId(id);
    const loader = this.loaderMap[loaderId] as InstanceType<T[keyof T]>;
    invariant(loader !== undefined, `Loader not found for ${String(loaderId)}`);
    const url = joinPath(this.baseUrl, id);
    const asset = await loader.loadAsync(url);
    this.#loadObserver.next({ id, asset });
    return asset;
  }
  onLoad(cb: (event: IAssetLoadEvent) => void) {
    return this.#loadObserver.subscribe(cb);
  }
}
