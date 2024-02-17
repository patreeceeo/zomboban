import { writeLog } from "../Log";
import {
  ImageIdComponent,
  IsRenderDirtyComponent,
  LayerIdComponent,
  PositionComponent,
} from "../components";
import { state } from "../state";

const componentKlasses = [
  IsRenderDirtyComponent,
  PositionComponent,
  LayerIdComponent,
  ImageIdComponent,
];
const components = componentKlasses.map((klass) => state.getComponent(klass));
const Query = state.buildQuery({ all: componentKlasses }).complete();

function trimPad(str: string, width: number) {
  const sliced = str.slice(0, width - 1);
  return " ".repeat(Math.max(0, width - sliced.length)) + sliced;
}

function stringifyComponentValue(componentValue: unknown, colWidth: number) {
  let unpaddedValue: string;
  if (typeof componentValue === "object" && componentValue !== null) {
    try {
      unpaddedValue = JSON.stringify(componentValue);
    } catch (e) {
      unpaddedValue = componentValue!.constructor.name;
    }
  } else if (componentValue === undefined) {
    unpaddedValue = "undef";
  } else {
    unpaddedValue = String(componentValue);
  }
  return trimPad(unpaddedValue, colWidth);
}

const COL_WIDTH = 20;

function DebugServiceUpdate() {
  //
  // Entity Component Table
  //

  // one row per entity
  for (const entityId of Query()) {
    let rowString = trimPad(String(entityId), COL_WIDTH);
    for (const component of components) {
      const value = component.get(entityId);
      rowString += stringifyComponentValue(value, COL_WIDTH);
    }
    writeLog(rowString);
  }

  // header row: EntityId, ComponentName1, ComponentName2, ...
  let headerString = trimPad("EntityId", COL_WIDTH);
  for (const component of components) {
    headerString += trimPad(component.constructor.name, COL_WIDTH);
  }
  writeLog(headerString);
}

export const DebugService = {
  update: DebugServiceUpdate,
  interval: 500,
};
