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
  HeadingDirectionComponent,
  LevelIdComponent
} from "../components";
import {BehaviorEnum} from "../behaviors";
import {HeadingDirectionValue} from "../HeadingDirection";
import {el} from "../util";

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
  LevelIdComponent.add(entity, { levelId: 0 });
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
  LevelIdComponent.add(entity, { levelId: 0 });
  IsGameEntityTag.add(entity);
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
  LevelIdComponent.add(entity, { levelId: 0 });
  IsGameEntityTag.add(entity);
  return entity;
}

function createServerEntity(state: State) {
  const entity = state.world.addEntity();
  ServerIdComponent.add(entity, { serverId: Math.floor(Math.random() * 1000) });
  TilePositionComponent.add(entity, {
    tilePosition: { x: Math.floor(Math.random() * 3), y: 0, z: Math.floor(Math.random() * 3) }
  });
  LevelIdComponent.add(entity, { levelId: 0 });
  IsGameEntityTag.add(entity);
  return entity;
}

const entityCreators = [createPlayerEntity, createWallEntity, createActiveEntity, createServerEntity];

export default {
  title: "Dev Tools/Entity Inspector",
  render: () => {
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
        state.world.removeEntity(randomEntity);
      }
    };
    
    // Create UI using el() function
    return el('div', {}, [
      el('div', {
        style: { 
          padding: '10px', 
          borderBottom: '1px solid #ccc', 
          backgroundColor: '#f9f9f9' 
        }
      }, [
        el('button', {
          onClick: addRandomEntity,
          style: { marginRight: '10px', padding: '5px 10px' }
        }, ['Add Random Entity']),
        el('button', {
          onClick: deleteRandomEntity,
          style: { padding: '5px 10px' }
        }, ['Delete Random Entity'])
      ]),
      el('div', { id: 'entity-inspector-root' })
    ]);
  }
} satisfies Meta;

type Story = StoryObj<any>;

export const EntityInspector: Story = {
  args: {}
}
