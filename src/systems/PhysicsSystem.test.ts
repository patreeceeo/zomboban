import test from "node:test";
import assert from "node:assert";
import { PhysicsSystem, initializePhysicsSystem } from "./PhysicsSystem";
import { addEntity } from "../Entity";
import { removePosition, setPosition } from "../components/Position";
import { Layer, removeLayer, setLayer } from "../components/Layer";
import { getVelocityX, setVelocityX } from "../components/VelocityX";
import { getPositionX } from "../components/PositionX";
import { SPRITE_SIZE } from "../components/Sprite";
import { getVelocityY, setVelocityY } from "../components/VelocityY";
import { getPositionY } from "../components/PositionY";

test("PhysicsSystem: collision detection/resolution X", () => {
  const playerId = addEntity();
  const wallId = addEntity();

  setPosition(playerId, 0 * SPRITE_SIZE, 0 * SPRITE_SIZE);
  setPosition(wallId, 2 * SPRITE_SIZE, 0 * SPRITE_SIZE);

  setLayer(playerId, Layer.OBJECT);
  setLayer(wallId, Layer.OBJECT);

  setVelocityX(playerId, SPRITE_SIZE);

  initializePhysicsSystem();
  PhysicsSystem();

  assert.strictEqual(getPositionX(playerId), SPRITE_SIZE);
  assert.strictEqual(getVelocityX(playerId), 0);

  setVelocityX(playerId, SPRITE_SIZE);
  PhysicsSystem();
  // player is prevented from moving forward
  assert.strictEqual(getPositionX(playerId), SPRITE_SIZE);
  assert.strictEqual(getVelocityX(playerId), 0);

  removePosition(playerId);
  removePosition(wallId);
  removeLayer(playerId);
  removeLayer(wallId);
});

test("PhysicsSystem: collision detection/resolution Y", () => {
  const playerId = addEntity();
  const wallId = addEntity();

  setPosition(playerId, 3 * SPRITE_SIZE, 2 * SPRITE_SIZE);
  setPosition(wallId, 3 * SPRITE_SIZE, 4 * SPRITE_SIZE);

  setLayer(playerId, Layer.OBJECT);
  setLayer(wallId, Layer.OBJECT);

  setVelocityY(playerId, SPRITE_SIZE);

  initializePhysicsSystem();
  PhysicsSystem();

  assert.strictEqual(getPositionY(playerId), SPRITE_SIZE * 3);
  assert.strictEqual(getVelocityY(playerId), 0);

  setVelocityY(playerId, SPRITE_SIZE);
  PhysicsSystem();
  // player is prevented from moving forward
  assert.strictEqual(getPositionY(playerId), SPRITE_SIZE * 3);
  assert.strictEqual(getVelocityY(playerId), 0);

  removePosition(playerId);
  removePosition(wallId);
  removeLayer(playerId);
  removeLayer(wallId);
});
