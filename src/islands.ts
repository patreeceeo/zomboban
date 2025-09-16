import { createIslandMap } from "./Zui/Island";
import { namedTemplates } from "./templates";

const islands = createIslandMap(namedTemplates, {
  async "my-img"() {
    return (await import("./ui/my-img")).default;
  },
  async "my-sign-in-form"() {
    return (await import("./ui/my-sign-in-form")).default;
  },
  async "my-main-menu"() {
    return (await import("./ui/my-main-menu")).default;
  },
  async "my-help"() {
    return (await import("./ui/my-help")).default;
  },
});

export default islands;
