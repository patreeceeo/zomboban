import type { IslandsByNameMap } from "./Zui/Island";

const islands: IslandsByNameMap = {
  "my-toolbar": {
    templateHref: "my-toolbar.html",
    async loadController() {
      return (await import("./ui/my-toolbar")).default;
    }
  },
  "my-admin-toolbar": {
    templateHref: "my-admin-tools.html",
    async loadController() {
      return (await import("./ui/my-admin-tools")).default;
    }
  }
};

export default islands;
