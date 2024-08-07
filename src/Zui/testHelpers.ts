let id = 0;

export abstract class FakeNode extends EventTarget {
  static ELEMENT_NODE = 1;
  static TEXT_NODE = 3;

  constructor(readonly nodeType: number) {
    super();
  }

  abstract toString(): string;
  abstract update(): void;

  readonly childNodes = [] as FakeNode[];
  id = id++;
  textContent = "";

  #isConnected = false;
  get isConnected() {
    return this.#isConnected;
  }
  set isConnected(v: boolean) {
    this.#isConnected = v;
    for (const child of this.childNodes) {
      child.isConnected = false;
    }
  }

  contains(other: FakeNode): boolean {
    let result = false;
    for (const child of this.childNodes) {
      result ||= child.contains(other);
    }
    return result;
  }
}

class FakeClassList extends Set<string> {
  remove(className: string) {
    super.delete(className);
  }
}

export class FakeElement extends FakeNode {
  classList = new FakeClassList();
  constructor(readonly childNodes = [] as FakeNode[]) {
    super(FakeNode.ELEMENT_NODE);
    // TODO call update in the constructor
  }

  update() {
    let result = "";
    for (const node of this.childNodes) {
      node.isConnected = true;
      node.update();
      result += node.textContent;
    }
    this.textContent = result;
  }

  toString() {
    return `(${this.id})<*>${this.childNodes.join("")}</*>`;
  }

  // TODO: unused?
  get firstChild() {
    return this.childNodes.length > 0 ? this.childNodes[0] : null;
  }
}

export class FakeText extends FakeNode {
  constructor(public textContent: string) {
    super(FakeNode.TEXT_NODE);
  }

  update(): void {}

  toString() {
    return `(${this.id})"${this.textContent}"`;
  }
}
export class FakeTreeWalker {
  currentNode: FakeNode;
  constructor(root: FakeNode, whatToShow: number) {
    this.currentNode = root;
    this.search(root, whatToShow);
  }

  search(root: FakeNode, whatToShow: number) {
    for (const childNode of root.childNodes) {
      if ((childNode.nodeType & whatToShow) === whatToShow) {
        this.nextNodes.push(childNode);
      }
      this.search(childNode, whatToShow);
    }
  }

  #nextNodeIndex = 0;
  nextNodes = [] as FakeNode[];
  nextNode() {
    return this.nextNodes[this.#nextNodeIndex++] ?? null;
  }
}

export function installGlobalFakes() {
  globalThis.Node = FakeNode as any;
  globalThis.CustomEvent = Event as any;
}
