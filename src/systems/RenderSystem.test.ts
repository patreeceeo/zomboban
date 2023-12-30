import test from "node:test";
import assert from "node:assert";
import { getRelativePositionY } from "./RenderSystem";
// all units in pixels unless otherwise noted

test("RenderSystem: PositionY of Sprite within the ParticleContainer", () => {
  // params: height of particle container, PositionY of sprite
  assert.equal(getRelativePositionY(100 as Px, 120 as Px), 20);
  assert.equal(getRelativePositionY(100 as Px, -120 as Px), -20);
});
