import { location } from "./globals";
import assert from "node:assert";
import test, { describe } from "node:test";
import { RouteId } from "./Route";

describe("Route", () => {
  describe("fromLocation", () => {
    test("gets a route that matches only the current location", () => {
      location.hash = "#game";
      const route2 = RouteId.fromLocation()!;
      assert(route2.test(location));
    });
  });

  describe("follow", () => {
    test("sets the current location so that it matches this route", () => {
      location.protocol = "http:";
      location.host = "example.com";
      location.search = "";
      const route = new RouteId("", "game", "id=42");
      route.follow();
      assert.equal(location.hash, "#game");
      assert.equal(location.search, "?id=42");
    });
  });

  describe("equals", () => {
    test("true if they represent the same route", () => {
      const routeA = new RouteId("", "game", "id=42");
      const routeAClone = routeA.clone();
      assert(routeA.equals(routeAClone));
      assert(routeAClone.equals(routeA));
    });
  });

  describe("nest", () => {
    test("creates a new route that's one level deeper than this route", () => {
      const subRoute = RouteId.root.nest("api");
      const subSubRoute = subRoute.nest("entities");
      assert.notEqual(subRoute, RouteId.root);
      assert.notEqual(subSubRoute, subRoute);
      assert.equal(subRoute.path, "/api");
      assert.equal(subSubRoute.path, "/api/entities");
    });
  });
});
