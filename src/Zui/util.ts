export function isHTMLElement(node: Node): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function selectHTMLElements(
  nodes: Node[] | NodeListOf<Node>,
  target: HTMLElement[]
) {
  for (const node of nodes) {
    if (isHTMLElement(node)) {
      target.push(node);
    }
  }
  return target;
}
