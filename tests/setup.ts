import { Zui, IslandsByNameMap } from "Zui";
import htmx from "htmx.org";

const islands = {
  "island-basic": {
    templateHref: "./islands/basic.html"
  },
  "island-handle-click": {
    templateHref: "./islands/handle-click.html",
    mount: "/tests/islands/handle-click"
  }
} as IslandsByNameMap;

const state = {
  canPigsFly: false,
  handleClick(event: MouseEvent) {
    const el = event.target as HTMLElement;
    el.innerText = "Clicked";
  }
};

Zui.ready(() => {
  // TODO combine these statements into an ready method?
  const ui = new Zui(document.body, { islands, state });
  ui.update();
  htmx.onLoad(() => {
    ui.update();
  });

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
