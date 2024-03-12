import test, { Mock } from "node:test";
import { Renderer, Scene, Texture } from "three";
import { IReadonlyComponentDefinition } from "./Component";
import { ObservableCollection } from "./Observable";
import { IState } from "./state";
import { Behavior } from "./systems/BehaviorSystem";
import { ActionDriver } from "./systems/ActionSystem";
import { World } from "./EntityManager";

export function getMock<F extends (...args: any[]) => any>(fn: F) {
  return (fn as Mock<F>).mock;
}

class MockRenderer implements Renderer {
  render = test.mock.fn();
  setSize(): void {
    return;
  }
  domElement: HTMLCanvasElement = null as unknown as HTMLCanvasElement;
}

type QueryMap = Map<
  IReadonlyComponentDefinition<any>,
  QueryMap | ObservableCollection<any>
>;

export class MockState extends World implements IState {
  renderer = new MockRenderer();
  scene = new Scene();
  camera = null as any;

  dt = 0;
  time = 0;

  currentRoute = "";
  onRouteChange = (cb: (route: string) => void) => {
    void cb;
    return {
      unsubscribe: () => {
        return;
      }
    };
  };

  #textures = {} as Record<string, Texture>;
  getTexture = (id: string) => this.#textures[id];
  hasTexture = (id: string) => id in this.#textures;
  addTexture = (id: string, texture: Texture) => {
    this.#textures[id] = texture;
  };

  #behaviors = {} as Record<string, Behavior<any, this>>;
  getBehavior = (id: string) => {
    return this.#behaviors[id];
  };
  hasBehavior = (id: string) => id in this.#behaviors;
  addBehavior = (id: string, behavior: Behavior<any, this>) => {
    this.#behaviors[id] = behavior;
  };

  actions = [] as ActionDriver<any, this>[][];

  #queryMap = new Map() as QueryMap;
  addQueryResult(components: IReadonlyComponentDefinition<any>[], entity: any) {
    const collection = this.query(components);
    collection.add(entity);
  }
  removeQueryResult(
    components: IReadonlyComponentDefinition<any>[],
    entity: any
  ) {
    const collection = this.query(components);
    collection.remove(entity);
  }
  // TODO use this code to optimize the real implementation
  query(components: IReadonlyComponentDefinition<any>[]) {
    let mapOrCollection = this.#queryMap as
      | QueryMap
      | ObservableCollection<any>;
    for (const component of components) {
      const map = mapOrCollection as QueryMap;
      if (!mapOrCollection.has(component)) {
        if (component === components.at(-1)) {
          map.set(component, new ObservableCollection());
        } else {
          map.set(component, new Map());
        }
      }
      mapOrCollection = map.get(component)!;
    }
    return mapOrCollection as any;
  }
}
