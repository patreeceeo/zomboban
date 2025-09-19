import assert from "node:assert";
import test, { beforeEach, describe, mock } from "node:test";
import { createRouterSystem } from "../systems";
import { System, SystemManager } from "../System";
import { State } from "../state";
import { RouteId, RouteSystemRegistery } from "../Route";
import { window as mockWindow, location } from "../globals";

class TestState extends State {
  isSignedIn = false;
}


class ActionSystem extends System<any> {}
class RenderSystem extends System<any> {}
class EditorSystem extends System<any> {}

// Store popstate handler
let popstateHandler: ((event: any) => void) | null = null;

function getRouterSystem(
  state: State,
  ...args: Parameters<typeof createRouterSystem>
) {
  // Mock addEventListener to capture popstate handler
  const mockAddEventListener = mock.fn((event: string, handler: any) => {
    if (event === 'popstate') {
      popstateHandler = handler;
    }
  });
  mockWindow.addEventListener = mockAddEventListener as any;

  const RouterSystem = createRouterSystem(...args);
  const mgr = new SystemManager(state);
  const router = new RouterSystem(mgr);

  // Don't restore immediately - we want the handler to be captured
  // Restore will happen in beforeEach

  return router;
}

function restoreMockWindow() {
  // We need a way to restore the original mock
  if (process.env.NODE_ENV === "test") {
    mockWindow.addEventListener = mock.fn();
  }
}

// Helper to trigger popstate
function triggerPopstate() {
  if (popstateHandler) {
    popstateHandler({});
  } else {
    throw new Error("No popstate handler captured");
  }
}

const defaultRoute = new RouteId("", "game");

const theDocument = {
  onclick: (_: MouseEvent) => {},
};

describe("RouterSystem", () => {
  let state: TestState;
  beforeEach(() => {
    state = new TestState();
    state.route.default = defaultRoute;
    popstateHandler = null; // Reset handler for each test
    restoreMockWindow(); // Restore mock window
  });

  test("valid route", () => {
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("", "another");
    const router = getRouterSystem(state, reg, theDocument);

    reg
      .register(defaultRoute, [ActionSystem, RenderSystem])
      .register(anotherRoute, [EditorSystem, RenderSystem]);

    state.route.current = defaultRoute;
    router.start(state);
    state.route.current = anotherRoute;
    router.update(state);

    assert(state.route.current.equals(anotherRoute));
  });

  test("invalid route", () => {
    const reg = new RouteSystemRegistery();
    const router = getRouterSystem(state, reg, theDocument);

    reg.register(defaultRoute, [ActionSystem, RenderSystem]);

    state.route.current = defaultRoute;
    router.start(state)
    // oops, typo!
    state.route.current = new RouteId("", "gaem");
    router.update(state);
    assert(state.route.current.equals(defaultRoute));
  });

  test("not allowed", () => {
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("/editor", "another");
    const router = getRouterSystem(state, reg, theDocument);

    reg
      .register(defaultRoute)
      .registerWithGuard(anotherRoute, [], (state) => {
        return state.isSignedIn;
      });
    state.isSignedIn = false;
    state.route.current = defaultRoute;
    router.start(state);
    state.route.current = anotherRoute;
    router.update(state);

    assert(state.route.current.equals(defaultRoute));
  });

  test("redirect to default if current not allowed", () => {
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("", "another");
    const router = getRouterSystem(state, reg, theDocument);

    reg
      .register(defaultRoute)
      .registerWithGuard(anotherRoute, [], (state) => {
        return state.isSignedIn;
      });
    state.isSignedIn = false;
    state.route.current = anotherRoute;
    router.start(state);
    router.update(state);

    assert(state.route.current.equals(defaultRoute));
  });

  test("systems added and removed", () => {
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("", "another");
    const router = getRouterSystem(state, reg, theDocument);
    const { Systems } = router.mgr;

    reg
      .register(defaultRoute, [ActionSystem, RenderSystem])
      .register(anotherRoute, [EditorSystem, RenderSystem]);

    state.route.current = defaultRoute;
    router.start(state);
    router.update(state);
    assert(Systems.has(ActionSystem));
    assert(Systems.has(RenderSystem));
    assert(!Systems.has(EditorSystem));

    state.route.current = anotherRoute;
    router.update(state);
    assert(!Systems.has(ActionSystem));
    assert(Systems.has(RenderSystem));
    assert(Systems.has(EditorSystem));

    state.route.current = defaultRoute;
    router.update(state);
    assert(Systems.has(ActionSystem));
    assert(Systems.has(RenderSystem));
    assert(!Systems.has(EditorSystem));
  });

  test("responds to address bar change - valid route", () => {
    const reg = new RouteSystemRegistery();
    const anotherRoute = new RouteId("", "another");
    const router = getRouterSystem(state, reg, theDocument);

    reg
      .register(defaultRoute, [ActionSystem, RenderSystem])
      .register(anotherRoute, [EditorSystem, RenderSystem]);

    state.route.current = defaultRoute;
    router.start(state);

    // Verify initial state
    assert(state.route.current.equals(defaultRoute));

    // Simulate address bar changing to another valid route
    location.hash = "#another";
    triggerPopstate();

    // The popstate handler should have updated state.route.current directly
    assert(state.route.current.equals(anotherRoute),
      `Expected route to be ${anotherRoute.toString()}, but got ${state.route.current.toString()}`);
  });

  test("responds to address bar change - invalid route", () => {
    const reg = new RouteSystemRegistery();
    const router = getRouterSystem(state, reg, theDocument);

    reg.register(defaultRoute, [ActionSystem, RenderSystem]);

    state.route.current = defaultRoute;
    router.start(state);

    // Simulate address bar changing to an invalid route
    location.hash = "#nonexistent";
    triggerPopstate();

    // Router should NOT update to invalid route
    assert(state.route.current.equals(defaultRoute));
  });

  test("responds to address bar change - disallowed route", () => {
    const reg = new RouteSystemRegistery();
    const protectedRoute = new RouteId("", "protected");
    const router = getRouterSystem(state, reg, theDocument);

    reg
      .register(defaultRoute)
      .registerWithGuard(protectedRoute, [], (state) => {
        return state.isSignedIn;
      });

    state.isSignedIn = false;
    state.route.current = defaultRoute;
    router.start(state);

    // Simulate address bar changing to a protected route
    location.hash = "#protected";
    triggerPopstate();

    // Router should NOT update to disallowed route
    assert(state.route.current.equals(defaultRoute));
  });

  test("responds to address bar change - allowed guarded route", () => {
    const reg = new RouteSystemRegistery();
    const protectedRoute = new RouteId("", "protected");
    const router = getRouterSystem(state, reg, theDocument);

    reg
      .register(defaultRoute)
      .registerWithGuard(protectedRoute, [EditorSystem], (state) => {
        return state.isSignedIn;
      });

    state.isSignedIn = true; // User is signed in
    state.route.current = defaultRoute;
    router.start(state);

    // Verify initial state
    assert(state.route.current.equals(defaultRoute));

    // Simulate address bar changing to a protected route
    location.hash = "#protected";
    triggerPopstate();

    // The popstate handler should have updated state.route.current directly
    assert(state.route.current.equals(protectedRoute));
  });
});
