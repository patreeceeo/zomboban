import * as Position from "./Position";
import * as PositionX from "./PositionX";
import * as PositionY from "./PositionY";
import * as PixiAppId from "./PixiAppId";
import * as IsVisible from "./IsVisible";
import * as DisplayContainer from "./DisplayContainer";

declare global {
  var setPixiAppId: typeof PixiAppId.setPixiAppId;
  var setPosition: typeof Position.setPosition;
  var getPositionX: typeof PositionX.getPositionX;
  var getPositionY: typeof PositionY.getPositionY;
  var setIsVisible: typeof IsVisible.setIsVisible;
  var getIsVisible: typeof IsVisible.getIsVisible;
  var setDisplayContainer: typeof DisplayContainer.setDisplayContainer;
  var getDisplayContainer: typeof DisplayContainer.getDisplayContainer;
}

globalThis.setPixiAppId = PixiAppId.setPixiAppId;
globalThis.setPosition = Position.setPosition;
globalThis.getPositionX = PositionX.getPositionX;
globalThis.getPositionY = PositionY.getPositionY;
globalThis.setIsVisible = IsVisible.setIsVisible;
globalThis.setDisplayContainer = DisplayContainer.setDisplayContainer;
globalThis.getDisplayContainer = DisplayContainer.getDisplayContainer;
