import test from "node:test";
import assert from "node:assert";
import { SpanSet } from "./SpanSet";

test("SpanSet: available indexes start at zero", () => {
  const spans = new SpanSet();
  assert.strictEqual(spans.nextAvailableIndex, 0);
});

test("SpanSet: use a span", () => {
  const spans = new SpanSet();
  spans.add(0);
  assert.strictEqual(spans.nextAvailableIndex, 1);
  spans.add(1);
  spans.add(3);
  assert.strictEqual(spans.nextAvailableIndex, 2);
});

test("SpanSet: release a span", () => {
  const spans = new SpanSet();
  spans.add(0);
  spans.delete(0);
  assert.strictEqual(spans.nextAvailableIndex, 0);
});

test("SpanSet: release a span that was not used", () => {
  const spans = new SpanSet();
  spans.delete(0, 5);
  assert.strictEqual(spans.nextAvailableIndex, 0);
});

test("SpanSet: use overlapping spans", () => {
  const spans = new SpanSet();
  spans.add(0, 5);
  spans.add(7, 10);
  spans.add(3, 8);
  assert.strictEqual(spans.nextAvailableIndex, 11);
  assert.strictEqual(spans.spanCount, 1);
});

test("SpanSet: includes", () => {
  const spans = new SpanSet();
  spans.add(0, 2);
  assert.strictEqual(spans.has(0), true);
  assert.strictEqual(spans.has(1), true);
  assert.strictEqual(spans.has(2), true);
  assert.strictEqual(spans.has(3), false);
});

test("SpanSet: iterate", () => {
  const spans = new SpanSet();
  spans.add(0, 2);
  spans.add(5, 7);
  spans.add(10, 12);
  const expected = [0, 1, 2, 5, 6, 7, 10, 11, 12];
  const actual = Array.from(spans.indexes());
  assert.deepStrictEqual(actual, expected);
});
