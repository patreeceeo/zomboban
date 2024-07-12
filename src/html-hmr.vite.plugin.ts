import { HmrContext, ModuleNode } from "vite";
import { FileTemplateLoader, HypermediaServer } from "./Hypermedia";
import path from "path";
import { cwd } from "process";
import { setupHypermedia } from "./common";
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

const templateLoader = new FileTemplateLoader();
const hypermediaServer = new HypermediaServer(templateLoader);
setupHypermedia(hypermediaServer);

export function htmlHmrPlugin() {
  return {
    name: "vite-plugin-html-hmr",
    async handleHotUpdate({ file, server, modules, read }: HmrContext) {
      const templateId = path.relative(cwd(), file);
      const endpointIds = Array.from(
        hypermediaServer.lookupEndpointIds(templateId)
      );
      if (endpointIds.length > 0) {
        const content = await read();
        for (const endpointId of endpointIds) {
          server.ws.send({
            type: "custom",
            event: "html-update",
            data: {
              id: endpointId,
              content
            }
          });
        }
        // Prevent full page reload
        return [new FakeModuleNode(file) as ModuleNode];
      }
      // Return the modules to let Vite handle other files normally
      return modules;
    }
  };
}
