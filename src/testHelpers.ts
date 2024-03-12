import test, { Mock } from "node:test";
import { Renderer } from "three";
import { PortableStateMixins } from "./state";
import { composeMixins } from "./Mixins";

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

function MockRendererStateMixin<TBase extends IConstructor>(Base: TBase) {
  return class extends Base {
    renderer = new MockRenderer();
  };
}

export const MockState = composeMixins(
  ...PortableStateMixins,
  MockRendererStateMixin
);
