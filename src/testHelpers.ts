import test, { Mock } from "node:test";
import { Renderer, WebGLRenderer } from "three";
import { PortableStateMixins, TimeState } from "./state";
import { composeMixins } from "./Mixins";
import { Action } from "./systems/ActionSystem";
import { NetworkedEntityClient } from "./NetworkedEntityClient";
import { fetch, window } from "./globals";
import { Shape } from "three";
import { EffectComposer, Font } from "three/examples/jsm/Addons.js";

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

class MockEffectComposer {
  render = test.mock.fn();
}

function MockRendererStateMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    renderer = new MockRenderer() as unknown as WebGLRenderer;
    composer = new MockEffectComposer() as unknown as EffectComposer;
    shouldRerender = false;
  };
}

function MockClientMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    client = new NetworkedEntityClient(fetch.bind(window));
    lastSaveRequestTime = -Infinity;
  };
}

export const MockState = composeMixins(
  ...PortableStateMixins,
  MockRendererStateMixin,
  MockClientMixin
);

export class MockAction extends Action<any, any> {
  #time = 0;
  order = 0;
  constructor(
    readonly maxTime: number,
    startTime = 0
  ) {
    super();
    this.#time = startTime;
  }
  bind() {
    return;
  }
  stepForward = test.mock.fn((_entity, state: TimeState) => {
    this.#time += state.dt;
    if (this.#time >= this.maxTime) {
      this.progress = 1;
    }
  });
  stepBackward = test.mock.fn((_entity, state: TimeState) => {
    this.#time -= state.dt;
    if (this.#time <= 0) {
      this.progress = 0;
    }
  });
}

export class MockFont implements Font {
  data = "";
  generateShapes(_text: string, _size: number) {
    return [new Shape()];
  }
  type = "";
}
