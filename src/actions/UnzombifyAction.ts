import { EntityName, getNamedEntity } from "../Entity";
import { ActLike, setActLike } from "../components/ActLike";
import { setLookLike } from "../components/LookLike";
import { Action } from "../systems/ActionSystem";

export class UnzombifyAction implements Action {
  isComplete = true;
  constructor(readonly zombieId: number) {}

  progress() {
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
