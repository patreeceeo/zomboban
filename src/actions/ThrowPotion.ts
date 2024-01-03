import { Action } from "../systems/ActionSystem";
import { addEntity } from "../Entity";
import { setPosition } from "../components/Position";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { setVelocity } from "../components/Velocity";
import { EntityName, getNamedEntity } from "../Entity";
import { ActLike, setActLike } from "../components/ActLike";
import { Layer, setLayer } from "../components/Layer";
import { setLookLike } from "../components/LookLike";
import { setPixiAppId } from "../components/PixiAppId";
import { convertTxpsToPps, convertTypsToPps } from "../units/convert";
import { setToBeRemoved } from "../components/ToBeRemoved";
import { invariant } from "../Error";
import { placeObjectInTile } from "../Tile";

export function throwPotion(
  potionId: number,
  positionX: Px,
  positionY: Px,
  velocityX: Pps,
  velocityY: Pps,
) {
  setPixiAppId(potionId, getNamedEntity(EntityName.DEFAULT_PIXI_APP));
  setLayer(potionId, Layer.OBJECT);
  setActLike(potionId, ActLike.AIRPLANE);
  setLookLike(potionId, getNamedEntity(EntityName.POTION_SPIN_ANIMATION));
  setVelocity(potionId, velocityX, velocityY);
  setPosition(
    potionId,
    (positionX + velocityX) as Px,
    (positionY + velocityY) as Px,
  );
  placeObjectInTile(potionId);
}

export class ThrowPotionAction implements Action {
  potionId: number | undefined;
  isComplete = false;

  constructor(
    readonly throwerId: number,
    readonly velocityX: Txps,
    readonly velocityY: Typs,
  ) {}

  progress(): void {
    this.complete();
  }

  complete() {
    const potionId = addEntity();
    throwPotion(
      potionId,
      getPositionX(this.throwerId),
      getPositionY(this.throwerId),
      convertTxpsToPps(this.velocityX),
      convertTypsToPps(this.velocityY),
    );
    this.potionId = potionId;
    this.isComplete = true;
  }

  undo() {
    invariant(this.potionId !== undefined, "Potion ID not set");
    setToBeRemoved(this.potionId!, true);
  }
}
