import { System } from "../System";
import { State } from "../state";
import { Entity, getEntityMeta } from "../Entity";
import { 
  IsActiveTag,
  IsGameEntityTag, 
  InSceneTag,
  CursorTag,
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

const ALL_COMPONENTS = [
  IsActiveTag,
  IsGameEntityTag,
  InSceneTag,
  CursorTag,
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

interface EntityInspectorData {
  entityId: number;
  components: { [componentName: string]: any };
}

export class EntityInspectorSystem extends System<State> {
  start(state: State) {
    this.resources.push(
      state.world.entities.onAdd((entity) => this.addEntity(entity, state)),
      state.world.entities.onRemove((entity) => this.removeEntity(entity, state))
    );

    for(const component of ALL_COMPONENTS) {
      this.resources.push(component.onAdd((entity) => this.addEntity(entity, state)))
    }
  }
  addEntity(entity: Entity, state: State) {
    const entityDataById = new Map(state.devTools.entityData.map(e => [e.entityId, e]));
    const componentNamesSet = new Set(state.devTools.componentNames);

    const entityMeta = getEntityMeta(entity);
    const entityData: EntityInspectorData = {
      entityId: entityMeta.id,
      components: {}
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
          entityData.components[componentName] = serializedData;
        } catch (error) {
          entityData.components[componentName] = { error: 'Failed to serialize' };
        }
      }
    }

    entityDataById.set(entityMeta.id, entityData);
    state.devTools.entityData = Array.from(entityDataById.values());
    state.devTools.componentNames = Array.from(componentNamesSet).sort();
  }

  removeEntity(entity: Entity, state: State) {
    const entityMeta = getEntityMeta(entity);
    state.devTools.entityData = state.devTools.entityData.filter(e => e.entityId !== entityMeta.id);

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
