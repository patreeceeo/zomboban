import { EntityName, getNamedEntity } from "../Entity";
import { ActLike, setActLike } from "../components/ActLike";
import { Layer, setLayer } from "../components/Layer";
import { setLookLike } from "../components/LookLike";
import { setPixiAppId } from "../components/PixiAppId";

export function createPotion(id: number) {
  setPixiAppId(id, getNamedEntity(EntityName.DEFAULT_PIXI_APP));
  setLayer(id, Layer.OBJECT);
  setActLike(id, ActLike.POTION);
  setLookLike(id, getNamedEntity(EntityName.POTION_IMAGE));
}
