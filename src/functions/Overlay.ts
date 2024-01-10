import { EntityName, getNamedEntity } from "../Entity";
import { executeFilterQuery } from "../Query";
import { ActLike, getActLike, isActLike } from "../components/ActLike";
import { setIsVisible } from "../components/IsVisible";
import { setPixiAppId } from "../components/PixiAppId";
import { setPositionY } from "../components/PositionY";
import { setText } from "../components/Text";
import { applyFadeEffect, removeFadeEffect } from "../systems/RenderSystem";
import { SCREENY_PX } from "../units/convert";

// TODO refactor this file

const touchMessages: Partial<Record<ActLike, string>> = {
  [ActLike.BRO]: "“Resistance is futile”, bro!",
  [ActLike.BOX]:
    "You've been trapped inside a box.\nSurely this is an OSHA violation...",
};

const entityIds: number[] = [];
function listFadeEntities(
  touchingZombieIds: readonly number[],
): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(
    (entityId) =>
      !isActLike(entityId, ActLike.PLAYER) &&
      !touchingZombieIds.includes(entityId),
    entityIds,
  );
}

function getTouchMessage(actLike: ActLike): string {
  return `${
    touchMessages[actLike] ?? "Something bad happened."
  }\n Press Z to rewind`;
}

export function showCoincidingTileMessage(
  touchingZombieIds: readonly number[],
) {
  const touchingZombieTextId = getNamedEntity(EntityName.TOUCHING_ZOMBIE_TEXT);

  const defaultPixiAppId = getNamedEntity(EntityName.DEFAULT_PIXI_APP);
  setPixiAppId(touchingZombieTextId, defaultPixiAppId);
  setText(
    touchingZombieTextId,
    getTouchMessage(getActLike(touchingZombieIds[0]).type),
  );
  setIsVisible(touchingZombieTextId, false);
  setPositionY(touchingZombieTextId, (SCREENY_PX / 4) as Px);

  // fade everything but the player and the zombie to dark red when the player is touching a zombie
  // TODO: this is a hack, should have a better way to do this
  applyFadeEffect(listFadeEntities(touchingZombieIds));
  setIsVisible(getNamedEntity(EntityName.TOUCHING_ZOMBIE_TEXT), true);
}

export function hideCoincidingTileMessage() {
  // TODO: this is a hack, should have a better way to do this
  removeFadeEffect(listFadeEntities([]));
  setIsVisible(getNamedEntity(EntityName.TOUCHING_ZOMBIE_TEXT), false);
}
