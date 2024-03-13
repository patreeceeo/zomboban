import test, { Mock } from "node:test";
import { Renderer } from "three";
import { PortableStateMixins, TimeState } from "./state";
import { composeMixins } from "./Mixins";
import { Action } from "./systems/ActionSystem";
import { EntityWithComponents } from "./Component";
import { BehaviorComponent } from "./components";

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

export class MockAction extends Action<any, any> {
  #time = 0;
  constructor(readonly maxTime: number) {
    super();
  }
  bind() {
    return;
  }
  stepForward = test.mock.fn(
    (
      _entity: EntityWithComponents<typeof BehaviorComponent>,
      state: TimeState
    ) => {
      this.#time += state.dt;
      if (this.#time >= this.maxTime) {
        this.isComplete = true;
      }
    }
  );
  stepBackward() {
    return;
  }
}
