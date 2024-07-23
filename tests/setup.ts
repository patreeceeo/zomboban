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
  },
  "island-porous-2": {
    templateHref: "./islands/porous-2.html",
    mount: "/tests/islands/porous"
  }
} as IslandsByNameMap;

export class TopLevelScope {
  canPigsFly = false;
  colors = ["akai", "aoui", "shiroi"];
}

const scope = new TopLevelScope();
addToGlobalScope({ togglePigWings, addColor, removeColor });

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
