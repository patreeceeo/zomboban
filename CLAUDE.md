# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Utilities
- `npm run graph-deps` - Generate dependency graphs for client, server, and Zui components
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

### Key Systems
Located in `src/systems/`:
- **ActionSystem** - Handles time-driven actions with seeking capability
- **BehaviorSystem** - Dynamic AI behavior loading and processing
- **RenderSystem** - 3D rendering with Three.js integration
- **InputSystem** - Comprehensive input handling (keyboard, mouse, touch)
- **RouterSystem** - Route-based system composition
- **TileSystem** - Spatial indexing with multi-tile entity occupancy
- **EditorSystem** - Command pattern with undo/redo functionality

### Frontend Architecture

**Zui Framework (`src/Zui/`)**
- Custom reactive UI framework similar to modern frontend frameworks
- Template interpolation and directive system
- Island architecture for component hydration
- Built-in directives: `z-show`, `z-hide`, `z-click`, `z-change`, `z-src`, etc.

**State Management**
- Mixin-based state composition allowing systems to declare dependencies
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
- Three.js integration for 3D graphics
- Sprite-based 2D assets
- GLTF model support

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

### State Mixins
Systems declare state dependencies through type intersections:
```typescript
type MySystemState = InputState & TimeState & EntityManagerState;
```

## File Structure

- `src/` - Main source code
  - `components/` - ECS component definitions
  - `systems/` - Game logic systems
  - `entities/` - Entity prefab definitions
  - `behaviors/` - AI behavior implementations
  - `Zui/` - Custom UI framework
  - `server/` - Express.js backend
- `public/` - Static assets (images, models, HTML templates)
- `tests/` - Test files
- `docs/` - Architecture documentation

## Testing
Tests use a custom test runner (`test.ts`) and are organized to match the source structure. Test files end with `.test.ts`.

## Build System
- Vite for frontend bundling
- TypeScript compilation
- Hot module replacement in development
- Concurrent development of client and server