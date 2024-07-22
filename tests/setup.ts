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
  }
} as IslandsByNameMap;

const state = {
  canPigsFly: false
};

Zui.ready(async () => {
  // TODO combine these statements into an ready method?
  const ui = new Zui(document.body, { islands, state });
  addToGlobalScope({ togglePigWings });
  await ui.hydrated;
  ui.update();

  requestAnimationFrame(handleFrame);

  function handleFrame() {
    ui.update();
    requestAnimationFrame(handleFrame);
  }

  function togglePigWings() {
    state.canPigsFly = !state.canPigsFly;
    ui.update();
  }
});

function addToGlobalScope(record: Record<string, any>) {
  for (const [key, value] of Object.entries(record)) {
    (globalThis as any)[key] = value;
  }
}
