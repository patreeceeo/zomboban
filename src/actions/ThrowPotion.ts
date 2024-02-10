import { Action } from "../systems/ActionSystem";
import { placeObjectInTile } from "../Tile";
import { AirplaneBehavior } from "../behaviors/AirplaneBehavior";
import {
  convertPixelsToTilesX,
  convertTxpsToPps,
  convertTypsToPps,
} from "../units/convert";
import { Rectangle } from "../Rectangle";
import { ReservedEntity } from "../entities";
import { mutState } from "../state";
import { LayerId } from "../components/LayerId";

export function throwPotion(
  potionId: number,
  positionX: Px,
  positionY: Px,
  velocityX: Txps,
  velocityY: Typs,
) {
  mutState.setLayer(potionId, LayerId.Object);
  mutState.setBehavior(
    potionId,
    new AirplaneBehavior(potionId, velocityX, velocityY),
  );
  mutState.setImageId(potionId, ReservedEntity.POTION_SPIN_ANIMATION);
  mutState.setPosition(
    potionId,
    (positionX + convertTxpsToPps(velocityX)) as Px,
    (positionY + convertTypsToPps(velocityY)) as Px,
  );
  placeObjectInTile(potionId);
}

export class ThrowPotionAction implements Action {
  readonly effectedArea: Rectangle;
  isComplete = false;

  constructor(
    readonly entityId: number,
    readonly positionX: Px,
    readonly positionY: Px,
    readonly velocityX: Txps,
    readonly velocityY: Typs,
  ) {
    const nextX = convertPixelsToTilesX(positionX) + velocityX;
    const nextY = convertPixelsToTilesX(positionY) + velocityY;
    this.effectedArea = new Rectangle(nextX, nextY, nextX, nextY);
  }

  progress(): void {
    this.complete();
  }

  complete() {
    const {
      entityId: potionId,
      positionX,
      positionY,
      velocityX,
      velocityY,
    } = this;
    throwPotion(potionId, positionX, positionY, velocityX, velocityY);
    this.isComplete = true;
  }

  undo() {
    mutState.setToBeRemovedThisFrame(this.entityId);
  }
}
