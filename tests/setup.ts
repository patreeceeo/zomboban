import { Zui, IslandsByNameMap } from "Zui";

const islands = {
  "island-basic": {
    templateHref: "./islands/basic.html"
  },
  "island-handle-click": {
    templateHref: "./islands/handle-click.html",
    mount: "/tests/islands/handle-click"
  },
  "island-interpolation": {
    templateHref: "./islands/interpolation.html",
    mount: "/tests/islands/interpolation"
  },
  "island-porous": {
    templateHref: "./islands/porous.html",
    mount: "/tests/islands/porous"
  }
} as IslandsByNameMap;

export class TopLevelScope {
  canPigsFly = false;
}

const scope = new TopLevelScope();

addToGlobalScope({ togglePigWings });

const ui = new Zui(document.body, { islands, scope });

await ui.ready();

ui.update();

requestAnimationFrame(handleFrame);

function handleFrame() {
  ui.update();
  requestAnimationFrame(handleFrame);
}

function togglePigWings() {
  scope.canPigsFly = !scope.canPigsFly;
}

function addToGlobalScope(record: Record<string, any>) {
  for (const [key, value] of Object.entries(record)) {
    (globalThis as any)[key] = value;
  }
}
