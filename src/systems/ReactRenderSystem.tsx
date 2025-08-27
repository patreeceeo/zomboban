import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { System } from "../System";
import { State } from "../state";
import { EntityInspector } from '../components/react/EntityInspector';

export class ReactRenderSystem extends System<State> {
  private root: Root | null = null;
  private container: HTMLElement | null = null;
  
  start(state: State) {
    // Create or find the container for React
    this.container = document.getElementById('entity-inspector-root');
    if (!this.container) {
      // If container doesn't exist, create it
      this.container = document.createElement('div');
      this.container.id = 'entity-inspector-root';
      document.body.appendChild(this.container);
    }
    
    // Create React root and render
    this.root = createRoot(this.container);
    this.render(state);
  }
  
  update(state: State) {
    if(state.devTools.reactDirty) {
      state.devTools.reactDirty = false;
      this.render(state);
    }
  }
  
  render(state: State) {
    if (this.root) {
      this.root.render(
        <EntityInspector 
          inspectorData={state.devTools.entityData}
          componentNames={state.devTools.componentNames}
        />
      );
    }
  }
  
  stop() {
    // Clean up React when system stops
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }
}
