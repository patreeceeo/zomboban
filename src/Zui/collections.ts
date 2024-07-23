import { AwaitedController } from "./Island";

export class ControllersByNodeMap extends Map<Node, AwaitedController> {
  // TODO define setTree instead?
  cascade(node: Node, parentMaybeController?: AwaitedController) {
    const childController = this.get(node);
    const myController = childController ?? parentMaybeController;

    if (myController) {
      this.set(node, myController);
    }

    // TODO node.children instead?
    for (const child of node.childNodes) {
      this.cascade(child, myController);
    }
  }

  deleteTree(node: Node) {
    this.delete(node);
    for (const child of node.childNodes) {
      this.deleteTree(child);
    }
  }

  getScopeFor(node: Node) {
    return this.get(node)?.awaitedValue?.scope;
  }
}
