import { SystemWithQueries } from "../System";
import { Mode, State } from "../state";
import {invariant} from "../Error";
import {BehaviorComponent, CursorTag, TransformComponent} from "../components";
import {JumpToMessage} from "../messages";
import {gameRoute, menuRoute} from "../routes";

// Template registry with cache busting support
// To add a new template: add the path and import function here
const TEMPLATE_REGISTRY = {
  DevToolsPanel: (cacheBust?: string) =>
    cacheBust ? import('../marko/DevToolsPanel.marko' + cacheBust) : import('../marko/DevToolsPanel.marko'),
  ToolbarSection: (cacheBust?: string) =>
    cacheBust ? import('../marko/ToolbarSection.marko' + cacheBust) : import('../marko/ToolbarSection.marko'),
  SignInForm: (cacheBust?: string) =>
    cacheBust ? import('../marko/SignInForm.marko' + cacheBust) : import('../marko/SignInForm.marko'),
  MainMenu: (cacheBust?: string) =>
    cacheBust ? import('../marko/MainMenu.marko' + cacheBust) : import('../marko/MainMenu.marko'),
} as const;

type TemplateName = keyof typeof TEMPLATE_REGISTRY;

// Helper function to get a template loader with invariant checking
function getTemplateLoader(templateName: TemplateName) {
  const loader = TEMPLATE_REGISTRY[templateName];
  invariant(loader !== undefined, `Unknown template: ${templateName}. Available templates: ${Object.keys(TEMPLATE_REGISTRY).join(', ')}`);
  return loader;
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
      const loader = getTemplateLoader(templateName);
      const newModule = await loader(cacheBustQuery);
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
      const loader = getTemplateLoader(templateName);
      const module = await loader();
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

  private async mountComponent(templateName: TemplateName, placeholderId: string) {
    const template = await this.loadTemplate(templateName);
    const placeholder = document.getElementById(placeholderId);

    invariant(placeholder !== null, `Placeholder element '${placeholderId}' not found.`);

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

  #cursorNtts = this.createQuery([CursorTag, TransformComponent, BehaviorComponent]);
  
  async start() {
    this.setupGlobalFileWatcher();
    // Mount DevToolsPanel
    await this.mountComponent('DevToolsPanel', 'dev-tools-placeholder');

    // Mount ToolbarSection with initial state
    await this.mountComponent('ToolbarSection', 'toolbar-placeholder');

    // Mount SignInForm
    await this.mountComponent('SignInForm', 'sign-in-form-placeholder');

    // Mount MainMenu
    await this.mountComponent('MainMenu', 'main-menu-placeholder');
  }
  
  update(state: State) {
    // Update DevToolsPanel
    this.updateComponent('DevToolsPanel', {
      isOpen: state.devTools.isOpen,
      inspectorData: Array.from(state.devTools.entityData.values()),
      componentNames: state.devTools.componentNames,
      selectedEntityIds: Array.from(state.devTools.selectedEntityIds),
      currentLevelId: state.currentLevelId,
      onSelectEntity: (entityId: number) => {
        if(state.mode !== Mode.Edit) return;

        // Jump cursor to the selected entity
        for(const cursor of this.#cursorNtts) {
          const selectedEntity = state.world.getEntity(entityId) as any
          const behavior = state.behavior.get(cursor.behaviorId);
          behavior.onReceive(new JumpToMessage(selectedEntity), cursor, state);
        }
      },
      onLevelChange: (levelIndex: number) => {
        state.currentLevelId = levelIndex;
      },
      timeScale: state.time.timeScale,
      onTimeScaleChange: (value: number) => {
        state.time.timeScale = value;
      },
    });
    
    // Update ToolbarSection
    this.updateComponent('ToolbarSection', {
      isSignedIn: state.isSignedIn,
      currentLevelId: state.currentLevelId,
      isPaused: state.time.isPaused,
      state: state
    });

    // Update SignInForm
    this.updateComponent('SignInForm', {
      isOpen: state.isSignInFormOpen,
      onClose: () => {
        state.isSignInFormOpen = false;
      },
      onSignIn: () => {
        state.isSignedIn = true;
      }
    });

    // Update MainMenu
    this.updateComponent('MainMenu', {
      isVisible: state.route.current.equals(menuRoute),
      isAtStart: state.isAtStart,
      onNavigate: (route: string) => {
        if (route === 'game') {
          state.route.current = gameRoute;
        }
      }
    });
  }
  
  stop() {
    // Destroy all mounted components
    for (const [templateName] of this.components) {
      this.destroyComponent(templateName);
    }
  }
}
