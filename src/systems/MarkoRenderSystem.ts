import { SystemWithQueries } from "../System";
import { Mode, State } from "../state";
import {invariant} from "../Error";
import {BehaviorComponent, CursorTag, TransformComponent} from "../components";
import {JumpToMessage} from "../messages";


export class MarkoRenderSystem extends SystemWithQueries<State> {
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

  #cursorNtts= this.createQuery([CursorTag, TransformComponent, BehaviorComponent]);
  
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
        if(state.mode !== Mode.Edit) return;

        state.devTools.selectedEntityId = entityId;

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
