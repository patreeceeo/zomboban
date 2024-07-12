import assert from "node:assert";
import test, { beforeEach, describe } from "node:test";
import { TemplateLoader, HypermediaServer, HTTPMethod } from "./Hypermedia";
import { getMock } from "./testHelpers";

/**
 * Short-term goal: Associate arbitrary ID strings with hypermedia templates so that
 * the HTML HMR plugin can look up the ID string when the template file changes and send that to the
 * client along with the new template contents. That way there doesn't need to be a special route/endpoint
 * for serving hypermedia, the server just uses these ID strings as the paths for these endpoints.
 */

class MockTemplateLoader extends TemplateLoader {
  async load(templateId: string) {
    return this.getCache(templateId);
  }
}

class MockRequest {
  constructor(
    readonly method: HTTPMethod,
    readonly path: string
  ) {}
}
class MockResponse {
  bodyText = "";
  statusCode: number = 0;
  constructor() {}
  status(status: number) {
    this.statusCode = status;
    return this;
  }
  send(text: string) {
    this.bodyText = text;
  }
}

describe("HypermediaServer", () => {
  const templateId = "/templates/example.tmpl";
  const contents = "calm down. you're scaring the children";
  const endpointId = "/example";
  let templateLoader: MockTemplateLoader;
  let hs: HypermediaServer;

  beforeEach(() => {
    templateLoader = new MockTemplateLoader();
    templateLoader.setCache(templateId, contents);
    hs = new HypermediaServer(templateLoader);
    hs.get(endpointId, templateId);
  });

  test("it is an express middleware function that responds with the template contents", async () => {
    const req200 = new MockRequest("GET", endpointId);
    const req404 = new MockRequest("GET", "foo");
    const res200 = new MockResponse();
    const res404 = new MockResponse();
    const nextSpy = test.mock.fn();
    const { middleware } = hs;

    await middleware(req200 as any, res200 as any);

    assert.equal(res200.bodyText, contents);
    assert.equal(res200.statusCode, 200);

    await middleware(req404 as any, res404 as any, nextSpy);
    assert.equal(getMock(nextSpy).callCount(), 1);
  });

  test("it can be used to look up endpointIds for a given templateId", () => {
    const found = hs.lookupEndpointIds(templateId);
    const notFound = hs.lookupEndpointIds("foo");

    assert.deepEqual(Array.from(found), [endpointId]);
    assert.deepEqual(Array.from(notFound), []);
  });

  test("it can be used to update the contents for a given templateId", async () => {
    const expectedBodyText = "reality continues to ruin my life";
    hs.updateTemplateContents(templateId, expectedBodyText);
    const req = new MockRequest("GET", endpointId);
    const res = new MockResponse();

    await hs.middleware(req as any, res as any);

    assert.equal(res.bodyText, expectedBodyText);
  });
});
