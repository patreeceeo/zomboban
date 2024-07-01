import test, { describe } from "node:test";
import { Log, LogAdaptor, LogLevel, LogSubject } from "./Log";
import { getMock, getMockCallArg } from "./testHelpers";
import assert from "node:assert";

describe("Log", () => {
  describe("addSubject", () => {
    class SpyAdaptor extends LogAdaptor {
      append = test.mock.fn();
    }
    const adaptor = new SpyAdaptor();
    const bananas = new LogSubject("bananas");
    const apples = new LogSubject("apples");
    const oranges = new LogSubject("oranges");
    const log = new Log(adaptor);
    log.addSubject(bananas);
    log.addSubject(apples);

    test("it calls append on its adaptor when any of its subjects are appended to", () => {
      bananas.append("so ripe");

      assert.equal(getMockCallArg(adaptor.append, 0, 0), bananas);
      assert.equal(getMockCallArg(adaptor.append, 0, 1).message, "so ripe");

      apples.append("so shiny");

      assert.equal(getMockCallArg(adaptor.append, 1, 0), apples);
      assert.equal(getMockCallArg(adaptor.append, 1, 1).message, "so shiny");

      oranges.append("so orange");

      assert.equal(getMock(adaptor.append).calls[2], undefined);
    });
  });
});

describe("LogSubject", () => {
  describe("append", () => {
    const bananas = new LogSubject("bananas");

    test("it supports specifying a level, otherwise it assumes normal level", () => {
      const spy = test.mock.fn();
      let arg0;
      bananas.onAppend(spy);

      bananas.append("so ripe");

      arg0 = getMock(spy).calls[0].arguments[0];
      assert.equal(arg0.level, LogLevel.Normal);

      bananas.append("squished!", LogLevel.Error);

      arg0 = getMock(spy).calls[1].arguments[0];
      assert.deepEqual(arg0.level, LogLevel.Error);
    });
  });
});
