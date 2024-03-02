import assert from "node:assert";
import test from "node:test";
import { Observable } from "./Observable";

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
  subscription.unsubscribe();
  obs.next(142);

  assert.equal(spy.mock.callCount(), 0);
});
