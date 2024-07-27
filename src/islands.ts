import { createIslandMap } from "./Zui/Island";
import { namedTemplates } from "./templates";

const islands = createIslandMap(namedTemplates, {
  async "my-toolbar"() {
    return (await import("./ui/my-toolbar")).default;
  },
  async "my-admin-toolbar"() {
    return (await import("./ui/my-admin-tools")).default;
  }
});

export default islands;
