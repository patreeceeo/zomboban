import { Zui, IslandsByNameMap } from "Zui";

const islands = {
  "island-basic": {
    templateHref: "./islands/basic.html"
  }
} as IslandsByNameMap;

const state = {
  canPigsFly: false
};

Zui.ready(() => {
  // TODO combine these statements into an ready method?
  const ui = new Zui(document.body, { islands, state });
  ui.update();

  addToGlobalScope({ togglePigWings });

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
