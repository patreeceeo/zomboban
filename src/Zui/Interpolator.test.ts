import assert from "node:assert";
import test, { beforeEach, describe } from "node:test";
import { IslandController } from "./Island";
import { ControllersByElementMap } from "./collections";
import { Interpolator } from "./Interpolator";
import { AwaitedValue } from "../Monad";
import {
  FakeNode,
  FakeElement,
  FakeText,
  installGlobalFakes
} from "./testHelpers";

installGlobalFakes();

interface Scope {
  $color: string;
}

class ColorController extends IslandController<Scope> {
  constructor(
    root: FakeElement,
    public scope: Scope
  ) {
    super(root as any);
  }
}

const controllersByElement = new ControllersByElementMap();
function withScope(scope: Scope, root: FakeElement) {
  const controller = new ColorController(root, scope);
  controllersByElement.set(root as any, new AwaitedValue(controller));
  return root;
}

const state = {
  $color: "green"
};
const scope1: Scope = {
  $color: "blue"
};
const scope2: Scope = {
  $color: "orange"
};

function getTrees() {
  return [
    new FakeText("i like $color very much"),
    withScope(
      scope1,
      new FakeElement([new FakeText("i like $color very much")])
    ),
    withScope(
      scope1,
      new FakeElement([
        new FakeText("i really like "),
        new FakeText("$color very much")
      ])
    ),
    withScope(
      scope1,
      new FakeElement([
        new FakeText("i really like $color and "),
        withScope(scope2, new FakeElement([new FakeText("$color very much")]))
      ])
    )
  ];
}

function getExpectedTrees() {
  const color1 = state.$color;
  const color2 = scope1.$color;
  const color3 = scope2.$color;
  return [
    new FakeText(`i like ${color1} very much`),
    new FakeElement([new FakeText(`i like ${color2} very much`)]),
    new FakeElement([
      new FakeText("i really like "),
      new FakeText(`${color2} very much`)
    ]),
    new FakeElement([
      new FakeText(`i really like ${color2} and `),
      new FakeElement([new FakeText(`${color3} very much`)])
    ])
  ];
}

describe("Zui.Interpolator", () => {
  let sut: Interpolator;
  let trees: FakeNode[];
  beforeEach(() => {
    sut = new Interpolator(controllersByElement);
    trees = getTrees();
  });

  test("it interpolates on the first pass", () => {
    const expectedTrees = getExpectedTrees();
    for (const [index, root] of trees.entries()) {
      const expectedRoot = expectedTrees[index];
      if (root instanceof FakeElement) {
        root.update();
      }
      sut.ingest(root as any, state);
      sut.interpolate();
      if (root instanceof FakeElement) {
        root.update();
      }
      if (expectedRoot instanceof FakeElement) {
        expectedRoot.update();
      }
      assert.deepEqual(root.textContent, expectedRoot.textContent);
    }
  });

  test("it interpolates updated values", () => {
    for (const root of trees.values()) {
      if (root instanceof FakeElement) {
        root.update();
      }
      sut.ingest(root as any, state);
      sut.interpolate();
    }
    state.$color = "orange";
    scope1.$color = "pink";
    scope2.$color = "purple";
    const expectedTrees = getExpectedTrees();
    for (const [index, root] of trees.entries()) {
      sut.interpolate();
      const expectedRoot = expectedTrees[index];
      if (root instanceof FakeElement) {
        root.update();
      }
      if (expectedRoot instanceof FakeElement) {
        expectedRoot.update();
      }
      assert.equal(root.textContent, expectedRoot.textContent);
    }
  });
});
