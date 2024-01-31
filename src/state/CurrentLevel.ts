import {
  getComponentData,
  loadComponents,
  serializeComponentData,
} from "../Component";
import { listEntities } from "../Entity";
import { QC } from "../components";
import { COMPONENT_DATA_URL } from "../constants";
import { ReservedEntity } from "../entities";
import { executeEntityOperation } from "../systems/EntityOperationSystem";

let currentLevel = 0;
export async function setCurrentLevelId(id: number) {
  QC.removeCameraFollow(ReservedEntity.CAMERA);
  for (const id of listEntities()) {
    if (QC.hasLevelId(id)) {
      // if (QC.hasActLike(id)) {
      //   QC.getActLike(id).stop();
      // }
      executeEntityOperation(id, QC.EntityFrameOperation.REMOVE);
      QC.removeAll(id);
    }
  }
  await loadComponents(COMPONENT_DATA_URL({ levelId: id }), {
    nextEntityId: ReservedEntity.HAND_CURSOR_IMAGE + 1,
    handleExistingEntity() {},
    // handleExistingEntity: (id) =>
    //   executeEntityOperation(id, EntityFrameOperation.REMOVE),
  });
  currentLevel = id;
  console.log("finished loading level", id);
  // console.log(serializeComponentData(getComponentData(), 2));
}

export function getCurrentLevelId() {
  return currentLevel;
}
