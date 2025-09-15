import { SystemWithQueries } from "../System";
import { Mode, State } from "../state";
import {invariant} from "../Error";
import {BehaviorComponent, CursorTag, TransformComponent} from "../components";
import {JumpToMessage} from "../messages";

interface MountedComponent {
  instance: Marko.MountedTemplate<any>;
  template: any;
  placeholderId: string;
}

export class MarkoRenderSystem extends SystemWithQueries<State> {
  private components = new Map<string, MountedComponent>();
  
  private async loadTemplate(spec: string) {
    if (process.env.NODE_ENV === 'test') {
      // In test environment, use a mock
      return {
        mount: () => ({
          update: () => {},
          destroy: () => {}
        })
      };
    } else {
      // Dynamically import the Marko template in non-test environments
      const module = await import(spec);
      return module.default;
    }
  }

  private async mountComponent(templatePath: string, placeholderId: string, initialProps: any = {}) {
    const template = await this.loadTemplate(templatePath);
    const placeholder = document.getElementById(placeholderId);
    
    invariant(placeholder !== null, `Placeholder element '${placeholderId}' not found.`);
    
    const instance = template.mount(initialProps, placeholder, "beforebegin");
    placeholder.remove();
    
    this.components.set(templatePath, {
      instance,
      template,
      placeholderId
    });
    
    return instance;
  }

  private updateComponent(templatePath: string, props: any) {
    const component = this.components.get(templatePath);
    invariant(component !== null, `Component '${templatePath}' is not mounted.`);
    component?.instance.update(props);
  }

  private destroyComponent(templatePath: string) {
    const component = this.components.get(templatePath);
    if (component) {
      component.instance.destroy();
      this.components.delete(templatePath);
    }
  }

  #cursorNtts = this.createQuery([CursorTag, TransformComponent, BehaviorComponent]);
  
  async start(state: State) {
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
