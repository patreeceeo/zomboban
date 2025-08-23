import test, { Mock } from "node:test";
import { State } from "./state";
import { NetworkedEntityClient } from "./NetworkedEntityClient";
import { fetch, window } from "./globals";
import {NullComposer, NullRenderer} from "./state/render";

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

export class MockState extends State {
  client = new NetworkedEntityClient(fetch.bind(window));
  lastSaveRequestTime = -Infinity;
  
  constructor(init?: any) {
    super(init);
    // Override render state with mocked versions
    this.render.renderer = new NullRenderer();
    this.render.composer = mockComposer(new NullComposer());
  }
}

