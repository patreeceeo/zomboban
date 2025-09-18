import { SystemWithQueries } from "../System";
import { State } from "../state";
import {invariant} from "../Error";
import {MARKO_TEMPLATES, IMarkoTemplateInfo} from "../marko";


type TemplateName = keyof typeof MARKO_TEMPLATES;

// Helper function to get template info with invariant checking
function getTemplateInfo(templateName: TemplateName): IMarkoTemplateInfo {
  const info = MARKO_TEMPLATES[templateName];
  invariant(info !== undefined, `Unknown template: ${templateName}. Available templates: ${Object.keys(MARKO_TEMPLATES).join(', ')}`);
  return info;
}

interface MountedComponent {
  instance: Marko.MountedTemplate<any>;
  template: any;
  placeholder: HTMLElement;
  templateName: string;
}

export class MarkoRenderSystem extends SystemWithQueries<State> {
  private components = new Map<TemplateName, MountedComponent>();
  private watchedFiles = new Set<string>();

  private setupGlobalFileWatcher() {
    if (import.meta.hot) {
      console.log('[HMR] Setting up Marko HMR listener...');

      // Listen for our custom Marko template update event
      import.meta.hot.on('marko-template-updated', (data) => {
        this.handleMarkoFileChange(data.file, data.affectedFiles);
      });
    }
  }

  private handleMarkoFileChange(changedFilePath: string, affectedFiles?: string[]) {
    console.log('[HMR] Handling Marko file change:', changedFilePath, 'affected files:', affectedFiles);

    // If we have affected files from the Vite plugin, use those
    const filesToCheck = affectedFiles || [changedFilePath];

    // Collect all templates that need reloading
    const templatesToReload = new Set<TemplateName>();

    for (const [templateName] of this.components) {
      const shouldReload = filesToCheck.some(filePath => {
        // Match the file path - could be relative or absolute
        const normalizedTemplatePath = templateName.replace('../', '').replace('./', '');
        const normalizedFilePath = filePath.replace(/.*\/src\//, '');

        const match = normalizedFilePath.includes(normalizedTemplatePath) ||
                     normalizedTemplatePath.includes(normalizedFilePath);

        if (match) {
          console.log('[HMR] Match found:', filePath, 'affects', templateName);
        }

        return match;
      });

      if (shouldReload) {
        templatesToReload.add(templateName);
      }
    }

    // Reload all affected templates in dependency order (children first, then parents)
    const reloadOrder = Array.from(templatesToReload).sort((a, b) => {
      // Simple heuristic: templates with fewer path segments are likely parents
      const aSegments = a.split('/').length;
      const bSegments = b.split('/').length;
      return bSegments - aSegments; // Children first
    });

    for (const templateName of reloadOrder) {
      console.log('[HMR] Reloading template:', templateName);
      this.reloadTemplate(templateName);
    }
  }

  private async reloadTemplate(templateName: TemplateName) {
    try {
      // Force reload the module with cache busting
      const timestamp = Date.now();
      const cacheBustQuery = `?v=${timestamp}`;

      // Use the same registry with cache busting for HMR
      const info = getTemplateInfo(templateName);
      const newModule = await info.loader(cacheBustQuery);
      this.hotUpdateTemplate(templateName, newModule.default);
    } catch (error) {
      console.error('[HMR] Failed to reload template:', error);
    }
  }

  private async loadTemplate(templateName: TemplateName): Promise<Marko.Template<any>> {
    this.watchedFiles.add(templateName);

    if (process.env.NODE_ENV === 'test') {
      // In test environment, use a mock
      return {
        mount: () => ({
          update: () => {},
          destroy: () => {}
        })
      } as unknown as Marko.Template<any>;
    } else {
      // Use the template registry for maintainable imports
      const info = getTemplateInfo(templateName);
      const module = await info.loader();
      return module.default;
    }
  }

  private hotUpdateTemplate(templateName: TemplateName, newTemplate: Marko.Template<any>) {
    const component = this.components.get(templateName);
    invariant(component !== undefined, `Component for template '${templateName}' not found.`);
    console.log(`[HMR] Updating Marko template: ${templateName}`);

    // Destroy old instance
    component.instance.destroy();

    // Mount new instance at the same location using the preserved placeholder
    const newInstance = newTemplate.mount({}, component.placeholder, "afterend");

    // Update our tracking
    component.instance = newInstance;
    component.template = newTemplate;
  }

  private async mountComponent(templateName: TemplateName) {
    const info = getTemplateInfo(templateName);
    const template = await this.loadTemplate(templateName);
    const placeholder = document.getElementById(info.placeholderId);

    invariant(placeholder !== null, `Placeholder element '${info.placeholderId}' not found.`);

    // Mount the component after the placeholder but keep the placeholder for HMR
    const instance = template.mount({}, placeholder, "afterend");

    // Hide the placeholder but don't remove it - we need it for HMR mounting location
    placeholder.style.display = 'none';

    this.components.set(templateName, {
      instance,
      template,
      placeholder,
      templateName
    });

    return instance;
  }

  private updateComponent(templateName: TemplateName, props: any) {
    const component = this.components.get(templateName);
    invariant(component !== undefined, `Component '${templateName}' is not mounted.`);
    component.instance.update(props);
  }

  private destroyComponent(templateName: TemplateName) {
    const component = this.components.get(templateName);
    invariant(component !== undefined, `Component '${templateName}' is not mounted.`);
    component.instance.destroy();
    this.components.delete(templateName);
  }

  
  async start() {
    this.setupGlobalFileWatcher();
    // Mount all registered templates
    for (const templateName of Object.keys(MARKO_TEMPLATES) as TemplateName[]) {
      await this.mountComponent(templateName);
    }
  }
  
  update(state: State) {
    // Update all mounted templates using their getProps functions
    for (const templateName of Object.keys(MARKO_TEMPLATES) as TemplateName[]) {
      const info = getTemplateInfo(templateName);
      this.updateComponent(templateName, info.getProps(state));
    }
  }
  
  stop() {
    // Destroy all mounted components
    for (const [templateName] of this.components) {
      this.destroyComponent(templateName);
    }
  }
}
