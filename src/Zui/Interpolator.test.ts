import assert from "node:assert";
import test, { beforeEach, describe } from "node:test";
import { IslandController } from "./Island";
import { ControllersByNodeMap } from "./collections";
import { TextNodeInterpolator } from "./Interpolator";
import { AwaitedValue } from "../Monad";
import {
  FakeNode,
  FakeElement,
  FakeText,
  installGlobalFakes,
  FakeTreeWalker
} from "./testHelpers";

installGlobalFakes();

interface Scope {
  $color: string;
}

class ColorController extends IslandController<Scope> {
  constructor(
    root: FakeNode,
    public scope: Scope
  ) {
    super(root as any);
  }
}

const controllersByElement = new ControllersByNodeMap();
function withScope(scope: Scope, root: FakeNode) {
  const controller = new ColorController(root, scope);
  controllersByElement.set(root as any, new AwaitedValue(controller));
  return root;
}

const scope1 = {
  $color: "green"
};
const scope2: Scope = {
  $color: "blue"
};
const scope3: Scope = {
  $color: "orange"
};

function getTrees() {
  return [
    withScope(scope1, new FakeText("i like $color very much")),
    withScope(
      scope2,
      new FakeElement([new FakeText("i like $color very much")])
    ),
    withScope(
      scope2,
      new FakeElement([
        new FakeText("i really like "),
        new FakeText("$color very much")
      ])
    ),
    withScope(
      scope2,
      new FakeElement([
        new FakeText("i really like $color and "),
        withScope(scope3, new FakeElement([new FakeText("$color very much")]))
      ])
    )
  ];
}

function getExpectedTrees() {
  const color1 = scope1.$color;
  const color2 = scope2.$color;
  const color3 = scope3.$color;
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
  let sut: TextNodeInterpolator;
  let trees: FakeNode[];
  beforeEach(() => {
    sut = new TextNodeInterpolator(controllersByElement);
    sut.createTreeWalker = (node: Node) => {
      return new FakeTreeWalker(node as any, Node.TEXT_NODE) as any;
    };
    trees = getTrees();
    for (const root of trees) {
      root.isConnected = true;
      if (root instanceof FakeElement) {
        controllersByElement.cascade(root as any);
      }
    }
  });

  test("it interpolates on the first pass", () => {
    const expectedTrees = getExpectedTrees();
    for (const [index, root] of trees.entries()) {
      const expectedRoot = expectedTrees[index];
      if (root instanceof FakeElement) {
        root.update();
      }
      sut.ingest(root as any);
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
      sut.ingest(root as any);
      sut.interpolate();
    }
    scope1.$color = "orange";
    scope2.$color = "pink";
    scope3.$color = "purple";
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

  test("it cleans up when nodes are removed", () => {
    for (const root of trees.values()) {
      if (root instanceof FakeElement) {
        root.update();
      }
      const originalText = root.textContent;
      sut.ingest(root as any);
      root.isConnected = false;
      sut.interpolate();
      if (root instanceof FakeElement) {
        root.update();
      }
      assert.equal(root.textContent, originalText);
    }
  });
});
