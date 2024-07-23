import { Evaluator } from "./Evaluator";
import { ControllersByNodeMap } from "./collections";

export class Interpolator extends Evaluator {
  #templateMap = new Map<Text, string>();
  #testPattern = /\$([a-zA-Z]\w*)/;
  test(textContent: string) {
    return this.#testPattern.test(textContent);
  }
  #matchPattern = /\$([a-zA-Z]\w*)\b/g;
  /** By default, matches strings of the form "$myVar" */
  matchInterpolation(textContent: string) {
    return textContent.match(this.#matchPattern);
  }
  constructor(readonly controllerMap: ControllersByNodeMap) {
    super();
  }
  createTreeWalker(node: Node) {
    return document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  }
  ingest(node: Node) {
    const { textContent } = node;
    const hasMatch = textContent !== null && this.test(textContent);

    if (!hasMatch) return;

    const walker = this.createTreeWalker(node);

    let currentNode =
      node.nodeType === Node.TEXT_NODE
        ? (node as Text)
        : (walker.nextNode() as Text);
    while (currentNode !== null) {
      const { textContent } = currentNode;
      if (textContent !== null) {
        this.#templateMap.set(currentNode as Text, textContent);
      }
      currentNode = walker.nextNode() as Text;
    }
  }
  interpolate() {
    const map = this.#templateMap;

    // clean up removed text nodes
    // TODO perhaps it would be better to have an expell method that
    // is called whenever nodes are detached?
    for (const text of map.keys()) {
      if (!text.isConnected) {
        this.#templateMap.delete(text);
      }
    }
    for (const text of map.keys()) {
      const scope = this.controllerMap.getScopeFor(text);
      this.interpolateTextNode(text, scope);
    }
  }
  interpolateTextNode(text: Text, scope: any) {
    let newContent = this.#templateMap.get(text);
    if (newContent !== undefined) {
      const ids = this.matchInterpolation(newContent);

      if (ids !== null) {
        for (const id of ids) {
          const scopeVal = this.evaluate(scope, id);
          newContent = newContent.replace(id, scopeVal);
        }
      }
      if (text.textContent !== newContent) {
        text.textContent = newContent;
      }
    }
  }
}
