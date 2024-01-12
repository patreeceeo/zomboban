import { Action } from "../systems/ActionSystem";
import { setPosition } from "../components/Position";
import { setActLike } from "../components/ActLike";
import { Layer, setLayer } from "../components/Layer";
import { setLookLike } from "../components/LookLike";
import { setPixiAppId } from "../components/PixiAppId";
import {
  EntityFrameOperation,
  setEntityFrameOperation,
} from "../components/EntityFrameOperation";
import { placeObjectInTile } from "../Tile";
import { AirplaneBehavior } from "../behaviors/AirplaneBehavior";
import {
  convertPixelsToTilesX,
  convertTxpsToPps,
  convertTypsToPps,
} from "../units/convert";
import { Rectangle } from "../Rectangle";
import { ReservedEntity } from "../entities";

export function throwPotion(
  potionId: number,
  positionX: Px,
  positionY: Px,
  velocityX: Txps,
  velocityY: Typs,
) {
  setPixiAppId(potionId, ReservedEntity.DEFAULT_PIXI_APP);
  setLayer(potionId, Layer.OBJECT);
  setActLike(potionId, new AirplaneBehavior(potionId, velocityX, velocityY));
  setLookLike(potionId, ReservedEntity.POTION_SPIN_ANIMATION);
  setPosition(
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
    setEntityFrameOperation(this.entityId, EntityFrameOperation.REMOVE);
  }
}
