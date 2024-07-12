import { NextFunction, Request, Response } from "express-serve-static-core";
import fs from "node:fs/promises";

export abstract class TemplateLoader {
  abstract load(templateId: string): Promise<string>;
  #cache = {} as Record<string, string>;
  setCache(templateId: string, contents: string) {
    this.#cache[templateId] = contents;
  }
  getCache(templateId: string) {
    return this.#cache[templateId];
  }
}

export class FileTemplateLoader extends TemplateLoader {
  async load(templateId: string) {
    const contents = await fs.readFile(`src/ui/devtools.html`, "utf8");
    this.setCache(templateId, contents);
    return contents;
  }
}

export type HTTPMethod = "GET";

export class HypermediaServer {
  constructor(readonly templateLoader: TemplateLoader) {}

  middleware = async (req: Request, res: Response, next?: NextFunction) => {
    const method = req.method as HTTPMethod;
    const endpointId = req.path;
    const isMethodDefined = method in this.#templatesByEndpoint;
    const endpointsForMethod = this.#templatesByEndpoint[method];
    const isTemplateFound = endpointId in endpointsForMethod;
    if (isMethodDefined && isTemplateFound) {
      const templateId = endpointsForMethod[endpointId];
      const contents = await this.templateLoader.load(templateId);
      return res.status(200).send(contents);
    } else if (next) {
      next();
    }
  };

  #templatesByEndpoint = {
    GET: {}
  } as Record<HTTPMethod, Record<string, string>>;
  #endpointsByTemplate = {
    GET: {}
  } as Record<HTTPMethod, Record<string, Set<string>>>;

  get(endpointId: string, templateId: string) {
    this.#templatesByEndpoint.GET[endpointId] = templateId;
    // Just do the simplest thing for now
    this.#endpointsByTemplate.GET[templateId] = new Set([endpointId]);
  }

  #emptySet = new Set();
  lookupEndpointIds(templateId: string): Iterable<string> {
    // Just do the simplest thing for now
    return this.#endpointsByTemplate.GET[templateId] ?? this.#emptySet;
  }

  updateTemplateContents(templateId: string, contents: string) {
    this.templateLoader.setCache(templateId, contents);
  }
}
