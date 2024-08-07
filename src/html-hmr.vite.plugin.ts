import { HmrContext, ModuleNode } from "vite";
import { relative } from "path";
import { cwd } from "process";

class FakeModuleNode {
  id = null;
  file = null;
  importers = new Set();
  clientImportedModules = new Set();
  ssrImportedModules = new Set();
  acceptedHmrDeps = new Set();
  acceptedHmrExports = null;
  importedBindings = null;
  transformResult = null;
  ssrTransformResult = null;
  ssrModule = null;
  ssrError = null;
  lastHMRTimestamp = 0;
  lastInvalidationTimestamp = 0;
  type = "js"; // lie
  constructor(
    public url: string,
    public isSelfAccepting = true
  ) {}
  get importedModules() {
    const importedModules = new Set(this.clientImportedModules);
    for (const module of this.ssrImportedModules) {
      importedModules.add(module);
    }
    return importedModules;
  }
}

function getTemplateId(path: string) {
  return relative(`${cwd()}/public`, path);
}

const PLUGIN_NAME = "vite-plugin-html-hmr";
export function htmlHmrPlugin(templateIds: Set<string>) {
  return {
    name: PLUGIN_NAME,
    async handleHotUpdate({ file, server, modules, read }: HmrContext) {
      const templateId = getTemplateId(file);
      if (templateIds.has(templateId)) {
        console.log(`[${PLUGIN_NAME}]: sending html-update for`, templateId);
        const content = await read();
        server.ws.send({
          type: "custom",
          event: "html-update",
          data: {
            id: templateId,
            content
          }
        });
        // Prevent full page reload
        return [new FakeModuleNode(file) as ModuleNode];
      }
      return modules;
    }
  };
}
