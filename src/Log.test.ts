import test, { beforeEach, describe } from "node:test";
import {
  LOG_NO_SUBJECT,
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
  class SpyAdaptor extends LogAdaptor {
    append = test.mock.fn();
  }
  let log: Log;
  let adaptor: LogAdaptor;
  beforeEach(() => {
    log = new Log();
    adaptor = new SpyAdaptor();
    log.addAdaptor(adaptor);
  });

  describe("addSubject", () => {
    const bananasData = {};
    const bananas = new LogSubject("bananas", bananasData);
    const banananas = new LogSubject("banananas", bananasData);
    const apples = new LogSubject("apples");
    const oranges = new LogSubject("oranges");
    beforeEach(() => {
      log.addSubject(bananas);
      log.addSubject(banananas);
      log.addSubject(apples);
    });

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
      // One of the subjects was a duplicate so it should have the latest of the two
      assert.deepEqual(Array.from(log.subjects), [banananas, apples]);
    });
  });

  describe("getSubject", () => {
    const bananasData = {};
    const bananas = new LogSubject("bananas", bananasData);
    beforeEach(() => {
      log.addSubject(bananas);
    });

    test("it returns the existing subject, if found", () => {
      assert.deepEqual(log.getSubject(bananasData), bananas);
    });

    test("else, it returns the id if it's a subject itself", () => {
      const newSubject = new LogSubject("foo");
      assert.deepEqual(log.getSubject(newSubject), newSubject);
    });

    test("else, it returns a new subject with the given id", () => {
      assert.equal(log.getSubject(13).identity(), 13);
    });
  });

  describe("append", () => {
    test("it appends an entry with no subject", () => {
      log.append("foo");
      assert.deepEqual(getMockCallArg(adaptor.append, 0, 0), LOG_NO_SUBJECT);
      assert.equal(getMockCallArg(adaptor.append, 0, 1).message, "foo");
    });

    test("it creates an entry for a subject identity and also creates the subject", () => {
      log.append("foo", 13);
      assert.equal(getMockCallArg(adaptor.append, 0, 0).identity(), 13);
      assert.equal(getMockCallArg(adaptor.append, 0, 1).message, "foo");
    });
  });

  describe("addAdaptor", () => {
    test("it updates the `adaptors` property", () => {
      assert.deepEqual(Array.from(log.adaptors), [adaptor]);
    });
  });

  describe("getAdaptor", () => {
    test("allows getting an adaptor by its class", () => {
      assert.deepEqual(Array.from(log.getAdaptors(SpyAdaptor)), [adaptor]);
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

  describe("equals", () => {
    test("true iff data are equal and not undefined", () => {
      const data1 = "foo data";
      const data2 = {};
      const foo = new LogSubject("foo", data1);
      const foo2 = new LogSubject("foo", data1);
      const foo3 = new LogSubject("foo", data2);
      const bar = new LogSubject("bar");
      const bar2 = new LogSubject("bar");

      // name and data are the same
      assert(foo.equals(foo2));

      // data are different
      assert(!foo.equals(foo3));

      // data are undefined
      assert(!bar.equals(bar2));
    });
  });
});

describe("LogToMemoryAdaptor", () => {
  let adaptor: LogToMemoryAdaptor;
  let bfast: LogSubject,
    bfast2: LogSubject,
    lunch: LogSubject,
    dinner: LogSubject;
  let grabbingCereal: LogEntry,
    outOfMilk: LogEntry,
    foodTrucks: LogEntry,
    burrito: LogEntry;
  const bfastData = {};

  beforeEach(() => {
    adaptor = new LogToMemoryAdaptor();
    bfast = new LogSubject("breakfast", bfastData);
    bfast2 = new LogSubject("more breakfast", bfastData);
    lunch = new LogSubject("lunch");
    dinner = new LogSubject("dinner");
    grabbingCereal = new LogEntry(LogLevel.Normal, 0, "grabbing cereal");
    outOfMilk = new LogEntry(LogLevel.Error, 1, "out of milk");
    foodTrucks = new LogEntry(LogLevel.Info, 2, "food trucks are overhyped");
    burrito = new LogEntry(LogLevel.Normal, 3, "eating a burrito");

    adaptor.append(bfast, grabbingCereal);
    adaptor.append(bfast2, outOfMilk);

    adaptor.append(lunch, foodTrucks);
    adaptor.append(lunch, burrito);
  });

  describe("append", () => {
    test("it updates the subject's indexes", () => {
      let indexes: Set<number> | undefined;

      indexes = adaptor.getSubjectIndexes(bfast);

      assert.deepEqual(indexes, new Set([0, 1]));

      indexes = adaptor.getSubjectIndexes(lunch);

      assert.deepEqual(indexes, new Set([2, 3]));

      indexes = adaptor.getSubjectIndexes(dinner);

      assert.deepEqual(indexes, undefined);
    });

    test("it updates the level's indexes", () => {
      let indexes: Set<number> | undefined;

      indexes = adaptor.getLevelIndexes(LogLevel.Error);

      assert.deepEqual(indexes, new Set([1]));

      indexes = adaptor.getLevelIndexes(LogLevel.Warning);

      assert.deepEqual(indexes, undefined);

      indexes = adaptor.getLevelIndexes(LogLevel.Normal);

      assert.deepEqual(indexes, new Set([0, 3]));

      indexes = adaptor.getLevelIndexes(LogLevel.Info);

      assert.deepEqual(indexes, new Set([2]));
    });

    test("it respects maxEntries", () => {
      class SmallMemAdaptor extends LogToMemoryAdaptor {
        maxEntries = 5;
      }

      function mkEntry(msg: string) {
        return new LogEntry(LogLevel.Normal, 0, msg);
      }

      const adaptor = new SmallMemAdaptor();

      const subject = new LogSubject("test");
      adaptor.append(subject, mkEntry("1"));
      adaptor.append(subject, mkEntry("2"));
      adaptor.append(subject, mkEntry("3"));
      adaptor.append(subject, mkEntry("4"));
      adaptor.append(subject, mkEntry("5"));
      adaptor.append(subject, mkEntry("6"));

      assert.deepEqual(
        adaptor.filter({}).map((e) => e.message),
        ["2", "3", "4", "5", "6"]
      );
    });
  });

  describe("filter", () => {
    test("it returns all entries that match the given filter", () => {
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
