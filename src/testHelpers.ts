import test, { Mock } from "node:test";
import { Renderer, WebGLRenderer } from "three";
import { PortableStateMixins, TimeState } from "./state";
import { composeMixins } from "./Mixins";
import { Action, ActionEntity } from "./systems/ActionSystem";
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
  order = 0;
  constructor(
    entity: ActionEntity<any>,
    readonly maxTime: number,
    startTime = 0
  ) {
    super(entity);
    this.progress = startTime / maxTime;
  }
  stepForward = test.mock.fn((state: TimeState) => {
    this.progress = Math.min(1, this.progress + state.dt / this.maxTime);
  });
  stepBackward = test.mock.fn((state: TimeState) => {
    this.progress = Math.max(0, this.progress - state.dt / this.maxTime);
  });
}

export class MockFont implements Font {
  data = "";
  generateShapes(_text: string, _size: number) {
    return [new Shape()];
  }
  type = "";
}
