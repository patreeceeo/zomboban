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
import { state } from "../state";
import { LayerId, LayerIdComponent } from "../components/LayerId";
import {
  BehaviorComponent,
  ImageIdComponent,
  PositionComponent,
} from "../components";
import { reuseVec2 } from "../Vec2";

export function throwPotion(
  potionId: number,
  positionX: Px,
  positionY: Px,
  velocityX: Txps,
  velocityY: Typs,
) {
  state.set(LayerIdComponent, potionId, LayerId.Object);
  state.set(
    BehaviorComponent,
    potionId,
    new AirplaneBehavior(potionId, velocityX, velocityY),
  );
  state.set(ImageIdComponent, potionId, ReservedEntity.POTION_SPIN_ANIMATION);
  state.set(
    PositionComponent,
    potionId,
    reuseVec2(
      (positionX + convertTxpsToPps(velocityX)) as Px,
      (positionY + convertTypsToPps(velocityY)) as Px,
    ),
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
    state.setToBeRemovedThisFrame(this.entityId);
  }
}
