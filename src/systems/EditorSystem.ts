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
  async start(state: State) {
    const { entityPrefabMap } = state;
    this.resources.push(
      this.#cursorNtts.stream((entity) => {
        IsActiveTag.add(entity);
        entity.transform.visible = true;
      }),
      this.#gameNtts.stream((ent) => {
        IsActiveTag.remove(ent);
      })
    );
    await bindEntityPrefabs(state);
    if (this.#cursorNtts.size === 0) {
      const Cursor = entityPrefabMap.get(EntityPrefabEnum.Cursor)!;
      Cursor.create(state);
    }
    state.metaStatus = MetaStatus.Edit;
  }
  stop() {
    for (const entity of this.#cursorNtts) {
      IsActiveTag.remove(entity);
      entity.transform.visible = false;
    }
  }
}
