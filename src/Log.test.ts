import test, { describe } from "node:test";
import {
  Log,
  LogAdaptor,
  LogEntry,
  LogLevel,
  LogSubject,
  LogToMemoryAdaptor
} from "./Log";
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
    const log = new Log();
    log.addAdaptor(adaptor);
    log.addSubject(bananas);
    log.addSubject(apples);

    test("it calls append on its adaptors when any of its subjects are appended to", () => {
      bananas.append("so ripe");

      assert.equal(getMockCallArg(adaptor.append, 0, 0), bananas);
      assert.equal(getMockCallArg(adaptor.append, 0, 1).message, "so ripe");

      apples.append("so shiny");

      assert.equal(getMockCallArg(adaptor.append, 1, 0), apples);
      assert.equal(getMockCallArg(adaptor.append, 1, 1).message, "so shiny");

      oranges.append("so orange");

      assert.equal(getMock(adaptor.append).calls[2], undefined);
    });

    test("it adds to the `subjects` property", () => {
      assert.deepEqual(Array.from(log.subjects), [bananas, apples]);
    });
  });
});

describe("LogSubject", () => {
  describe("append", () => {
    const bananas = new LogSubject("bananas");

    test("it supports specifying a level, otherwise it assumes normal level", () => {
      const spy = test.mock.fn();
      bananas.onAppend(spy);

      bananas.append("so ripe");

      assert.equal(getMockCallArg(spy, 0, 0).level, LogLevel.Normal);

      bananas.append("squished!", LogLevel.Error);

      assert.equal(getMockCallArg(spy, 1, 0).level, LogLevel.Error);
    });

    test("it doesn't call onAppend when the subject is disabled", () => {
      const spy = test.mock.fn();
      let arg0;
      bananas.onAppend(spy);

      bananas.append("so ripe");

      arg0 = getMock(spy).calls[0].arguments[0];
      assert.equal(arg0.level, LogLevel.Normal);
    });
  });
});

describe("LogToMemoryAdaptor", () => {
  describe("filter", () => {
    test("it returns all entries that match the given filter", () => {
      const adaptor = new LogToMemoryAdaptor();
      const bfast = new LogSubject("breakfast");
      const lunch = new LogSubject("lunch");
      const dinner = new LogSubject("dinner");
      const grabbingCereal = new LogEntry(
        LogLevel.Normal,
        0,
        "grabbing cereal"
      );
      const outOfMilk = new LogEntry(LogLevel.Error, 1, "out of milk");
      const foodTrucks = new LogEntry(
        LogLevel.Info,
        2,
        "food trucks are overhyped"
      );
      const burrito = new LogEntry(LogLevel.Normal, 3, "eating a burrito");

      adaptor.append(bfast, grabbingCereal);
      adaptor.append(bfast, outOfMilk);

      adaptor.append(lunch, foodTrucks);
      adaptor.append(lunch, burrito);

      assert.deepEqual(
        adaptor.filter({ levels: [LogLevel.Normal, LogLevel.Error] }),
        [grabbingCereal, outOfMilk, burrito]
      );

      assert.deepEqual(adaptor.filter({ subjects: [bfast, dinner] }), [
        grabbingCereal,
        outOfMilk
      ]);

      assert.deepEqual(
        adaptor.filter({ subjects: [bfast, lunch], levels: [LogLevel.Normal] }),
        [grabbingCereal, burrito]
      );
    });
  });
});
