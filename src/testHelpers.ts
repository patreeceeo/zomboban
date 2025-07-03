import test, { Mock } from "node:test";
import { PortableStateMixins } from "./state";
import { composeMixins } from "./Mixins";
import { NetworkedEntityClient } from "./NetworkedEntityClient";
import { fetch, window } from "./globals";
import { Shape } from "three";
import { Font } from "three/examples/jsm/Addons.js";
import { RendererMixin } from "./state";
import {NullComposer, NullRenderer} from "./rendering";

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

function mockComposer(composer: NullComposer): NullComposer {
  composer.render = test.mock.fn(composer.render);
  composer.dispose = test.mock.fn(composer.dispose);
  return composer;
}

function MockRendererStateMixin<TBase extends IConstructor>(Base: TBase) {
  const RendererBase = RendererMixin(Base);
  return class extends RendererBase {
    readonly renderer = new NullRenderer();

    composer = mockComposer(new NullComposer());
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
