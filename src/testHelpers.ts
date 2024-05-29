import test, { Mock } from "node:test";
import { Renderer, WebGLRenderer } from "three";
import { PortableStateMixins } from "./state";
import { composeMixins } from "./Mixins";
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

export class MockFont implements Font {
  data = "";
  generateShapes(_text: string, _size: number) {
    return [new Shape()];
  }
  type = "";
}
