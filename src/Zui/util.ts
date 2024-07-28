export function isElement(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

export function selectElements(
  nodes: Node[] | NodeListOf<Node>,
  target: Element[]
) {
  for (const node of nodes) {
    if (isElement(node)) {
      target.push(node);
    }
  }
  return target;
}
