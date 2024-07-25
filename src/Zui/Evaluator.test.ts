import assert from "node:assert";
import test, { beforeEach, describe } from "node:test";
import { Evaluator } from "./Evaluator";

describe("Evaluator", () => {
  const scope = {
    color: "chartreuse"
  };
  let evr: Evaluator;
  beforeEach(() => {
    evr = new Evaluator();
  });

  test("evaluate scope value", () => {
    assert.equal(evr.evaluate(scope, "color"), "chartreuse");
    assert.throws(() => evr.evaluate(scope, "shape"));
  });

  test("evaluate string", () => {
    assert.equal(evr.evaluate(scope, "`color`"), "color");
  });

  test("evaluate number", () => {
    assert.equal(evr.evaluate(scope, "86"), 86);
  });

  test("evaluate boolean", () => {
    // For boolean attributes
    assert.equal(evr.evaluate(scope, ""), true);
    assert.equal(evr.evaluate(scope, "true"), true);
    assert.equal(evr.evaluate(scope, "false"), false);
    assert.equal(evr.evaluate(scope, "on"), true);
    assert.equal(evr.evaluate(scope, "off"), false);
    assert.equal(evr.evaluate(scope, "yes"), true);
    assert.equal(evr.evaluate(scope, "no"), false);
  });
});
