import { XUI, Island } from "xui";

// For now, names have to be UPPERCASE
export const islands = {
  BASIC: new Island("./islands/basic.html")
};

const state = {
  canPigsFly: false
};

const xui = new XUI(document.body, { islands, state });

for (const islandRootElement of xui.findIslands(document.body)) {
  xui.hydrateIsland(islandRootElement);
}
