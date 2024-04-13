import { SystemWithQueries } from "../System";
import { TransformComponent, ViewportTransformComponent } from "../components";
import { CameraState, QueryState } from "../state";
import { VIEWPORT_SIZE } from "../constants";
import { ITypewriterTargetData } from "../Typewriter";

type Context = QueryState & CameraState;

const halfViewportWidth = VIEWPORT_SIZE.x / 2;
const halfViewportHeight = VIEWPORT_SIZE.y / 2;

export class ViewportSystem extends SystemWithQueries<Context> {
  viewportTransformQuery = this.createQuery([
    ViewportTransformComponent,
    TransformComponent
  ]);

  // TODO(optimize): These computations only need to be run when the camera moves
  update(state: Context) {
    const { camera } = state;
    for (const entity of this.viewportTransformQuery) {
      const { viewportTransform, transform } = entity;
      const { position: viewportPosition } = viewportTransform;
      const { position, rotation } = transform;
      const {
        rotation: cameraRotation,
        zoom,
        position: cameraPosition
      } = camera;
      const inverseZoom = 1 / zoom;
      const typewriterData = transform.userData as ITypewriterTargetData;

      // Using the camera's position, rotation and zoom, position entity in 3d space such that it appears in the viewport at `viewportTransform.position`
      position.set(
        ((viewportPosition.x - halfViewportWidth) * inverseZoom +
          cameraPosition.x * Math.cos(cameraRotation.y) -
          cameraPosition.z * Math.sin(cameraRotation.y)) /
          Math.cos(cameraRotation.y),
        ((-viewportPosition.y +
          halfViewportHeight +
          Math.max(0, typewriterData.outputHeight - VIEWPORT_SIZE.y)) *
          inverseZoom +
          cameraPosition.y * Math.cos(cameraRotation.x) +
          cameraPosition.z * Math.sin(cameraRotation.x)) /
          Math.cos(cameraRotation.x),
        10
      );
      rotation.copy(cameraRotation);
    }
  }
}
