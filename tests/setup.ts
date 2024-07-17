import { XUI, Island } from "xui";

// For now, names have to be UPPERCASE
const islands = {
  BASIC: new Island("./islands/basic.html")
};

const state = {
  canPigsFly: false
};

XUI.ready(() => {
  // TODO combine these statements into an ready method?
  const xui = new XUI(document.body, { islands, state });
  xui.update();
  for (const islandRootElement of xui.findIslands(document.body)) {
    xui.hydrateIsland(islandRootElement);
  }

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
