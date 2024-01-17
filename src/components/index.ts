import * as Position from "./Position";
import * as PositionX from "./PositionX";
import * as PositionY from "./PositionY";
import * as PixiApp from "./PixiApp";
import * as PixiAppId from "./PixiAppId";
import * as IsVisible from "./IsVisible";
import * as DisplayContainer from "./DisplayContainer";
import * as Velocity from "./Velocity";
import * as VelocityX from "./VelocityX";
import * as VelocityY from "./VelocityY";
import * as Tint from "./Tint";
import * as Text from "./Text";
import * as Sprite from "./Sprite";
import * as ShouldSave from "./ShouldSave";
import * as LoadingState from "./LoadingState";
import * as Layer from "./Layer";
import * as Image from "./Image";
import * as EntityFrameOperation from "./EntityFrameOperation";
import * as CameraFollow from "./CameraFollow";
import * as Animation from "./Animation";
import * as ActLike from "./ActLike";

export const QC = Object.freeze({
  setPixiApp: PixiApp.setPixiApp,
  hasPixiApp: PixiApp.hasPixiApp,
  getPixiApp: PixiApp.getPixiApp,
  setPixiAppId: PixiAppId.setPixiAppId,
  hasPixiAppId: PixiAppId.hasPixiAppId,
  getPixiAppId: PixiAppId.getPixiAppId,
  setPosition: Position.setPosition,
  hasPosition: Position.hasPosition,
  getPositionX: PositionX.getPositionX,
  getPositionY: PositionY.getPositionY,
  setIsVisible: IsVisible.setIsVisible,
  getIsVisible: IsVisible.getIsVisible,
  setDisplayContainer: DisplayContainer.setDisplayContainer,
  getDisplayContainer: DisplayContainer.getDisplayContainer,
  setVelocity: Velocity.setVelocity,
  getVelocityX: VelocityX.getVelocityX,
  getVelocityY: VelocityY.getVelocityY,
  getTint: Tint.getTint,
  setTint: Tint.setTint,
  getText: Text.getText,
  setText: Text.setText,
  getSprite: Sprite.getSprite,
  setSprite: Sprite.setSprite,
  shouldSave: ShouldSave.shouldSave,
  setShouldSave: ShouldSave.setShouldSave,
  getLoadingState: LoadingState.getLoadingState,
  setLoadingState: LoadingState.setLoadingState,
  getLayer: Layer.getLayer,
  setLayer: Layer.setLayer,
  getImage: Image.getImage,
  hasImage: Image.hasImage,
  setImage: Image.setImage,
  getEntityFrameOperation: EntityFrameOperation.getEntityFrameOperation,
  setEntityFrameOperation: EntityFrameOperation.setEntityFrameOperation,
  getCameraFollow: CameraFollow.getCameraFollow,
  setCameraFollow: CameraFollow.setCameraFollow,
  getAnimation: Animation.getAnimation,
  setAnimation: Animation.setAnimation,
  getActLike: ActLike.getActLike,
  setActLike: ActLike.setActLike,
});
