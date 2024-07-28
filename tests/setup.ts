import { delegateEventType } from "Zui/events";
import { Zui } from "../src/Zui";
import { IslandsByNameMap, loadNullController } from "../src/Zui/Island";

const islands = {
  "island-basic": {
    templateHref: "/tests/basic.html",
    loadController: loadNullController
  },
  "island-events": {
    templateHref: "/tests/events.html",
    async loadController() {
      return (await import("./islands/events")).default;
    }
  },
  "island-interpolation": {
    templateHref: "/tests/interpolation.html",
    async loadController() {
      return (await import("./islands/interpolation")).default;
    }
  },
  "island-porous": {
    templateHref: "/tests/porous.html",
    async loadController() {
      return (await import("./islands/porous")).default;
    }
  },
  "island-porous-2": {
    templateHref: "/tests/porous-2.html",
    async loadController() {
      return (await import("./islands/porous")).default;
    }
  }
} as IslandsByNameMap;

export class TopLevelScope {
  canPigsFly = false;
  colors = ["akai", "aoui", "shiroi"];
}

const scope = new TopLevelScope();
addToGlobalScope({ togglePigWings, addColor, removeColor });

const ui = new Zui(document.body, { islands, scope });

ui.ready().then(() => {
  ui.update();

  requestAnimationFrame(handleFrame);

  function handleFrame() {
    ui.update();
    requestAnimationFrame(handleFrame);
  }
});

function togglePigWings() {
  scope.canPigsFly = !scope.canPigsFly;
}

function addColor(e: SubmitEvent) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const data = new FormData(form);
  const other = data.get("other")!;
  scope.colors.push(other.toString());
}

function removeColor(event: MouseEvent) {
  const { target } = event;
  const el = target as HTMLElement;
  const color = el.innerText;
  const index = scope.colors.indexOf(color);
  scope.colors.splice(index, 1);
}

function addToGlobalScope(record: Record<string, any>) {
  for (const [key, value] of Object.entries(record)) {
    (globalThis as any)[key] = value;
  }
}

delegateEventType.receiveOn(document.body, (event) => {
  const { methodName, source } = event.detail;

  if (methodName === "handleClock") {
    source.innerHTML = "Clocked!";
  }
});
