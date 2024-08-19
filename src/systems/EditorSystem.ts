import {
  EntityPrefabEnum,
  IEntityPrefabState,
  bindEntityPrefabs
} from "../entities";
import { SystemWithQueries } from "../System";
import {
  CursorTag,
  IsActiveTag,
  IsGameEntityTag,
  TransformComponent
} from "../components";
import {
  BehaviorState,
  EntityManagerState,
  LoadingState,
  MetaState,
  MetaStatus,
  QueryState
} from "../state";
import { LoadingItem } from "./LoadingSystem";

type State = QueryState &
  MetaState &
  EntityManagerState &
  BehaviorState &
  MetaState &
  LoadingState &
  IEntityPrefabState;

export class EditorSystem extends SystemWithQueries<State> {
  #gameNtts = this.createQuery([IsGameEntityTag]);
  #cursorNtts = this.createQuery([CursorTag, TransformComponent]);
  start(state: State) {
    const { entityPrefabMap } = state;
    bindEntityPrefabs(state);
    if (!entityPrefabMap.has(EntityPrefabEnum.Cursor)) {
      state.loadingItems.add(
        new LoadingItem("editor", async () => {
          const Cursor = (await import("../entities/CursorEntity")).default;
          entityPrefabMap.set(EntityPrefabEnum.Cursor, Cursor);
          Cursor.create(state);
        })
      );
    }
    state.metaStatus = MetaStatus.Edit;
    this.resources.push(
      this.#cursorNtts.stream((entity) => {
        IsActiveTag.add(entity);
        entity.transform.visible = true;
      }),
      this.#gameNtts.stream((ent) => {
        IsActiveTag.remove(ent);
      })
    );
  }
  stop() {
    for (const entity of this.#cursorNtts) {
      IsActiveTag.remove(entity);
      entity.transform.visible = false;
    }
  }
}
