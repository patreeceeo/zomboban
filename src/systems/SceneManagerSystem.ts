import { Not } from "../Query";
import { SystemWithQueries } from "../System";
import { InSceneTag, LevelIdComponent } from "../components";
import { State } from "../state";

export class SceneManagerSystem extends SystemWithQueries<
  State
> {
  levelQuery = this.createQuery([LevelIdComponent]);
  levelInSceneQuery = this.createQuery([LevelIdComponent, InSceneTag]);
  levelNotInSceneQuery = this.createQuery([
    LevelIdComponent,
    Not(InSceneTag, this.mgr.context.world)
  ]);

  update(context: State): void {
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
  }
}
