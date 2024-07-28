import assert from "assert";
import test, { describe } from "node:test";
import { FakeElement } from "../testHelpers";
import { updateClassList } from "./ClassListDirective";

describe("updateClassList", () => {
  test("it adds keys associated with a truthy value", () => {
    const el = new FakeElement();
    updateClassList(el as any, { "is-pressed": true });

    assert(el.classList.has("is-pressed"));
  });
  test("it removes keys associated with a falsy value", () => {
    const el = new FakeElement();
    updateClassList(el as any, { "is-pressed": true });
    updateClassList(el as any, { "is-pressed": false });

    assert(!el.classList.has("is-pressed"));
  });
});
