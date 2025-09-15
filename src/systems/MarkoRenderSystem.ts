import { SystemWithQueries } from "../System";
import { Mode, State } from "../state";
import {invariant} from "../Error";
import {BehaviorComponent, CursorTag, TransformComponent} from "../components";
import {JumpToMessage} from "../messages";

interface MountedComponent {
  instance: Marko.MountedTemplate<any>;
  template: any;
  placeholder: HTMLElement;
  templatePath: string;
}

export class MarkoRenderSystem extends SystemWithQueries<State> {
  private components = new Map<string, MountedComponent>();
  private watchedFiles = new Set<string>();

  private setupGlobalFileWatcher() {
    if (import.meta.hot) {
      console.log('[HMR] Setting up Marko HMR listener...');

      // Listen for our custom Marko template update event
      import.meta.hot.on('marko-template-updated', (data) => {
        console.log('[HMR] Received marko-template-updated event:', data);
        this.handleMarkoFileChange(data.file);
      });

      console.log('[HMR] Marko HMR listener set up');
    }
  }

  private handleMarkoFileChange(changedFilePath: string) {
    console.log('[HMR] Handling Marko file change:', changedFilePath);

    // Find matching components and reload them
    for (const [templatePath] of this.components) {
      // Match the file path - could be relative or absolute
      const normalizedTemplatePath = templatePath.replace('../', '').replace('./', '');
      const normalizedChangedPath = changedFilePath.replace(/.*\/src\//, '');

      if (normalizedChangedPath.includes(normalizedTemplatePath) ||
          normalizedTemplatePath.includes(normalizedChangedPath)) {
        console.log('[HMR] Reloading template:', templatePath);
        this.reloadTemplate(templatePath);
      } else {
        console.log('[HMR] No match for changed file:', changedFilePath, 'with template:', templatePath);
      }
    }
  }

  private async reloadTemplate(templatePath: string) {
    try {
      // Force reload the module with cache busting
      const newModule = await import(templatePath + '?t=' + Date.now());
      this.hotUpdateTemplate(templatePath, newModule.default);
    } catch (error) {
      console.error('[HMR] Failed to reload template:', error);
    }
  }

  private async loadTemplate(spec: string): Promise<Marko.Template<any>> {
    this.watchedFiles.add(spec);

    if (process.env.NODE_ENV === 'test') {
      // In test environment, use a mock
      return {
        mount: () => ({
          update: () => {},
          destroy: () => {}
        })
      } as unknown as Marko.Template<any>;
    } else {
      // Dynamically import the Marko template in non-test environments
      const module = await import(spec);
      return module.default;
    }
  }

  private hotUpdateTemplate(templatePath: string, newTemplate: Marko.Template<any>) {
    const component = this.components.get(templatePath);
    invariant(component !== undefined, `Component for template '${templatePath}' not found.`);
    console.log(`[HMR] Updating Marko template: ${templatePath}`);

    // Destroy old instance
    component.instance.destroy();

    // Mount new instance at the same location using the preserved placeholder
    const newInstance = newTemplate.mount({}, component.placeholder, "afterend");

    // Update our tracking
    component.instance = newInstance;
    component.template = newTemplate;
  }

  private async mountComponent(templatePath: string, placeholderId: string, initialProps: any = {}) {
    const template = await this.loadTemplate(templatePath);
    const placeholder = document.getElementById(placeholderId);

    invariant(placeholder !== null, `Placeholder element '${placeholderId}' not found.`);

    // Mount the component after the placeholder but keep the placeholder for HMR
    const instance = template.mount(initialProps, placeholder, "afterend");

    // Hide the placeholder but don't remove it - we need it for HMR mounting location
    placeholder.style.display = 'none';

    this.components.set(templatePath, {
      instance,
      template,
      placeholder,
      templatePath
    });

    return instance;
  }

  private updateComponent(templatePath: string, props: any) {
    const component = this.components.get(templatePath);
    invariant(component !== undefined, `Component '${templatePath}' is not mounted.`);
    component.instance.update(props);
  }

  private destroyComponent(templatePath: string) {
    const component = this.components.get(templatePath);
    invariant(component !== undefined, `Component '${templatePath}' is not mounted.`);
    component.instance.destroy();
    this.components.delete(templatePath);
  }

  #cursorNtts = this.createQuery([CursorTag, TransformComponent, BehaviorComponent]);
  
  async start(state: State) {
    this.setupGlobalFileWatcher();
    // Mount DevToolsPanel
    await this.mountComponent('../marko/DevToolsPanel.marko', 'dev-tools-placeholder');
    
    // Mount ToolbarSection with initial state
    await this.mountComponent('../marko/ToolbarSection.marko', 'toolbar-placeholder', {
      isSignedIn: state.isSignedIn,
      currentLevelId: state.currentLevelId,
      isPaused: state.time.isPaused,
      state: state
    });
  }
  
  update(state: State) {
    // Update DevToolsPanel
    this.updateComponent('../marko/DevToolsPanel.marko', {
      isOpen: state.devTools.isOpen,
      inspectorData: Array.from(state.devTools.entityData.values()),
      componentNames: state.devTools.componentNames,
      selectedEntityIds: Array.from(state.devTools.selectedEntityIds),
      onSelectEntity: (entityId: number) => {
        if(state.mode !== Mode.Edit) return;

        // Jump cursor to the selected entity
        for(const cursor of this.#cursorNtts) {
          const selectedEntity = state.world.getEntity(entityId) as any
          const behavior = state.behavior.get(cursor.behaviorId);
          behavior.onReceive(new JumpToMessage(selectedEntity), cursor, state);
        }
      }
    });
    
    // Update ToolbarSection
    this.updateComponent('../marko/ToolbarSection.marko', {
      isSignedIn: state.isSignedIn,
      currentLevelId: state.currentLevelId,
      isPaused: state.time.isPaused,
      state: state
    });
  }
  
  stop() {
    // Destroy all mounted components
    for (const [templatePath] of this.components) {
      this.destroyComponent(templatePath);
    }
  }
}
