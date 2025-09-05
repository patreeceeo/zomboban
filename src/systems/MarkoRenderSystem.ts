import { System } from "../System";
import { State } from "../state";
import {invariant} from "../Error";


export class MarkoRenderSystem extends System<State> {
  private container: HTMLElement | null = null;
  private component: Marko.MountedTemplate<any> | null = null;
  private template: any = null;
  
  private async loadTemplate() {
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
      const module = await import('../marko/EntityInspector.marko');
      return module.default;
    }
  }
  
  async start() {
    this.template = await this.loadTemplate();
    
    this.container = document.getElementById('entity-inspector-root');
    invariant(this.container !== null, "Container element not found.");
    
    this.component = this.template.mount({}, this.container);
  }
  
  update(state: State) {
    invariant(this.component !== null, "Marko component is not mounted.");
    this.component.update({
      inspectorData: Array.from(state.devTools.entityData.values()),
      componentNames: state.devTools.componentNames,
      selectedEntityId: state.devTools.selectedEntityId,
      onSelectEntity: (entityId: number) => {
        state.devTools.selectedEntityId = entityId;
      }
    });
  }
  
  stop() {
    // Destroy the mounted template
    invariant(this.component !== null, "Marko component is not mounted.");
    this.component.destroy();
    this.component = null;
    
    // Clean up container
    this.container = null;
  }
}
