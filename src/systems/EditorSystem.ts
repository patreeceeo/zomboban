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
  ActionsState,
  EntityManagerState,
  LoadingState,
  MetaState,
  MetaStatus,
  QueryState,
  RouterState
} from "../state";
import { handleRestart } from "../inputs";

type State = QueryState &
  MetaState &
  EntityManagerState &
  MetaState &
  LoadingState &
  IEntityPrefabState &
  RouterState &
  ActionsState;

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

    handleRestart(state);

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
