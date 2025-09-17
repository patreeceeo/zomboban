import { createIslandMap } from "./Zui/Island";
import { namedTemplates } from "./templates";

const islands = createIslandMap(namedTemplates, {
  async "my-img"() {
    return (await import("./ui/my-img")).default;
  },
});

export default islands;
