import { EntityName, getNamedEntity } from "../Entity";
import { ActLike, setActLike } from "../components/ActLike";
import { setLookLike } from "../components/LookLike";
import { ActionType, Action } from "../systems/ActionSystem";

export class UnzombifyAction implements Action {
  type = ActionType.Unzombify;
  constructor(readonly zombieId: number) {}

  apply() {
    const { zombieId } = this;
    setActLike(zombieId, ActLike.UNZOMBIE);
    setLookLike(zombieId, getNamedEntity(EntityName.UNZOMBIE_ANIMATION));
  }

  undo() {
    const { zombieId } = this;
    setActLike(zombieId, ActLike.ZOMBIE);
    setLookLike(zombieId, getNamedEntity(EntityName.ZOMBIE_SWAY_ANIMATION));
  }
}
