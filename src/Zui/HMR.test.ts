import assert from "node:assert";
import test, { describe } from "node:test";
import { IslandController } from "./Island";
import { withHMR } from "./HMR";
import { getMock, getMockCallArg } from "../testHelpers";
import { FakeElement, installGlobalFakes } from "./testHelpers";

installGlobalFakes();

describe("Island Controller HMR", () => {
  test("when accept is called, it replaces instances of the old class with instances of the new", () => {
    const { accept, Clazz } = withHMR(IslandController);

    const el1 = new FakeElement();
    const el2 = new FakeElement();

    const instance1 = new Clazz(el1);
    const instance2 = new Clazz(el2);

    const constructorSpy = test.mock.fn();
    class IslandController2 extends IslandController {
      isNew = true;
      constructor(el: HTMLElement) {
        super(el);
        constructorSpy(el);
      }
    }

    instance1.unmount = test.mock.fn();
    instance2.unmount = test.mock.fn();

    accept({ default: IslandController2 } as any);

    assert.equal(getMock(instance1.unmount).callCount(), 1);
    assert.equal(getMock(instance2.unmount).callCount(), 1);
    assert.equal(getMockCallArg(constructorSpy, 0, 0), el1);
    assert.equal(getMockCallArg(constructorSpy, 1, 0), el2);
  });
});
