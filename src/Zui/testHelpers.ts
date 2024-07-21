let id = 0;

export abstract class FakeNode {
  id = id++;
  textContent = "";
  constructor(readonly nodeType: number) {}
  static ELEMENT_NODE = 1;
  static TEXT_NODE = 3;
  abstract toString(): string;
  abstract update(): void;
}

export class FakeElement extends FakeNode {
  constructor(readonly childNodes = [] as FakeNode[]) {
    super(Node.ELEMENT_NODE);
  }

  update() {
    let result = "";
    for (const node of this.childNodes) {
      node.update();
      result += node.textContent;
    }
    this.textContent = result;
  }

  toString() {
    return `(${this.id})<*>${this.childNodes.join("")}</*>`;
  }
}

export class FakeText extends FakeNode {
  constructor(public textContent: string) {
    super(Node.TEXT_NODE);
  }

  update(): void {}

  toString() {
    return `(${this.id})"${this.textContent}"`;
  }
}

export function installGlobalFakes() {
  globalThis.Node = FakeNode as any;
}
