import { setUpParticleContainerArrays } from "./RenderSystem";
import test from "node:test";
import assert from "node:assert";

test("RenderSystem: set up particle container arrays", () => {
  type ParticleContainer = { tileY: number };
  type LayerContainer = Array<ParticleContainer>;
  const arrays: Array<Array<ParticleContainer>> = [];
  const setUpParticleContainer = (tileY: number): ParticleContainer => {
    const particleContainer = {
      tileY,
    };
    layerContainer.push(particleContainer);
    return particleContainer;
  };
  const layerContainer: LayerContainer = [];
  setUpParticleContainerArrays(1, 0, 2, arrays, setUpParticleContainer);
  setUpParticleContainerArrays(3, 0, 2, arrays, setUpParticleContainer);

  assert.deepStrictEqual(arrays, [
    [, { tileY: 0 }, , { tileY: 0 }],
    [, { tileY: 1 }, , { tileY: 1 }],
    [, { tileY: 2 }, , { tileY: 2 }],
  ]);

  assert.deepStrictEqual(layerContainer, [
    { tileY: 0 },
    { tileY: 1 },
    { tileY: 2 },
    { tileY: 0 },
    { tileY: 1 },
    { tileY: 2 },
  ]);
});
