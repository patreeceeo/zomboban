import { XUI, IslandsByNameMap } from "xui";

const islands = {
  "island-basic": {
    templateHref: "./islands/basic.html"
  }
} as IslandsByNameMap;

const state = {
  canPigsFly: false
};

XUI.ready(() => {
  // TODO combine these statements into an ready method?
  const xui = new XUI(document.body, { islands, state });
  xui.update();

  addToGlobalScope({ togglePigWings });

  function togglePigWings() {
    state.canPigsFly = !state.canPigsFly;
    xui.update();
  }
});

function addToGlobalScope(record: Record<string, any>) {
  for (const [key, value] of Object.entries(record)) {
    (globalThis as any)[key] = value;
  }
}
