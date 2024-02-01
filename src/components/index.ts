import * as ActLike from "./ActLike";
import * as Animation from "./Animation";
import * as CameraFollow from "./CameraFollow";
import * as DisplayContainer from "./DisplayContainer";
import * as EntityFrameOperation from "./EntityFrameOperation";
import * as Image from "./Image";
import * as IsVisible from "./IsVisible";
import * as Layer from "./Layer";
import * as LevelId from "./LevelId";
import * as LoadingState from "./LoadingState";
import * as LookLike from "./LookLike";
import * as Orientation from "./Orientation";
import * as Position from "./Position";
import * as PositionX from "./PositionX";
import * as PositionY from "./PositionY";
import * as ShouldSave from "./ShouldSave";
import * as Sprite from "./Sprite";
import * as Text from "./Text";
import * as Tint from "./Tint";
import * as Velocity from "./Velocity";
import * as VelocityX from "./VelocityX";
import * as VelocityY from "./VelocityY";

export const QC = Object.freeze({
  ...Position,
  ...PositionX,
  ...PositionY,
  ...IsVisible,
  ...DisplayContainer,
  ...Velocity,
  ...VelocityX,
  ...VelocityY,
  ...Tint,
  ...Text,
  ...Sprite,
  ...ShouldSave,
  ...LoadingState,
  ...Layer,
  ...Image,
  ...EntityFrameOperation,
  ...CameraFollow,
  ...Animation,
  ...ActLike,
  ...LookLike,
  ...Orientation,
  ...LevelId,
});
