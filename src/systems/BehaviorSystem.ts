import { World } from "../EntityManager";
import { IQueryResults } from "../Query";
import { System } from "../System";
import { BehaviorComponent, IsActiveTag } from "../components";
import { State } from "../state";
import { Action } from "./ActionSystem";

export abstract class Behavior<Entity, Context extends World> {
  abstract act(entity: Entity, context: Context): Action<Entity, Context>[];
  abstract react(
    actions: Action<Entity, Context>[],
    entity: Entity,
    context: Context
  ): Action<Entity, Context>[];
}

export class BehaviorSystem extends System<State> {
  #behaviors: IQueryResults<typeof BehaviorComponent> | undefined;
  start(state: State) {
    this.#behaviors = state.query([BehaviorComponent, IsActiveTag]);
  }
  update(state: State) {
    for (const entity of this.#behaviors!) {
      const behavior = state.getBehavior(entity.behaviorId);
      behavior.act(entity, state);
    }
  }
}

/*
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * TODO remove old code
 */
// const RemovingQuery = stateOld
//   .buildQuery({ all: [BehaviorComponent, EntityFrameOperationComponent] })
//   .complete(({ entityId }) => {
//     return (
//       stateOld.has(EntityFrameOperationComponent, entityId) &&
//       stateOld.is(
//         EntityFrameOperationComponent,
//         entityId,
//         EntityFrameOperation.REMOVE
//       )
//     );
//   });

// const NotRemovingQuery = stateOld
//   .buildQuery({ all: [BehaviorComponent] })
//   .complete(({ entityId }) => {
//     return (
//       typeof stateOld.get(BehaviorComponent, entityId) === "object" &&
//       !(
//         stateOld.has(EntityFrameOperationComponent, entityId) &&
//         stateOld.is(
//           EntityFrameOperationComponent,
//           entityId,
//           EntityFrameOperation.REMOVE
//         )
//       )
//     );
//   });

// export function BehaviorSystemOld(deltaTime: number, elapsedTime: number) {
//   for (const entityId of RemovingQuery()) {
//     const behavior = stateOld.get(BehaviorComponent, entityId) as Behavior;
//     behavior.stop();
//   }

//   for (const entityId of NotRemovingQuery()) {
//     const behavior = stateOld.get(BehaviorComponent, entityId) as Behavior;
//     if (!behavior.isStarted) {
//       behavior.start();
//     }
//     behavior.onFrame(deltaTime, elapsedTime);
//   }
// }
