import { EventType } from "./EventType";
import { IslandController } from "./Island";

export const hmrDeleteIslandController = new EventType(
  "Zui:hmr-delete:IslandController"
);

export const hmrSetIslandController = new EventType<IslandController>(
  "Zui:hmr-set:IslandController"
);
