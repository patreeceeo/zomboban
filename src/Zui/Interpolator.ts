import { invariant } from "../Error";
import { Evaluator } from "./Evaluator";
import { ControllersByNodeMap } from "./collections";

type NodeTypeByNumber = [unknown, Element, Attr, Text];

abstract class Interpolator<NodeTypeNumber extends number> extends Evaluator {
  #templateMap = new Map<Node, string>();
  // TODO don't need the capture group here?
  #testPattern = /\$[a-zA-Z]\w*/;
  #matchPattern = /\$([a-zA-Z]\w*)\b/g;
  /** By default, matches strings of the form "$myVar" */
  constructor(
    readonly nodeType: NodeTypeNumber,
    readonly controllerMap: ControllersByNodeMap
  ) {
    super();
  }
  match(text: string) {
    return text.match(this.#matchPattern);
  }
  test(textContent: string) {
    return this.#testPattern.test(textContent);
  }
  setTemplate(node: NodeTypeByNumber[NodeTypeNumber], template: string) {
    this.#templateMap.set(node as Node, template);
  }
  getTemplate(node: NodeTypeByNumber[NodeTypeNumber]) {
    return this.#templateMap.get(node as Node);
  }
  abstract createTreeWalker(node: Node): TreeWalker;
  ingest(node: Node) {
    const { textContent } = node;
    const hasMatch = textContent !== null && this.test(textContent);

    if (!hasMatch) return;

    const walker = this.createTreeWalker(node);

    let currentNode =
      node.nodeType === Node.TEXT_NODE ? node : walker.nextNode();
    while (currentNode !== null) {
      this.handleNode(currentNode);
      currentNode = walker.nextNode() as Text;
    }
  }
  expell(expelledNode: Node) {
    const map = this.#templateMap;
    map.delete(expelledNode);
    for (const node of map.keys()) {
      if (expelledNode.contains(node)) {
        map.delete(node);
      }
    }
  }
  abstract handleNode(node: Node): void;
  getScopeFor(node: Node) {
    return this.controllerMap.getScopeFor(node);
  }
  interpolate() {
    const map = this.#templateMap;

    for (const node of map.keys()) {
      if (this.shouldExpell(node)) {
        this.expell(node);
      }
    }

    for (const node of map.keys()) {
      const scope = this.getScopeFor(node);
      this.interpolateNode(node, scope);
    }
  }
  abstract interpolateNode(
    node: NodeTypeByNumber[NodeTypeNumber],
    scope: any
  ): void;

  abstract shouldExpell(node: Node): boolean;

  interpolateString(template: string, scope: any) {
    const ids = this.match(template)!;

    let newContent = template;
    for (const id of ids) {
      const scopeVal = this.evaluate(scope, id);
      invariant(scopeVal !== id, `Circular reference`);
      newContent = newContent.replace(id, scopeVal);
    }
    return newContent;
  }
}

export class TextNodeInterpolator extends Interpolator<typeof Node.TEXT_NODE> {
  constructor(readonly controllerMap: ControllersByNodeMap) {
    super(Node.TEXT_NODE, controllerMap);
  }
  createTreeWalker(node: Node) {
    return document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  }
  handleNode(node: Text) {
    const { textContent } = node;
    const hasMatch = textContent !== null && this.test(textContent);
    if (hasMatch) {
      this.setTemplate(node as Text, textContent);
    }
  }
  interpolateNode(text: Text, scope: any) {
    const template = this.getTemplate(text)!;

    const newContent = this.interpolateString(template, scope);

    if (text.textContent !== newContent) {
      text.textContent = newContent;
    }
  }
  shouldExpell(node: Node): boolean {
    return !node.isConnected;
  }
}

export class AttrNodeInterpolator extends Interpolator<
  typeof Node.ATTRIBUTE_NODE
> {
  #elementForAttr = new Map<Attr, Element>();
  constructor(readonly controllerMap: ControllersByNodeMap) {
    super(Node.ATTRIBUTE_NODE, controllerMap);
  }
  createTreeWalker(node: Node) {
    // TreeWalker doesn't actually walk attribute nodes so we have to walk elements instead
    return document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
  }
  handleNode(node: Element): void {
    for (const attr of node.attributes) {
      this.handleAttrNode(attr);
      this.#elementForAttr.set(attr, node);
    }
  }
  handleAttrNode(node: Attr) {
    const { value } = node;
    const hasMatch = value !== null && this.test(value);
    if (hasMatch) {
      this.setTemplate(node, value);
    }
  }
  getScopeFor(node: Node) {
    const el = this.#elementForAttr.get(node as Attr)!;
    return super.getScopeFor(el);
  }
  interpolateNode(node: Attr, scope: any) {
    const template = this.getTemplate(node)!;

    const newContent = this.interpolateString(template, scope);

    if (node.value !== newContent) {
      node.value = newContent;
    }
  }
  shouldExpell(node: Node): boolean {
    const el = this.#elementForAttr.get(node as Attr)!;
    return !el.isConnected;
  }
}
