import { writeLog } from "../Log";
import { state } from "../state";
import { ComponentName } from "../components";

function trimPad(str: string, width: number) {
  const sliced = str.slice(0, width - 1);
  return " ".repeat(Math.max(0, width - sliced.length)) + sliced;
}

function stringifyComponentValue(componentValue: unknown, colWidth: number) {
  let unpaddedValue: string;
  if (typeof componentValue === "object" && componentValue !== null) {
    unpaddedValue = componentValue!.constructor.name;
  } else if (componentValue === undefined) {
    unpaddedValue = "undef";
  } else {
    unpaddedValue = String(componentValue);
  }
  return trimPad(unpaddedValue, colWidth);
}

const COL_WIDTH = 20;

function DebugServiceUpdate() {
  const entityIds = state.addedEntities;
  const componentNames = [
    ComponentName.PositionX,
    ComponentName.PositionY,
    ComponentName.Behavior,
  ];

  //
  // Entity Component Table
  //

  // one row per entity
  for (const entityId of entityIds) {
    let rowString = trimPad(String(entityId), COL_WIDTH);
    for (const name of componentNames) {
      const value = state.hasComponent(name, entityId)
        ? state.getComponentValue(name, entityId)
        : undefined;
      rowString += stringifyComponentValue(value, COL_WIDTH);
    }
    writeLog(rowString);
  }

  // header row: EntityId, ComponentName1, ComponentName2, ...
  let headerString = trimPad("EntityId", COL_WIDTH);
  for (const name of componentNames) {
    headerString += trimPad(name, COL_WIDTH);
  }
  writeLog(headerString);
}

export const DebugService = {
  update: DebugServiceUpdate,
  interval: 500,
};
