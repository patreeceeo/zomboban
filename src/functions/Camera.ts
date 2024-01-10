import { Rectangle } from "../Rectangle";
import { getTileX, getTileY } from "../Tile";
import { getCameraFollow } from "../components/CameraFollow";
import { SCREEN_TILE } from "../units/convert";

const _viewRectange = new Rectangle(0, 0, 0, 0);

/**
 * Get the rectangle of tiles that the camera is currently viewing.
 * Do not retain a reference to the returned rectangle instance, it will be reused!
 */
export function getCameraViewRectangle(cameraId: number): Rectangle {
  const cameraFollowId = getCameraFollow(cameraId);
  const positionX = getTileX(cameraFollowId);
  const positionY = getTileY(cameraFollowId);

  _viewRectange.x1 = positionX - SCREEN_TILE / 2;
  _viewRectange.y1 = positionY - SCREEN_TILE / 2;
  _viewRectange.x2 = positionX + SCREEN_TILE / 2;
  _viewRectange.y2 = positionY + SCREEN_TILE / 2;

  return _viewRectange;
}
