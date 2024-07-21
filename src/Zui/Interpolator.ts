import { Base } from "./Base";
import { ControllersByElementMap } from "./collections";

export class Interpolator extends Base {
  #templateMap = new Map<Text, string>();
  #templateScope = new Map<Text, any>();
  #testPattern = /\$([a-zA-Z]\w*)/;
  test(textContent: string) {
    return this.#testPattern.test(textContent);
  }
  #matchPattern = /\$([a-zA-Z]\w*)\b/g;
  /** By default, matches strings of the form "$myVar" */
  matchInterpolation(textContent: string) {
    return textContent.match(this.#matchPattern);
  }
  constructor(readonly controllerMap: ControllersByElementMap) {
    super();
  }
  ingest(node: Node, scope: any) {
    const isHTMLElement = node.nodeType === Node.ELEMENT_NODE;
    const isTextNode = node.nodeType === Node.TEXT_NODE;
    const { textContent } = node;
    const hasMatch = textContent !== null && this.test(textContent);

    if (!hasMatch) return;

    if (isHTMLElement) {
      for (const childNode of node.childNodes) {
        const innerScope = this.getScope(
          this.controllerMap.get(node as HTMLElement),
          scope
        );
        this.ingest(childNode, innerScope);
      }
    }

    if (isTextNode) {
      this.#templateMap.set(node as Text, textContent);
      this.#templateScope.set(node as Text, scope);
    }
  }
  interpolate() {
    for (const text of this.#templateMap.keys()) {
      const innerScope = this.#templateScope.get(text);
      this.interpolateTextNode(text, innerScope);
    }
  }
  interpolateTextNode(text: Text, scope: any) {
    let newContent = this.#templateMap.get(text);
    if (newContent !== undefined) {
      const ids = this.matchInterpolation(newContent);

      if (ids !== null) {
        for (const id of ids) {
          const scopeVal = this.getScopeAt(scope, id);
          newContent = newContent.replace(id, scopeVal);
        }
      }
      if (text.textContent !== newContent) {
        text.textContent = newContent;
      }
    }
  }
}
