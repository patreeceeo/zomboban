import { clearLog, readLog } from "../Log";

const logEl = document.getElementById("log")!;

function LogServiceUpdate() {
  logEl.innerText = readLog();
  clearLog();
}

export const LogService = {
  update: LogServiceUpdate,
  interval: 500,
};
