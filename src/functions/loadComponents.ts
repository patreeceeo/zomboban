import { peekNextEntityId } from "../Entity";
import { loadActLike } from "../components/ActLike";
import { loadLayer } from "../components/Layer";
import { loadLookLike } from "../components/LookLike";
import { loadPixiAppId } from "../components/PixiAppId";
import { loadPositionX } from "../components/PositionX";
import { loadPositionY } from "../components/PositionY";
import { loadShouldSave } from "../components/ShouldSave";

export function loadComponents() {
  const nextEntityId = peekNextEntityId();
  loadShouldSave(nextEntityId);
  loadLayer(nextEntityId);
  loadPositionX(nextEntityId);
  loadPositionY(nextEntityId);
  loadLookLike(nextEntityId);
  loadActLike(nextEntityId);
  loadPixiAppId(nextEntityId);
}
