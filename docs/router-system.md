# RouterSystem: Dynamic System Orchestration and Navigation

## Overview

RouterSystem implements a unique architectural pattern that dynamically composes system configurations based on client-side routes. Unlike traditional routers that manage component rendering, RouterSystem manages which **systems** are active in the ECS architecture, effectively creating different "modes" of the application through system orchestration.

## Architecture Patterns

### Factory Pattern with Closure

The RouterSystem uses a factory function pattern that captures dependencies via closure:

```typescript
export function createRouterSystem(
  routes: RouteSystemRegistery<any>, 
  theDocument: Pick<Document, "onclick">
) {
  return class RouterSystem extends System<Context> {
    // Implementation captures routes and theDocument in closure
  };
}
```

This design enables:
- **Dependency Injection**: Route configuration and DOM document are injected at creation time
- **Testability**: Mock documents can be injected for testing
- **Immutable Configuration**: Route configuration is captured and cannot be modified after system creation

### Dynamic System Lifecycle Management

RouterSystem manages other systems' lifecycles through three key operations:

1. **System Removal**: Stop and remove systems no longer needed for the current route
2. **System Addition**: Start and insert new systems required by the current route  
3. **System Reordering**: Ensure systems execute in the correct order

```typescript
updateSystems(state: Context) {
  // Stop systems from previous route not in current route
  for (const id of previousRouteSystems) {
    if (!currentRouteSystems.has(id)) {
      const ctor = registeredSystems.get(id);
      mgr.remove(ctor);
    }
  }

  // Start systems for current route, maintaining order
  let index = 1; // RouterSystem is always index 0
  for (const id of currentRouteSystems) {
    const ctor = registeredSystems.get(id);
    if (!previousRouteSystems.has(id)) {
      mgr.insert(ctor, index);
    } else {
      mgr.reorder(ctor, index); // Maintain correct order
    }
    index++;
  }
}
```

## Route-System Mapping Architecture

### RouteSystemRegistery

The `RouteSystemRegistery<State>` class maps route hashes to system configurations:

```typescript
class RouteSystemRegistery<State> {
  #data = {} as Record<string, {
    systems: Set<SystemEnum>, 
    guard: (state: State) => boolean
  }>;
}
```

**Key Design Decisions:**

- **Hash-Based Routing**: Only the hash fragment is used for system mapping, ignoring pathname/search
- **Set-Based Storage**: System lists are stored as Sets for efficient membership testing
- **Guard Functions**: Routes can have access control via state-dependent guard functions
- **Type-Safe State**: Generic `State` type ensures guard functions receive properly typed state

### Route Configuration Example

```typescript
ROUTES.register(gameRoute, [...BASIC_SYSTEMS, SystemEnum.Game])
  .registerWithGuard(editorRoute, [...BASIC_SYSTEMS, SystemEnum.Editor], 
    (state) => state.isSignedIn)
  .register(menuRoute, [SystemEnum.Loading])
```

This creates distinct application modes:
- **Game Mode**: Full game systems + game-specific logic
- **Editor Mode**: Full game systems + editor tools (requires authentication)
- **Menu Mode**: Minimal loading system only

## Navigation Integration

### Click Handler Implementation

RouterSystem intercepts all document clicks and handles internal navigation:

```typescript
theDocument.onclick = (e) => {
  const anchorEl = findParentAnchor(e.target as HTMLElement);
  if (anchorEl !== null && isInternalLink(anchorEl)) {
    e.preventDefault();
    location.href = anchorEl.href;
    this.syncCurrentRouteWithLocation(state);
  }
};
```

**Implementation Details:**

- **Bubble-Up Search**: Finds parent anchor elements via DOM traversal
- **Internal Link Detection**: Only handles links within the same origin and pathname
- **Programmatic Navigation**: Updates `location.href` and synchronizes state immediately
- **Single Handler**: One global click handler eliminates need for per-link event management

### Service-Based Location Synchronization

RouterSystem registers a service that continuously monitors location changes:

```typescript
services = [{
  update: (state: Context) => {
    this.syncCurrentRouteWithLocation(state);
  }
}];
```

This handles:
- **Browser Navigation**: Back/forward button support
- **External Navigation**: Direct URL changes or programmatic navigation from other code
- **Route Guards**: Redirects unauthorized routes to allowed routes

## State Synchronization Patterns

### Bidirectional Route-Location Sync

The system maintains synchronization between three route representations:

1. **Application State**: `state.currentRoute` (authoritative for system configuration)
2. **Browser Location**: `location.href` (authoritative for user navigation)
3. **Route Registry**: `routes` (defines available routes and their systems)

```typescript
syncCurrentRouteWithLocation(state: Context) {
  if (!state.currentRoute.test(location)) {
    const route = RouteId.fromLocation();
    if (routes.has(route)) {
      if(routes.allows(state, route)) {
        state.currentRoute = route;
      } else {
        state.currentRoute.follow(); // Redirect to current authorized route
      }
    } else {
      state.defaultRoute.follow(); // Redirect to default route
    }
  }
}
```

### Route Guard Enforcement

Route guards are enforced at multiple points:

1. **Initial Sync**: When location changes don't match current route
2. **Update Cycle**: Continuous verification during system updates
3. **Route Changes**: Before applying new route configurations

```typescript
update(state: Context) {
  // Continuous guard enforcement
  if(!routes.allows(state, state.currentRoute)) {
    state.currentRoute = state.defaultRoute;
  }

  // Apply changes if route changed
  if (!this.#previousRoute.equals(state.currentRoute)) {
    this.updateSystems(state);
    this.#previousRoute = state.currentRoute;
  }
}
```

## System Ordering and Execution

### Deterministic System Order

RouterSystem enforces predictable system execution order:

1. **RouterSystem** is always index 0
2. **Route Systems** are inserted sequentially starting at index 1
3. **Existing Systems** are reordered to maintain proper sequence
4. **Order Preservation**: Systems are reordered even if they don't change routes

This ensures consistent behavior across route transitions and prevents execution order bugs.

### System Lifecycle Optimization

The system minimizes expensive start/stop operations:

- **Reuse Systems**: Systems appearing in both routes are reordered, not restarted
- **Minimal Changes**: Only systems that actually change routes are stopped/started
- **Batch Operations**: All system changes are applied in a single update cycle

## Critical Implementation Details

### Error Handling and Invariants

```typescript
const ctor = registeredSystems.get(id);
invariant(ctor !== undefined, `Missing system ${SystemEnum[id]}`);
```

RouterSystem fails fast when:
- Route configurations reference non-existent systems
- System constructors are missing from the registry
- Invalid route configurations are detected

### Memory Management

RouterSystem properly manages resources:

- **System Cleanup**: Removed systems have their `stop()` methods called and resources freed
- **Event Handler Cleanup**: Document click handler is replaced (not added to) each time
- **Reference Management**: Previous route tracking prevents memory leaks

### Performance Considerations

- **Set Operations**: Route system comparisons use Set intersection for O(1) membership testing
- **Minimal DOM Updates**: Single global click handler vs. per-element handlers
- **Lazy Evaluation**: System changes only applied when routes actually differ

## Common Modification Patterns

### Adding New Routes

```typescript
// 1. Define the route
const newRoute = RouteId.root.withHash("new-feature");

// 2. Register with required systems
ROUTES.register(newRoute, [
  SystemEnum.Loading,
  SystemEnum.NewFeatureSystem
]);

// 3. Ensure system is registered
registeredSystems.set(SystemEnum.NewFeatureSystem, NewFeatureSystem);
```

### Implementing Route Guards

```typescript
// State-dependent access control
ROUTES.registerWithGuard(
  adminRoute, 
  [SystemEnum.Admin], 
  (state) => state.user?.role === 'admin'
);
```

### Adding System Dependencies

Currently, system ordering is manual. To add dependency management:

1. **Extend RouteSystemRegistery** to track dependencies
2. **Implement Topological Sort** for automatic ordering
3. **Add Dependency Validation** to detect circular dependencies

## Extension Points

### Custom Navigation Handlers

Replace the default click handler for custom navigation logic:

```typescript
theDocument.onclick = (e) => {
  // Custom navigation logic
  // e.g., modal confirmations, navigation guards, analytics
};
```

### Dynamic Route Registration

Add runtime route registration:

```typescript
class DynamicRouteSystemRegistery extends RouteSystemRegistery {
  addRoute(route: RouteId, systems: SystemEnum[]) {
    // Runtime route addition logic
  }
}
```

### Route Transition Hooks

Add lifecycle hooks for route changes:

```typescript
class ExtendedRouterSystem extends RouterSystem {
  beforeRouteChange?(from: RouteId, to: RouteId): boolean;
  afterRouteChange?(from: RouteId, to: RouteId): void;
}
```

## Testing Strategies

RouterSystem's factory pattern enables comprehensive testing:

### Mock Dependencies

```typescript
const mockDocument = { onclick: jest.fn() };
const RouterSystem = createRouterSystem(routes, mockDocument);
```

### Route Transition Testing

```typescript
test("route change", () => {
  router.update(state);
  state.currentRoute = newRoute;
  router.update(state);
  
  assert(router.mgr.Systems.has(ExpectedSystem));
  assert(!router.mgr.Systems.has(RemovedSystem));
});
```

### Guard Function Testing

```typescript
test("route guard", () => {
  state.isSignedIn = false;
  state.currentRoute = protectedRoute;
  router.update(state);
  
  assert(state.currentRoute === defaultRoute);
});
```

The RouterSystem's unique architecture enables the application to have completely different system configurations for different modes (game, editor, menu) while maintaining clean separation of concerns and testable, predictable behavior.