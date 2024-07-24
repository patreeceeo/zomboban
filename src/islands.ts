import type { IslandsByNameMap } from "Zui";

const islands: IslandsByNameMap = {
  "my-toolbar": {
    templateHref: "src/ui/my-toolbar.html",
    mount: "/src/ui/my-toolbar"
  },
  "my-admin-toolbar": {
    templateHref: "src/ui/my-admin-tools.html",
    mount: "/src/ui/my-admin-tools"
  }
};

export default islands;
