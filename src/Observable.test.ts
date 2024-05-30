import assert from "node:assert";
import test from "node:test";
import { Observable, ObservableArray } from "./Observable";

test("subscribing to an observable", () => {
  const spy = test.mock.fn();
  const obs = new Observable<number>();
  obs.subscribe(spy);
  obs.next(142);

  assert.equal(spy.mock.callCount(), 1);
  assert.equal(spy.mock.calls[0].arguments[0], 142);
});

test("unsubscribing from an observable", () => {
  const spy = test.mock.fn();
  const obs = new Observable<number>();
  const subscription = obs.subscribe(spy);
  subscription.release();
  obs.next(142);

  assert.equal(spy.mock.callCount(), 0);
});

test("filtering array in place", () => {
  const array = new ObservableArray([1, 2, 3, 4, 5]);
  const length = array.length;
  const predicate = test.mock.fn((value) => value % 2 === 0);
  array.filterInPlace(predicate);
  assert.deepEqual(array.toJSON(), [2, 4]);
  assert.equal(predicate.mock.callCount(), length);
});
