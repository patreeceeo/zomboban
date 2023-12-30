import { placeObjectInTile, removeObjectFromTile } from "../Tile";
import { ActLike, setActLike } from "../components/ActLike";
import { setIsVisible } from "../components/IsVisible";
import { getPositionX } from "../components/PositionX";
import { getPositionY } from "../components/PositionY";
import { getVelocityX } from "../components/VelocityX";
import { getVelocityY } from "../components/VelocityY";
import { Action } from "../systems/ActionSystem";
import { throwPotion } from "./ThrowPotion";

export class SmashPotion implements Action {
  #positionX: Px;
  #positionY: Px;
  #velocityX: Pps;
  #velocityY: Pps;
  isComplete = true;
  constructor(readonly potionId: number) {
    this.#positionX = getPositionX(potionId);
    this.#positionY = getPositionY(potionId);
    this.#velocityX = getVelocityX(potionId);
    this.#velocityY = getVelocityY(potionId);
  }

  progress() {
    // make the potion invisible and innert without removing the entity
    // this is so that the throw potion action can be undone
    const { potionId } = this;
    setIsVisible(potionId, false);
    setActLike(potionId, ActLike.NONE);
    removeObjectFromTile(potionId);
  }

  undo() {
    const { potionId } = this;
    setIsVisible(potionId, true);
    throwPotion(
      potionId,
      this.#positionX as Px,
      this.#positionY as Px,
      (-1 * this.#velocityX) as Pps,
      (-1 * this.#velocityY) as Pps,
    );
    placeObjectInTile(potionId);
  }
}
