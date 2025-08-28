import { System } from "../System";
import { State } from "../state";
import EntityInspectorTemplate from '../marko/EntityInspector.marko';
import {invariant} from "../Error";


export class MarkoRenderSystem extends System<State> {
  private container: HTMLElement | null = null;
  private component: Marko.MountedTemplate<any> | null = null;
  
  start() {
    this.container = document.getElementById('entity-inspector-root');
    invariant(this.container !== null, "Container element not found.");
    
    this.component = EntityInspectorTemplate.mount({}, this.container);
  }
  
  update(state: State) {
    if(state.devTools.reactDirty) {
      state.devTools.reactDirty = false;
      
      invariant(this.component !== null, "Marko component is not mounted.");
      this.component.update({
        inspectorData: state.devTools.entityData,
        componentNames: state.devTools.componentNames
      });
    }
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
