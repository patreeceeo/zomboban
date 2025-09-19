import test, { describe } from "node:test";
import assert from "node:assert";
import { LoadingSystem, LoadingItem } from "./LoadingSystem";
import { MockState } from "../testHelpers";
import { SystemManager } from "../System";

describe("LoadingSystem", () => {
  describe("loadingProgress bounds [0, 1]", () => {
    test("loadingProgress starts at 1 when no items", () => {
      const state = new MockState();
      const mgr = new SystemManager(state);
      const system = new LoadingSystem(mgr);

      system.start(state);
      system.update(state);

      assert.equal(state.loadingProgress, 1, "Initial loadingProgress should be 1");
    });

    test("loadingProgress is 0 when items are added", () => {
      const state = new MockState();
      const mgr = new SystemManager(state);
      const system = new LoadingSystem(mgr);

      system.start(state);

      // Add loading items
      const item1 = new LoadingItem("Item 1", async () => {});
      const item2 = new LoadingItem("Item 2", async () => {});

      state.loadingItems.add(item1);
      state.loadingItems.add(item2);

      system.update(state);

      assert.equal(state.loadingProgress, 0, "loadingProgress should be 0 when items are loading");
    });

    test("loadingProgress increases monotonically as items complete", () => {
      const state = new MockState();
      const mgr = new SystemManager(state);
      const system = new LoadingSystem(mgr);

      system.start(state);

      // Add 4 loading items
      const items = Array.from({ length: 4 }, (_, i) =>
        new LoadingItem(`Item ${i}`, async () => {})
      );

      items.forEach(item => state.loadingItems.add(item));

      system.update(state);
      assert.equal(state.loadingProgress, 0, "Should start at 0 with items");

      // Remove items one by one and check progress
      let previousProgress = 0;

      state.loadingItems.remove(items[0]);
      system.update(state);
      assert.equal(state.loadingProgress, 0.25, "Should be 0.25 after 1/4 complete");
      assert(state.loadingProgress >= 0 && state.loadingProgress <= 1);
      assert(state.loadingProgress >= previousProgress, "Progress should not decrease");
      previousProgress = state.loadingProgress;

      state.loadingItems.remove(items[1]);
      system.update(state);
      assert.equal(state.loadingProgress, 0.5, "Should be 0.5 after 2/4 complete");
      assert(state.loadingProgress >= 0 && state.loadingProgress <= 1);
      assert(state.loadingProgress >= previousProgress, "Progress should not decrease");
      previousProgress = state.loadingProgress;

      state.loadingItems.remove(items[2]);
      system.update(state);
      assert.equal(state.loadingProgress, 0.75, "Should be 0.75 after 3/4 complete");
      assert(state.loadingProgress >= 0 && state.loadingProgress <= 1);
      assert(state.loadingProgress >= previousProgress, "Progress should not decrease");
      previousProgress = state.loadingProgress;

      state.loadingItems.remove(items[3]);
      system.update(state);
      assert.equal(state.loadingProgress, 1, "Should be 1 when all complete");
      assert(state.loadingProgress >= 0 && state.loadingProgress <= 1);
      assert(state.loadingProgress >= previousProgress, "Progress should not decrease");
    });

    test("loadingProgress never exceeds bounds with many items", () => {
      const state = new MockState();
      const mgr = new SystemManager(state);
      const system = new LoadingSystem(mgr);

      system.start(state);

      // Test with various numbers of items
      const testCounts = [1, 5, 10, 50, 100, 1000];

      for (const count of testCounts) {
        // Reset state
        state.loadingItems.clear();
        state.loadingMax = 0;

        // Add items
        const items = Array.from({ length: count }, (_, i) =>
          new LoadingItem(`Item ${i}`, async () => {})
        );
        items.forEach(item => state.loadingItems.add(item));

        system.update(state);
        assert(state.loadingProgress >= 0 && state.loadingProgress <= 1,
          `loadingProgress with ${count} items should be within [0, 1], got ${state.loadingProgress}`);

        // Remove half the items
        const halfCount = Math.floor(count / 2);
        for (let i = 0; i < halfCount; i++) {
          state.loadingItems.remove(items[i]);
        }

        system.update(state);
        assert(state.loadingProgress >= 0 && state.loadingProgress <= 1,
          `loadingProgress with ${count} items (half complete) should be within [0, 1], got ${state.loadingProgress}`);

        // Remove all remaining items
        state.loadingItems.clear();
        system.update(state);
        assert.equal(state.loadingProgress, 1, "Should be 1 when all items complete");
      }
    });

    test("loadingProgress handles concurrent additions and removals", () => {
      const state = new MockState();
      const mgr = new SystemManager(state);
      const system = new LoadingSystem(mgr);

      system.start(state);

      // Start with 3 items
      const initialItems = Array.from({ length: 3 }, (_, i) =>
        new LoadingItem(`Initial ${i}`, async () => {})
      );
      initialItems.forEach(item => state.loadingItems.add(item));

      system.update(state);
      assert.equal(state.loadingProgress, 0);

      // Remove one item
      state.loadingItems.remove(initialItems[0]);
      system.update(state);
      const progress1 = state.loadingProgress;
      assert(progress1 > 0 && progress1 < 1, "Progress should be between 0 and 1");
      assert(state.loadingProgress >= 0 && state.loadingProgress <= 1);

      // Add 2 more items while 2 are still loading
      const newItems = Array.from({ length: 2 }, (_, i) =>
        new LoadingItem(`New ${i}`, async () => {})
      );
      newItems.forEach(item => state.loadingItems.add(item));

      system.update(state);
      // Progress might stay the same or increase slightly since loadingMax increased
      assert(state.loadingProgress >= 0 && state.loadingProgress <= 1,
        "Progress should remain in bounds after adding items");

      // Complete all items
      state.loadingItems.clear();
      system.update(state);
      assert.equal(state.loadingProgress, 1, "Should be 1 when all items complete");
    });

    test("loadingProgress reaches exactly 1 when all items complete", () => {
      const state = new MockState();
      const mgr = new SystemManager(state);
      const system = new LoadingSystem(mgr);

      system.start(state);

      // Test with different numbers of items
      const testCounts = [1, 2, 3, 5, 7, 10];

      for (const count of testCounts) {
        // Reset state
        state.loadingItems.clear();
        state.loadingMax = 0;

        // Add items
        const items = Array.from({ length: count }, (_, i) =>
          new LoadingItem(`Item ${i}`, async () => {})
        );
        items.forEach(item => state.loadingItems.add(item));

        system.update(state);

        // Remove all items
        state.loadingItems.clear();
        system.update(state);

        assert.equal(state.loadingProgress, 1,
          `Should be exactly 1 when all ${count} items complete`);
      }
    });

    test("loadingProgress calculation is correct with floating point arithmetic", () => {
      const state = new MockState();
      const mgr = new SystemManager(state);
      const system = new LoadingSystem(mgr);

      system.start(state);

      // Test with numbers that might cause floating point issues
      const items = Array.from({ length: 3 }, (_, i) =>
        new LoadingItem(`Item ${i}`, async () => {})
      );

      items.forEach(item => state.loadingItems.add(item));
      system.update(state);

      // Remove items one by one
      state.loadingItems.remove(items[0]);
      system.update(state);
      // 1/3 ≈ 0.333...
      const oneThird = state.loadingProgress;
      assert(Math.abs(oneThird - 1/3) < 0.0001, `Progress should be approximately 1/3, got ${oneThird}`);
      assert(state.loadingProgress >= 0 && state.loadingProgress <= 1);

      state.loadingItems.remove(items[1]);
      system.update(state);
      // 2/3 ≈ 0.666...
      const twoThirds = state.loadingProgress;
      assert(Math.abs(twoThirds - 2/3) < 0.0001, `Progress should be approximately 2/3, got ${twoThirds}`);

      state.loadingItems.remove(items[2]);
      system.update(state);
      assert.equal(state.loadingProgress, 1, "Should be exactly 1 when complete");
    });
  });

  describe("loadingMax behavior", () => {
    test("loadingMax tracks the maximum number of items ever added", () => {
      const state = new MockState();
      const mgr = new SystemManager(state);
      const system = new LoadingSystem(mgr);

      system.start(state);

      assert.equal(state.loadingMax, 0, "loadingMax should start at 0");

      // Add 3 items
      const items = Array.from({ length: 3 }, (_, i) =>
        new LoadingItem(`Item ${i}`, async () => {})
      );
      items.forEach(item => state.loadingItems.add(item));

      system.update(state);
      assert.equal(state.loadingMax, 3, "loadingMax should be 3");

      // Remove 1 item
      state.loadingItems.remove(items[0]);
      system.update(state);
      assert.equal(state.loadingMax, 3, "loadingMax should remain 3");

      // Add 2 more items (total now 4)
      const newItems = Array.from({ length: 2 }, (_, i) =>
        new LoadingItem(`New ${i}`, async () => {})
      );
      newItems.forEach(item => state.loadingItems.add(item));

      system.update(state);
      assert.equal(state.loadingMax, 4, "loadingMax should increase to 4");

      // Remove all items
      state.loadingItems.clear();
      system.update(state);
      assert.equal(state.loadingMax, 4, "loadingMax should remain at maximum value");
    });
  });
});
