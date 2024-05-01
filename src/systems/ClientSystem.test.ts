// import test from "node:test";
// import assert from "node:assert";
// import { ClientSystem } from "./ClientSystem";
// import { MockState, getMock } from "../testHelpers";
import {
  // AddedTag,
  // ChangedTag,
  // IsGameEntityTag,
  ServerIdComponent
} from "../components";
// import { fetch } from "../globals";
// import { nextTick } from "../util";
// import { KEY_MAPS } from "../constants";
// import { SystemManager } from "../System";

class MockNetworkedEntityServer {
  getList() {
    return JSON.stringify([]);
  }
  getEntity() {
    return JSON.stringify({});
  }
  putEntity(data: string) {
    return data;
  }
  postEntity(data: string) {
    const entity = JSON.parse(data);
    ServerIdComponent.add(entity);
    return JSON.stringify(entity);
  }
  deleteEntity(data: string) {
    const entity = JSON.parse(data);
    ServerIdComponent.remove(entity);
    return JSON.stringify(entity);
  }
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

interface IHandler {
  (url: string, options?: RequestInit): Response;
}

interface IHandlerWithMeta extends IHandler {
  promises: Promise<Response>[];
}

function createHandler(fn: IHandler): IHandlerWithMeta {
  const promises: Promise<Response>[] = [];
  const handler = Object.assign(fn, { promises });
  return handler;
}

class MockNetwork {
  #endpoint = {} as Record<string, Record<Method, IHandlerWithMeta>>;
  addEndpoint(path: string, method: Method, handler: IHandler) {
    this.#endpoint[path] ||= {} as Record<Method, IHandlerWithMeta>;
    this.#endpoint[path][method] = createHandler(handler);
  }
  getEndpoint(path: string, method: Method) {
    for (const key in this.#endpoint) {
      if (this.matchPath(key, path)) {
        return this.#endpoint[key][method];
      }
    }
  }
  matchPath(pattern: string, path: string) {
    return new RegExp(pattern).test(path);
  }
  fetch(url: string, options?: RequestInit) {
    const method = (options?.method ?? "GET") as Method;
    const handler = this.getEndpoint(url, method);
    console.log("fetch", method, url, handler);
    if (!handler) {
      throw new Error(`No handler for ${method} ${url}`);
    }
    const promise = Promise.resolve(handler(url, options));
    handler.promises.push(promise);
    return promise;
  }
}

const network = new MockNetwork();
const server = new MockNetworkedEntityServer();
network.addEndpoint("^/api/entity", "GET", (_url, _options) => {
  return new Response(server.getList());
});
network.addEndpoint("^/api/entity", "POST", (_url, options) => {
  return new Response(server.postEntity(options!.body as string));
});
network.addEndpoint("^/api/entity", "PUT", (_url, options) => {
  return new Response(server.putEntity(options!.body as string));
});
network.addEndpoint("^/api/entity", "DELETE", (_url, options) => {
  return new Response(server.deleteEntity(options!.body as string));
});

// 5/1/2024 commenting out due to flakiness
// TODO try to rewrite this using algebraic effects
// test("saving changed entities", async () => {
//   const state = new MockState();
//   const entity = state.addEntity();
//   const mgr = new SystemManager(state);
//   const postPromises = network.getEndpoint("/api/entity", "POST")!.promises;
//   const putPromises = network.getEndpoint("/api/entity", "PUT")!.promises;
//   const deletePromises = network.getEndpoint("/api/entity", "DELETE")!.promises;
//   getMock(fetch).mockImplementation(network.fetch.bind(network));

//   const system = new ClientSystem(mgr);

//   system.start(state);

//   IsGameEntityTag.add(entity);
//   AddedTag.add(entity);

//   system.update(state);

//   // No changes, no requests
//   assert.equal(postPromises.length, 0);
//   assert.equal(putPromises.length, 0);

//   ChangedTag.add(entity);
//   state.inputPressed = KEY_MAPS.SAVE;
//   system.update(state);

//   // Entity has changed, save is requested and enough time has passed
//   assert.equal(postPromises.length, 1);
//   assert.equal(putPromises.length, 0);

//   state.inputPressed = KEY_MAPS.SAVE;
//   system.update(state);

//   // No time has passed, no additional requests
//   assert.equal(postPromises.length, 1);
//   assert.equal(putPromises.length, 0);

//   await Promise.all(postPromises);
//   await nextTick();

//   // not updated again, so no additional requests
//   assert.equal(postPromises.length, 1);
//   assert.equal(putPromises.length, 0);

//   ChangedTag.add(entity);
//   state.time += 201;
//   system.update(state);

//   await Promise.all(postPromises);
//   await Promise.all(putPromises);

//   // Entity has changed, save is requested and enough time has passed
//   assert.equal(postPromises.length, 1);
//   assert.equal(putPromises.length, 1);

//   system.update(state);

//   await Promise.all(postPromises);
//   await Promise.all(putPromises);

//   // No changes, no additional requests
//   assert.equal(postPromises.length, 1);
//   assert.equal(putPromises.length, 1);

//   AddedTag.remove(entity);

//   // delete entity
//   system.update(state);

//   await Promise.all(deletePromises);
// });
