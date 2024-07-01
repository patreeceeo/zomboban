import test, { describe } from "node:test";
import { Log, LogAdaptor, LogSubject } from "./Log";
import { getMock } from "./testHelpers";
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

      assert.deepEqual(getMock(adaptor.append).calls[0].arguments, [
        bananas,
        "so ripe"
      ]);

      apples.append("so shiny");

      assert.deepEqual(getMock(adaptor.append).calls[1].arguments, [
        apples,
        "so shiny"
      ]);

      oranges.append("so orange");

      assert.equal(getMock(adaptor.append).calls[2], undefined);
    });
  });
});
