import test from "node:test";
import assert from "node:assert";
import { ClientSystem } from "./ClientSystem";
import { MockState, getMock } from "../testHelpers";
import {
  ServerIdComponent,
  SpriteComponent2,
  createObservableEntity
} from "../components";
import { fetch } from "../globals";

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

test("saving changed entities", async () => {
  const entity = createObservableEntity();
  const state = new MockState();
  const postPromises = network.getEndpoint("/api/entity", "POST")!.promises;
  const putPromises = network.getEndpoint("/api/entity", "PUT")!.promises;
  getMock(fetch).mockImplementation(network.fetch.bind(network));

  const system = new ClientSystem();

  system.start(state);

  SpriteComponent2.add(entity);

  entity.position.set(1, 2, 3);
  system.update();

  assert.equal(postPromises.length, 1);
  assert.equal(putPromises.length, 0);

  system.update();

  assert.equal(postPromises.length, 1);
  assert.equal(putPromises.length, 0);

  await Promise.all(postPromises);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(postPromises.length, 1);
  assert.equal(putPromises.length, 0);

  entity.position.set(2, 2, 3);
  system.update();

  await Promise.all(postPromises);
  await Promise.all(putPromises);

  assert.equal(postPromises.length, 1);
  assert.equal(putPromises.length, 1);

  system.update();

  await Promise.all(postPromises);
  await Promise.all(putPromises);

  assert.equal(postPromises.length, 1);
  assert.equal(putPromises.length, 1);
});
