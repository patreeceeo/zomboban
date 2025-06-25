# Systems Architecture in Zomboban

This article examines the systems architecture in Zomboban, a tile-based puzzle game implementing a sophisticated Entity-Component-System (ECS) pattern with mixin-based state management.

## Core Architecture Patterns

### Hierarchical System Design

The architecture centers around two base classes:

- **`System<Context>`**: Provides lifecycle methods (`start()`, `update()`, `stop()`), resource management, and service registration
- **`SystemWithQueries<Context>`**: Extends the base system with entity query capabilities for component-based filtering

This hierarchy enables both pure data processing systems and entity-centric game logic systems within the same framework.

### State Composition via Mixins

Systems declare their dependencies through type parameters, creating a dependency injection pattern:

```typescript
type Context = QueryState & RendererState & TimeState;
```

The state system composes functionality from focused mixins (e.g., `InputState`, `BehaviorState`), allowing systems to access only the state they need.

## System Pattern Analysis

### Resource Management Pattern

Most systems follow a consistent resource management pattern where event handlers, queries, and other resources are automatically cleaned up:

```typescript
start(state: Context) {
  this.resources.push(
    this.query.onRemove(this.handleRemove),
    this.query.stream(this.handleAdd)
  );
}
```

This pattern prevents memory leaks and ensures clean system transitions.

### Dynamic Loading and Strategy Patterns

**BehaviorSystem** implements dynamic behavior loading where AI logic is loaded at runtime and cached. This enables hot module replacement and modular entity behavior:

```typescript
// Behaviors are loaded dynamically and cached
getBehavior(id: BehaviorEnum): Behavior<any, any>
```

**RouterSystem** takes this further by creating entire system classes at runtime, allowing for dynamic system composition based on application routes.

### Spatial Indexing and Multi-Occupancy

**TileSystem** implements a unique spatial indexing pattern where entities can occupy multiple tiles simultaneously. This solves collision detection race conditions in tile-based movement:

```typescript
// Entity occupies all tiles it spans when between tile boundaries
for (let tileX = tileXMin; tileX <= tileXMax; tileX++) {
  for (let tileY = tileYMin; tileY <= tileYMax; tileY++) {
    tiles.setRegularNtt(tileX, tileY, 0, entity);
  }
}
```

### Phased Update Processing

**BehaviorSystem** implements a unique two-phase update pattern:
1. **Early Phase**: Message sending and initial processing
2. **Late Phase**: Action generation and response handling

This prevents timing issues in entity interactions and ensures deterministic behavior ordering.

### Command Pattern with Async Execution

**EditorSystem** implements a full command pattern with async execution, undo/redo stacks, and error handling:

```typescript
// Commands are queued and executed asynchronously
addCommand(state: IEditorState, command: EditorCommand): void
```

This pattern enables complex editor operations while maintaining undo history and error recovery.

### Debug Visualization Integration

**RenderSystem** includes integrated debug visualization that can be toggled at runtime. This pattern embeds debugging tools directly into the rendering pipeline rather than requiring separate debug systems.

## Unique System Characteristics

- **ActionSystem**: Queue-based time-driven action processing with seeking capability for time travel
- **InputSystem**: Comprehensive input aggregation (keyboard, mouse, touch) with timing and combo support
- **ModelSystem**: Factory pattern with sophisticated model caching and animation mixer management
- **TileSystem**: Multi-tile entity occupancy for robust collision detection

## SystemManager Orchestration

The `SystemManager` provides runtime system composition capabilities:

- **Dynamic Loading**: Systems can be added/removed during execution
- **Execution Ordering**: Systems can be reordered and inserted at specific positions  
- **Service Processing**: Separate update loop for background services
- **Resource Cleanup**: Automatic cleanup when systems are removed

This enables the router-driven system composition where different application routes activate different system combinations.

## Areas for Improvement

### System Dependencies and Ordering

Currently, system execution order is managed manually through insertion order. The architecture could benefit from:

1. **Dependency Declaration**: Systems could declare dependencies on other systems
2. **Automatic Ordering**: SystemManager could automatically order systems based on dependencies
3. **Dependency Injection**: Systems could receive references to required systems rather than accessing shared state

### Query Performance

While the current query system is functional, it could be enhanced with:

1. **Query Caching**: Cache query results when component sets haven't changed
2. **Index-Based Queries**: Pre-computed indices for common query patterns
3. **Query Composition**: Allow systems to compose complex queries from simpler ones

### State Type Safety

The mixin-based state system could be strengthened with:

1. **State Validation**: Runtime validation that systems receive required state mixins
2. **State Isolation**: Prevent systems from accidentally modifying state they don't own
3. **State Change Notifications**: Allow systems to react to specific state changes

### System Communication

Currently, systems communicate primarily through shared state. The architecture could benefit from:

1. **System Events**: Direct event passing between systems
2. **System Services**: Formal service interfaces that systems can provide to others
3. **System Lifecycle Hooks**: Allow systems to react to other systems starting/stopping

These improvements would enhance the modularity, performance, and maintainability of the systems architecture while preserving its dynamic and flexible nature.
