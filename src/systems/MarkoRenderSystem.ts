import { SystemWithQueries } from "../System";
import { Mode, State } from "../state";
import {invariant} from "../Error";
import {BehaviorComponent, CursorTag, TransformComponent} from "../components";
import {JumpToMessage} from "../messages";


export class MarkoRenderSystem extends SystemWithQueries<State> {
  private container: HTMLElement | null = null;
  private component: Marko.MountedTemplate<any> | null = null;
  private template: any = null;
  
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

  #cursorNtts= this.createQuery([CursorTag, TransformComponent, BehaviorComponent]);
  
  async start() {
    this.template = await this.loadTemplate('../marko/DevToolsPanel.marko');
    
    this.container = document.getElementById('dev-tools-root');
    invariant(this.container !== null, "Container element not found.");
    
    this.component = this.template.mount({}, this.container);
  }
  
  update(state: State) {
    invariant(this.component !== null, "Marko component is not mounted.");
    this.component.update({
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
