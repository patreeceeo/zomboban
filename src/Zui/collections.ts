import { AwaitedController } from "./Island";

export class ControllersByNodeMap extends Map<Node, AwaitedController> {
  updateInheritance(node: Node, parentMaybeController?: AwaitedController) {
    const childController = this.get(node);
    const myController = childController ?? parentMaybeController;

    if (myController) {
      this.set(node, myController);
    }
    for (const childNode of node.childNodes) {
      this.updateInheritance(childNode, myController);
    }
  }
}
