import * as Position from "./Position";
import * as PositionX from "./PositionX";
import * as PositionY from "./PositionY";
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

declare global {
  var setPixiAppId: typeof PixiAppId.setPixiAppId;
  var setPosition: typeof Position.setPosition;
  var getPositionX: typeof PositionX.getPositionX;
  var getPositionY: typeof PositionY.getPositionY;
  var setIsVisible: typeof IsVisible.setIsVisible;
  var getIsVisible: typeof IsVisible.getIsVisible;
  var setDisplayContainer: typeof DisplayContainer.setDisplayContainer;
  var getDisplayContainer: typeof DisplayContainer.getDisplayContainer;
  var setVelocity: typeof Velocity.setVelocity;
  var getVelocityX: typeof VelocityX.getVelocityX;
  var getVelocityY: typeof VelocityY.getVelocityY;
  var getTint: typeof Tint.getTint;
  var setTint: typeof Tint.setTint;
  var getText: typeof Text.getText;
  var setText: typeof Text.setText;
  var getSprite: typeof Sprite.getSprite;
  var setSprite: typeof Sprite.setSprite;
  var shouldSave: typeof ShouldSave.shouldSave;
  var setShouldSave: typeof ShouldSave.setShouldSave;
  var getLoadingState: typeof LoadingState.getLoadingState;
  var setLoadingState: typeof LoadingState.setLoadingState;
  var getLayer: typeof Layer.getLayer;
  var setLayer: typeof Layer.setLayer;
  var getImage: typeof Image.getImage;
  var setImage: typeof Image.setImage;
  var getEntityFrameOperation: typeof EntityFrameOperation.getEntityFrameOperation;
  var setEntityFrameOperation: typeof EntityFrameOperation.setEntityFrameOperation;
  var getCameraFollow: typeof CameraFollow.getCameraFollow;
  var setCameraFollow: typeof CameraFollow.setCameraFollow;
  var getAnimation: typeof Animation.getAnimation;
  var setAnimation: typeof Animation.setAnimation;
  var getActLike: typeof ActLike.getActLike;
  var setActLike: typeof ActLike.setActLike;
}

Object.assign(globalThis, {
  setPixiAppId: PixiAppId.setPixiAppId,
  setPosition: Position.setPosition,
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
