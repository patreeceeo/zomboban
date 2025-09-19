# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overall Guidance

Approach everything like a senior engineer. Do not make assumptions. Ask clarifying questions. Try to eliminate all ambiguity before writing code.

Break problems down into their smallest meaningful sub-problems. Consider all possible solutions using step-by-step reasoning and the wisdom of other engineers.

When writing code, follow the existing style and conventions of the codebase. Write clean, maintainable, well-tested code. Include comments and documentation where appropriate.

Think about the intended limits and constraints of the system. If the value of a variable is out of range, throw an error. Do not complicate the program's logic to handle cases that are exceptions to the intended limits. Just throw an error. For example, suppose a variable myObj is supposed to be defined, write:

```typescript
invariant(myObj !== undefined, 'My Object is undefined!');
myObj.myMethod();
```

Do not write:

```typescript
if(myObj) {
  myObj.myMethod();
}
```

Most importantly, do not make assumptions! Verify ideas early and enlist the user's help where necessary.

## Development Commands

### Core Development
- `npm run dev` - Start development servers (runs both client and API server concurrently)
- `npm run dev-vite` - Start only the Vite development server on port 3000
- `npm run dev-api` - Start only the API server on port 3001
- `npm run build` - Build the project (TypeScript compilation + Vite build)
- `npm run serve` - Start production server
- `npm run preview` - Preview the built application

### Testing and Quality
- `npm run test` - Run tests
- `npm run test-dev` - Run tests in watch mode with nodemon
- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm run bench` - Run performance benchmarks

### Storybook
- `npm run storybook` - Start Storybook development server
- `npm run build-storybook` - Build static Storybook site

### Utilities
- `npm run graph-deps` - Generate dependency graphs for client, server, and components
- `npm run signUp` - User registration utility

## Architecture Overview

### Core ECS Architecture
Zomboban implements a sophisticated Entity-Component-System (ECS) architecture with several key components:

**Entity Management (`EntityManager.ts`)**
- `World` class manages entity lifecycle and component registration
- Entities are composed of components dynamically
- Automatic cleanup when entities are removed

**Component System (`Component.ts`)**
- Components are defined using `defineComponent()` function
- Support for serialization/deserialization of component data
- Observable component collections for reactive updates
- Type-safe component composition

**System Management (`System.ts`)**
- Base `System<Context>` class for game logic systems
- `SystemWithQueries<Context>` extends systems with entity querying capabilities
- `SystemManager` handles system lifecycle, ordering, and updates
- Mixin-based state composition through context types

### Entity Lifecycle Management

**Entity Types**
- **Static Entities**: Hard coded entities that are not persisted
- **Dynamic Entities**: Have `ServerIdComponent`, persist across sessions, synchronized with server
- **Identification**: Dynamic entities tracked via `state.dynamicEntities` query

**Entity Creation**

*Client-Side Process:*
1. **Basic Creation**: `world.addEntity()` creates entity with unique ID in client world
2. **Component Addition**: Components added via `Component.add(entity, data?)`
3. **Prefab Instantiation**: Entity prefabs (in `src/entities/`) create reusable templates
4. **Dynamic Marking**: Add `ServerIdComponent` to make entity persistent

*Server Interaction:*
1. **Auto-Sync**: Client automatically sends dynamic entities to server via REST API
2. **Server Assignment**: Server assigns permanent `serverId` and stores entity JSON
3. **Client Update**: Server responds with `serverId`, client updates local entity
4. **Persistence**: Server stores entity as JSON file in filesystem

**Entity Persistence**

*Serialization Process:*
1. **Component Serialization**: Each component implements `serialize(entity, target)` method
2. **Entity JSON**: Complete entity state serialized to JSON including all component data

*Client-Server Sync:*
1. **Change Detection**: Client tracks modifications to dynamic entities
2. **Batch Updates**: `NetworkedEntityClient` batches entity changes for efficient sync
3. **REST API**: PUT requests to `/api/entities/:serverId` update server state
4. **Conflict Resolution**: Server state takes precedence in case of conflicts

**Entity Retrieval**

*Client Queries:*
1. **ECS Queries**: `world.query([ComponentA, ComponentB])` for real-time entity sets
2. **Component Queries**: `world.getEntitiesWith(component)` for specific component types
3. **Reactive Updates**: Queries automatically update when entities gain/lose components

*Server Loading:*
1. **Startup Process**: `state.client.load(state)` fetches all dynamic entities on app start
2. **Deserialization**: Server JSON converted back to entities via component `deserialize()` methods
3. **Component Restoration**: Each component's `deserialize(entity, data)` restores component state
4. **World Population**: Deserialized entities added to client world with original `serverId`

**Entity Deletion**

*Client-Side Process:*
1. **Component Removal**: `world.removeEntity(entity)` removes all components automatically
2. **Query Updates**: Entity removal immediately updates all affected queries
3. **Memory Cleanup**: Entity references cleaned up from all tracking collections

*Server Sync (Dynamic Entities):*
1. **Delete Request**: Client sends DELETE request to `/api/entities/:serverId`
2. **Server Cleanup**: Server removes entity JSON file from filesystem
3. **Permanent Removal**: Entity no longer exists on server, won't be loaded in future sessions

**Client-Server Architecture**

*NetworkedEntityClient (`src/NetworkedEntityClient.ts`):*
- Handles all client-server entity synchronization
- Manages batch updates and API communication
- Tracks entity state changes for efficient syncing

*Server API (`src/server/`):*
- REST endpoints for entity CRUD operations
- File-based persistence (entities stored as JSON files)
- Session management for user-specific entity collections
- Authentication via Passport.js with session storage

*Synchronization Flow:*
1. Client creates/modifies dynamic entity
2. `NetworkedEntityClient` detects change and queues sync
3. Batch API request sent to server (POST/PUT/DELETE)
4. Server validates, persists, and responds with confirmation
5. Client updates local tracking state

### Key Systems
Located in `src/systems/`:

**Core Game Systems**
- **GameSystem** - Manages entities with IsGameEntityTag
- **ActionSystem** - Handles time-driven actions with seeking capability
- **BehaviorSystem** - Dynamic AI behavior loading and processing
- **TileSystem** - Spatial indexing with multi-tile entity occupancy

**Rendering Systems**
- **RenderSystem** - 3D rendering with Three.js integration
- **MarkoRenderSystem** - Marko.js template rendering with HMR support
- **AnimationSystem** - Animation mixer state management
- **ModelSystem** - GLTF model loading and management

**Editor & DevTools**
- **EditorSystem** - Command pattern with undo/redo functionality
- **EntityInspectorSystem** - Entity debugging and visualization

**Infrastructure Systems**
- **InputSystem** - Comprehensive input handling (keyboard, mouse, touch)
- **RouterSystem** - Advanced routing with guards, permissions, and dynamic system loading
- **LoadingSystem** - Asset loading with progress tracking
- **SceneManagerSystem** - Scene lifecycle and transitions

### Frontend Architecture

**Marko.js UI Framework**
- Client-side rendering support
- Template registry with dynamic loading
- Props-based reactivity system
- Component mounting and unmounting lifecycle
- Built-in Hot Module Replacement (HMR) support

**Hot Module Replacement (HMR)**
- Sophisticated Marko template HMR system in `MarkoRenderSystem`
- Template dependency tracking and reloading
- File watching with automatic cache busting
- Development-only feature with production optimizations

**State Management**
- Modular state composition with specialized state classes:
  - `TimeState` - Time and delta management
  - `RenderState` - Rendering context and camera
  - `BehaviorState` - AI behavior management
  - `RouteState` - Routing and navigation
  - `InputState` - Input device states
  - `DevToolsState` - Development tools visibility
  - `EditorState` - Editor mode and commands
  - `TextureState` - Texture asset management
  - `ModelState` - 3D model management
- Observable state changes for reactive updates
- Centralized state in `src/state/`

### Backend Architecture
**Express Server (`src/server/`)**
- RESTful API for entity persistence
- Passport.js authentication with session management
- File-based session storage
- Entity synchronization between client and server

### Asset Management
- **AssetLoader** - Handles texture and 3D model loading
- **ModelSystem** - GLTF model loading with Three.js
- **TextureState** - Texture caching and management
- Asset ID enumeration system for type safety
- Sprite-based 2D assets support

### Router System
Advanced routing implementation with:
- Hash-based routing with browser history integration
- Route guards and permission system
- Dynamic system loading/unloading based on routes
- Nested route support
- Route parameter extraction

## Development Patterns

### Component Creation
```typescript
const MyComponent = defineComponent(class {
  value = 0;
  static deserialize(entity: any, data: {value: number}) {
    entity.value = data.value;
  }
  static serialize(entity: any) {
    return { value: entity.value };
  }
});
```

### System Creation
```typescript
class MySystem extends SystemWithQueries<QueryState & TimeState> {
  query = this.createQuery([MyComponent]);

  update(state: QueryState & TimeState) {
    for (const entity of this.query.entities) {
      // Process entities with MyComponent
    }
  }
}
```

### Marko Template Usage
```marko
<div>
  <if(state.isLoading)>
    <loading-spinner/>
  </if>
  <else>
    <game-content ...props/>
  </else>
</div>
```

## File Structure

- `src/` - Main source code
  - `components/` - ECS component definitions
  - `systems/` - Game logic systems
  - `entities/` - Entity prefab definitions
  - `behaviors/` - AI behavior implementations
  - `marko/` - Marko.js UI templates
  - `server/` - Express.js backend
  - `state/` - State management classes
  - `actions/` - Action pattern implementations
  - `collections/` - Data structure implementations
  - `functions/` - Utility functions
  - `units/` - Unit definitions
  - `fs/` - File system utilities
  - `stories/` - Storybook stories
- `public/` - Static assets (images, models, etc.)
- `tests/` - Test files
- `docs/` - Architecture documentation

## Testing
Tests use a custom test runner (`test.ts`) that dynamically imports test files via glob patterns. Test files end with `.test.ts` and are organized to match the source structure.

## Build System
- Vite for frontend bundling with HMR support
- TypeScript compilation with strict type checking
- Marko.js integration for template compilation
- Hot module replacement in development
- Concurrent development of client and server
- Storybook for component development and testing

## Development Tools
- Entity Inspector for debugging entity state
- Development tools panel with Marko templates
- Component visualization and selection tools
- Storybook for isolated component development
- Dependency graph generation for architecture visualization

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
