import { executeFilterQuery } from "../Query";
import { saveActLike } from "../components/ActLike";
import { saveLayer } from "../components/Layer";
import { saveLookLike } from "../components/LookLike";
import { savePixiAppId } from "../components/PixiAppId";
import { savePositionX } from "../components/PositionX";
import { savePositionY } from "../components/PositionY";
import { hasShouldSave, saveShouldSave } from "../components/ShouldSave";

const entityIds: number[] = [];
function getSelectedEntities(): ReadonlyArray<number> {
  entityIds.length = 0;
  return executeFilterQuery(hasShouldSave, entityIds);
}

export function saveComponents() {
  const selectedEntities = getSelectedEntities();
  saveShouldSave(selectedEntities);
  saveLayer(selectedEntities);
  savePositionX(selectedEntities);
  savePositionY(selectedEntities);
  saveLookLike(selectedEntities);
  saveActLike(selectedEntities);
  savePixiAppId(selectedEntities);
}
