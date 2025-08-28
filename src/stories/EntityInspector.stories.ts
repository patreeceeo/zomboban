import {Meta, StoryObj} from "@storybook/html-vite"
import {start} from "../Zomboban";
import {State} from "../state";
import {EntityInspectorSystem, MarkoRenderSystem} from "../systems";
import {
  TransformComponent,
  BehaviorComponent,
  ModelComponent,
  TilePositionComponent,
  IsActiveTag,
  IsGameEntityTag,
  ServerIdComponent,
  HeadingDirectionComponent
} from "../components";
import {BehaviorEnum} from "../behaviors";
import {HeadingDirectionValue} from "../HeadingDirection";

// Entity creation functions for random selection
function createPlayerEntity(state: State) {
  const entity = state.world.addEntity();
  TransformComponent.add(entity, {
    transform: {
      position: { x: Math.random() * 5, y: 0, z: Math.random() * 5 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visible: true
    }
  });
  BehaviorComponent.add(entity, { behaviorId: BehaviorEnum.Player });
  ModelComponent.add(entity, { modelId: "/assets/models/player.glb" });
  TilePositionComponent.add(entity, {
    tilePosition: { x: Math.floor(Math.random() * 3), y: 0, z: Math.floor(Math.random() * 3) }
  });
  HeadingDirectionComponent.add(entity, { headingDirection: HeadingDirectionValue.Down });
  IsGameEntityTag.add(entity);
  return entity;
}

function createWallEntity(state: State) {
  const entity = state.world.addEntity();
  TransformComponent.add(entity, {
    transform: {
      position: { x: Math.random() * 5, y: 0, z: Math.random() * 5 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visible: true
    }
  });
  BehaviorComponent.add(entity, { behaviorId: BehaviorEnum.Wall });
  ModelComponent.add(entity, { modelId: "/assets/models/wall.glb" });
  TilePositionComponent.add(entity, {
    tilePosition: { x: Math.floor(Math.random() * 3), y: 0, z: Math.floor(Math.random() * 3) }
  });
  return entity;
}

function createActiveEntity(state: State) {
  const entity = state.world.addEntity();
  IsActiveTag.add(entity);
  TransformComponent.add(entity, {
    transform: {
      position: { x: Math.random() * 5, y: 0, z: Math.random() * 5 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visible: true
    }
  });
  return entity;
}

function createServerEntity(state: State) {
  const entity = state.world.addEntity();
  ServerIdComponent.add(entity, { serverId: Math.floor(Math.random() * 1000) });
  IsGameEntityTag.add(entity);
  TilePositionComponent.add(entity, {
    tilePosition: { x: Math.floor(Math.random() * 3), y: 0, z: Math.floor(Math.random() * 3) }
  });
  return entity;
}

const entityCreators = [createPlayerEntity, createWallEntity, createActiveEntity, createServerEntity];

export default {
  title: "Dev Tools/Entity Inspector",
  render: (args) => {
    const container = document.createElement('div');
    
    // Create controls section
    const controlsDiv = document.createElement('div');
    
    const addButton = document.createElement('button');
    addButton.textContent = 'Add Random Entity';
    addButton.style.marginRight = '10px';
    addButton.style.padding = '5px 10px';
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Random Entity';
    deleteButton.style.padding = '5px 10px';
    
    controlsDiv.appendChild(addButton);
    controlsDiv.appendChild(deleteButton);
    container.appendChild(controlsDiv);
    
    // Create the entity inspector root element
    const inspectorRoot = document.createElement('div');
    inspectorRoot.id = 'entity-inspector-root';
    container.appendChild(inspectorRoot);
    
    const state = new State();
    
    state.systemManager.push(
      EntityInspectorSystem,
      MarkoRenderSystem
    );

    start(state);
    
    // Handle control actions
    const addRandomEntity = () => {
      const randomCreator = entityCreators[Math.floor(Math.random() * entityCreators.length)];
      randomCreator(state);
    };
    
    const deleteRandomEntity = () => {
      const entities = Array.from(state.world.entities);
      if (entities.length > 0) {
        const randomEntity = entities[Math.floor(Math.random() * entities.length)];
        console.log(`removing ${randomEntity}`);
        state.world.removeEntity(randomEntity);
      }
    };
    
    // Set up button event listeners
    addButton.addEventListener('click', addRandomEntity);
    deleteButton.addEventListener('click', deleteRandomEntity);
    
    return container;
  }
} satisfies Meta;

type Story = StoryObj<any>;

export const EntityInspector: Story = {
  args: {}
}
