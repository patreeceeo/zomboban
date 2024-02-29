import assert from "node:assert";
import test from "node:test";
import { WithGetterSetter } from "./Mixins";

test("adding a getter/setter to an existing class", () => {
  class BoringShed {
    constructor(public name: string) {}
  }
  const PaintedShed = WithGetterSetter(
    "color",
    (c: any) => c.__color,
    (c: any, v: any) => (c.__color = v),
    BoringShed
  );

  const shed = new PaintedShed("shed");
  shed.color = "red";
  assert.equal(shed.color, "red");
});

test("creating a class with a getter/setter", () => {
  const Shed = WithGetterSetter(
    "color",
    (c: any) => c.__color,
    (c: any, v: any) => (c.__color = v)
  );

  const shed = new Shed();
  shed.color = "red";
  assert.equal(shed.color, "red");
});
