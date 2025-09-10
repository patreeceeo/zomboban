import { SystemWithQueries } from "../System";
import { State } from "../state";
import { EntityInspectorData } from "../state/dev_tools";
import { Entity, getEntityMeta } from "../Entity";
import { 
  IsActiveTag,
  IsGameEntityTag, 
  InSceneTag,
  CanDeleteTag,
  PressedTag,
  PlatformTag,
  ToggleableComponent,
  ServerIdComponent,
  BehaviorComponent,
  TransformComponent,
  SpriteComponent,
  AnimationComponent,
  ModelComponent,
  RenderOptionsComponent,
  HeadingDirectionComponent,
  TilePositionComponent,
  LevelIdComponent
} from "../components";
import {EntityForQueryResults} from "../Query";

const ALL_COMPONENTS = [
  IsActiveTag,
  InSceneTag,
  CanDeleteTag,
  PressedTag,
  PlatformTag,
  ToggleableComponent,
  ServerIdComponent,
  BehaviorComponent,
  TransformComponent,
  SpriteComponent,
  AnimationComponent,
  ModelComponent,
  RenderOptionsComponent,
  HeadingDirectionComponent,
  TilePositionComponent,
  LevelIdComponent
];


export class EntityInspectorSystem extends SystemWithQueries<State> {
  gameNtts = this.createQuery([IsGameEntityTag, LevelIdComponent]);
  start(state: State) {
    this.resources.push(
      this.gameNtts.stream((entity) => this.addEntity(entity, state)),
      this.gameNtts.onRemove((entity) => this.removeEntity(entity, state))
    );
  }
  addEntity(entity: EntityForQueryResults<typeof this.gameNtts>, state: State) {
    if(entity.levelId !== state.currentLevelId) {
      return; // Only add entities that belong to the current level
    }

    const componentNamesSet = new Set(state.devTools.componentNames);

    const entityMeta = getEntityMeta(entity);
    const entityData: EntityInspectorData = {
      entityId: entityMeta.id,
      componentData: {}
    };

    // Check each component type
    for (const Component of ALL_COMPONENTS) {
      if (Component.has(entity)) {
        const componentName = Component.toString();
        if (!componentNamesSet.has(componentName)) {
          componentNamesSet.add(componentName);
        }
        
        try {
          // Try to serialize the component data
          const serializedData = Component.serialize(entity as any, {})
          entityData.componentData[componentName] = serializedData;
        } catch (error) {
          entityData.componentData[componentName] = { error: `Failed to serialize: ${error}` };
        }
      }
    }

    // Directly set in the Map - this automatically replaces any existing entry
    state.devTools.entityData.set(entityMeta.id, entityData);
    state.devTools.componentNames = Array.from(componentNamesSet).sort();
  }

  removeEntity(entity: Entity, state: State) {
    const entityMeta = getEntityMeta(entity);
    // Simply delete from the Map
    state.devTools.entityData.delete(entityMeta.id);
    
    // Check if any component types are no longer used by efficiently checking if any entities still have each component
    state.devTools.componentNames = state.devTools.componentNames.filter(componentName => {
      // Find the component definition that matches this name
      const component = ALL_COMPONENTS.find(comp => comp.toString() === componentName);
      if (!component) return false;
      
      // Use world.getEntitiesWith to efficiently check if any entities still have this component
      return state.world.getEntitiesWith(component).size > 0;
    });
    
  }
}
