import test, { Mock } from "node:test";
import { Renderer, WebGLRenderer } from "three";
import { PortableStateMixins } from "./state";
import { composeMixins } from "./Mixins";
import { NetworkedEntityClient } from "./NetworkedEntityClient";
import { fetch, window } from "./globals";
import { Shape } from "three";
import { EffectComposer, Font } from "three/examples/jsm/Addons.js";
import { RendererMixin } from "./state";

export function getMock<F extends (...args: any[]) => any>(fn: F) {
  return (fn as Mock<F>).mock;
}

export function getMockCallArg<F extends (...args: any[]) => any>(
  fn: F,
  call: number,
  arg: number
) {
  return getMock(fn).calls[call].arguments[arg];
}

// TODO is the rest of this file still needed?
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
  const RendererBase = RendererMixin(Base);
  return class extends RendererBase {
    readonly renderer = new MockRenderer() as unknown as WebGLRenderer;

    #composer = new MockEffectComposer() as unknown as EffectComposer;
    get composer() {
      return this.#composer;
    }
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

export class MockFont implements Font {
  data = "";
  generateShapes(_text: string, _size: number) {
    return [new Shape()];
  }
  type = "";
}
