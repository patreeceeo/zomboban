import { Vector3 } from "../Three";
import { HeadingDirection, HeadingDirectionValue } from "../HeadingDirection";
import {
  BehaviorComponent,
  HeadingDirectionComponent,
  TilePositionComponent,
  TransformComponent
} from "../components";
import { BehaviorState, TimeState } from "../state";
import { Behavior } from "../systems/BehaviorSystem";
import { ITilesState } from "../systems/TileSystem";
import { Message, sendMessage } from "../Message";
import { HitByMonsterMessage, MoveMessage } from "../messages";
import { MoveAction, RotateAction } from "../actions";
import { EntityWithComponents } from "../Component";
import { Action } from "../Action";

type BehaviorContext = TimeState & ITilesState & BehaviorState;
type Entity = EntityWithComponents<
  | typeof BehaviorComponent
  | typeof TransformComponent
  | typeof TilePositionComponent
  | typeof HeadingDirectionComponent
>;

const _tileDelta = new Vector3();
const _tilePosition = new Vector3();

export class MonsterBehavior extends Behavior<Entity, BehaviorContext> {
  getNextTilePosition(
    currentTilePosition: Vector3,
    headingDirection: HeadingDirectionValue
  ) {
    HeadingDirection.getVector(headingDirection, _tileDelta);
    _tilePosition.copy(_tileDelta);
    _tilePosition.add(currentTilePosition);
  }
  onUpdateEarly(entity: Entity, context: BehaviorContext) {
    const { tilePosition } = entity;

    this.getNextTilePosition(tilePosition, entity.headingDirection);

    sendMessage(new HitByMonsterMessage(entity), _tilePosition, context);

    if (entity.actions.size > 0) return; // EARLY RETURN!

    const actions = [] as Action<any, any>[];
    const moveResult = MoveMessage.reduceResponses(
      sendMessage(new MoveMessage.Into(entity), _tilePosition, context)
    );

    if (moveResult === MoveMessage.Response.Blocked) {
      const headingDirection = HeadingDirection.rotateCW(
        entity.headingDirection
      );

      actions.push(new RotateAction(entity, context.time, headingDirection));

      HeadingDirection.getVector(headingDirection, _tileDelta);
    } else {
      actions.push(new MoveAction(entity, context.time, _tileDelta));
    }
    return actions;
  }
  messageHandlers = {
    [MoveMessage.Into.type]: (
      entity: Entity,
      context: BehaviorContext,
      message: Message<any>
    ) => {
      sendMessage(
        new MoveMessage.IntoGolem(entity),
        message.sender.tilePosition,
        context
      );
      return MoveMessage.Response.Blocked;
    },
    [MoveMessage.IntoGrass.type]: () => {
      return MoveMessage.Response.Allowed;
    },
    [MoveMessage.IntoWallPlaceholder.type]: () => {
      return MoveMessage.Response.Allowed;
    },
    [MoveMessage.IntoWall.type]: () => {
      return MoveMessage.Response.Blocked;
    }
  };
}
