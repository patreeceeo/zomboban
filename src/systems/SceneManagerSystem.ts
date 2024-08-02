import { Not } from "../Query";
import { SystemWithQueries } from "../System";
import { CanDeleteTag, InSceneTag, LevelIdComponent } from "../components";
import { EntityManagerState, MetaState, QueryState } from "../state";

export class SceneManagerSystem extends SystemWithQueries<
  MetaState & QueryState & EntityManagerState
> {
  levelQuery = this.createQuery([LevelIdComponent]);
  levelInSceneQuery = this.createQuery([LevelIdComponent, InSceneTag]);
  levelNotInSceneQuery = this.createQuery([
    LevelIdComponent,
    Not(InSceneTag),
    Not(CanDeleteTag)
  ]);
  deletedQuery = this.createQuery([CanDeleteTag]);

  update(context: MetaState & EntityManagerState): void {
    for (const entity of this.levelInSceneQuery) {
      if (entity.levelId !== context.currentLevelId) {
        InSceneTag.remove(entity);
      }
    }
    for (const entity of this.levelNotInSceneQuery) {
      if (entity.levelId === context.currentLevelId) {
        InSceneTag.add(entity);
      }
    }

    for (const entity of this.deletedQuery) {
      context.removeEntity(entity);
    }
  }
}
