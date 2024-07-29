import { location } from "./globals";
import assert from "node:assert";
import test from "node:test";
import { Route } from "./Route";

test("getting route from location", () => {
  const route1 = Route.fromLocation();
  assert.equal(route1, undefined);
  location.hash = "#game";
  const route2 = Route.fromLocation()!;
  assert.equal(route2.path, "game");
});

test("changing route", () => {
  location.protocol = "http:";
  location.host = "example.com";
  location.search = "";
  const route = new Route("game", new URLSearchParams("id=42"));
  route.follow();
  assert.equal(location.hash, "#game");
  assert.equal(location.search, "?id=42");
});
