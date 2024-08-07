import { Vector3 } from "three";
import { EntityWithComponents } from "../Component";
import { IEntityPrefab } from "../EntityManager";
import { HeadingDirection } from "../HeadingDirection";
import { Message, createMessage, getReceivers, sendMessage } from "../Message";
import { MoveAction, RotateAction } from "../actions";
import {
  InSceneTag,
  BehaviorComponent,
  HeadingDirectionComponent,
  IsGameEntityTag,
  ModelComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { BehaviorState, EntityManagerState, TimeState } from "../state";
import { ActionEntity } from "../systems/ActionSystem";
import { Behavior } from "../systems/BehaviorSystem";
import { WallBehavior } from "./WallEntity";
import { CanMoveMessage } from "../messages";
import { convertPropertiesToTiles } from "../units/convert";
import { ITilesState } from "../systems/TileSystem";
import { ASSET_IDS } from "../assets";

type BehaviorContext = TimeState & ITilesState & BehaviorState;

const vecInPixels = new Vector3();
const vecInTiles = new Vector3();

export class MonsterBehavior extends Behavior<
  ActionEntity<typeof TransformComponent>,
  BehaviorContext
> {
  static id = "behavior/monster";
  onUpdateEarly(
    entity: ReturnType<typeof MonsterEntity.create>,
    context: BehaviorContext
  ) {
    if (entity.actions.size > 0) return; // EARLY RETURN!

    let canMove;
    let attempts = 0;
    let headingDirection = entity.headingDirection;
    do {
      HeadingDirection.getVector(headingDirection, vecInPixels);
      vecInTiles.copy(vecInPixels);
      convertPropertiesToTiles(vecInTiles);
      vecInTiles.add(entity.tilePosition);

      const receivers = getReceivers(context.tiles, vecInTiles);

      canMove = true;
      for (const receiver of receivers) {
        canMove &&= sendMessage(
          createMessage(CanMoveMessage, vecInPixels).from(entity).to(receiver),
          context
        );
      }
      // console.log(
      //   "sent message to",
      //   HeadingDirectionValue[headingDirection],
      //   "answer",
      //   receiver ? canMove : undefined
      // );
      if (!canMove) {
        headingDirection = HeadingDirection.rotateCCW(headingDirection);
        // console.log("trying", HeadingDirectionValue[headingDirection], "next");
      }
      attempts++;
    } while (!canMove && attempts < 4);

    if (headingDirection !== entity.headingDirection) {
      return [new RotateAction(entity, context.time, headingDirection)];
    }
    // TODO send kill message
  }
  onUpdateLate(
    entity: ReturnType<typeof MonsterEntity.create>,
    context: BehaviorContext
  ) {
    if (entity.actions.size > 0) return; // EARLY RETURN!

    return [new MoveAction(entity, context.time, vecInPixels)];
  }
  onReceive(message: Message<any>) {
    WallBehavior.prototype.onReceive(message);
  }
}

type Context = EntityManagerState & BehaviorState;
export const MonsterEntity: IEntityPrefab<
  Context,
  EntityWithComponents<
    | typeof BehaviorComponent
    | typeof TransformComponent
    | typeof TilePositionComponent
    | typeof HeadingDirectionComponent
  >
> = {
  create(state) {
    const entity = state.addEntity();

    BehaviorComponent.add(entity, {
      behaviorId: MonsterBehavior.id
    });

    TransformComponent.add(entity);

    TilePositionComponent.add(entity);

    ModelComponent.add(entity, {
      modelId: ASSET_IDS.monster
    });

    HeadingDirectionComponent.add(entity);

    IsGameEntityTag.add(entity);

    InSceneTag.add(entity);

    return entity;
  },
  destroy(entity) {
    return entity;
  }
};
