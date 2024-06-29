import { invariant } from "./Error";
import { BehaviorState } from "./state";

interface IActor {
  behaviorId: string;
}

export interface IMessageReceiver extends IActor {
  inbox: MessageInstanceMap;
}

export interface IMessageSender extends IActor {
  outbox: MessageInstanceMap;
}

export class MessageInstanceMap {
  #map = new Map<IConstructor<any>, Set<Message<any>>>();
  add<PMessage extends Message<any>>(
    msgType: IConstructor<PMessage>,
    ...msgs: PMessage[]
  ) {
    const map = this.#map;
    const set = map.get(msgType) ?? new Set();
    for (const msg of msgs) {
      set.add(msg);
    }
    map.set(msgType, set);
  }
  getAll<PMessage extends Message<any>>(msgType: IConstructor<PMessage>) {
    const map = this.#map;
    let result = map.get(msgType) as Set<PMessage>;
    if (!result) {
      result = new Set();
      map.set(msgType, result);
    }
    return result;
  }
  clear() {
    this.#map.clear();
  }
  get size() {
    return this.#map.size;
  }
}

const nilReceiver: IMessageReceiver = {
  behaviorId: "",
  inbox: new MessageInstanceMap()
};

const nilSender: IMessageSender = {
  behaviorId: "",
  outbox: new MessageInstanceMap()
};

export class Message<Answer> {
  constructor(
    readonly receiver: IMessageReceiver,
    readonly sender: IMessageSender,
    readonly id = Message.getNextId()
  ) {}
  toString() {
    return this.constructor.name;
  }
  answer: Answer | TMessageNoAnswer = Message.noAnswer;
  static nextId = 0;
  static getNextId() {
    return this.nextId++;
  }
  static empty = new Message(nilReceiver, nilSender);
  static noAnswer = Symbol("noAnswer");
}

type TBuilderHiddenFields = "sender" | "receiver" | "MessageCtor" | "ctorArgs";

const builder = {
  sender: nilSender,
  receiver: nilReceiver,
  MessageCtor: Message as IConstructor<Message<any>>,
  ctorArgs: [] as any[],
  from(sender: IMessageSender) {
    this.sender = sender;
    return this as Omit<typeof builder, "from" | TBuilderHiddenFields>;
  },
  to(receiver: IMessageReceiver) {
    const { sender, MessageCtor } = this;
    invariant(sender !== nilSender, `Expected sender to have been provided`);
    return new MessageCtor(receiver, sender, ...this.ctorArgs);
  }
};

type Slice<T extends any[]> = T extends [any, any, ...infer Rest]
  ? Rest
  : never;

export function createMessage<
  PMessageConstructor extends IConstructor<Message<any>>
>(
  MessageCtor: PMessageConstructor,
  ...args: Slice<ConstructorParameters<PMessageConstructor>>
) {
  builder.MessageCtor = MessageCtor;
  builder.ctorArgs = args;
  return builder as Omit<typeof builder, "to" | TBuilderHiddenFields>;
}

export type TMessageNoAnswer = (typeof Message)["noAnswer"];

export function sendMessage<PAnswer>(
  msg: Message<PAnswer>,
  context: BehaviorState
): PAnswer | TMessageNoAnswer {
  const { receiver, sender } = msg;

  const behavior = context.getBehavior(receiver.behaviorId);
  behavior.onReceive(msg, receiver, context);
  receiver.inbox.add(msg.constructor as any, msg);
  sender.outbox.add(msg.constructor as any, msg);

  return msg.answer;
}

export function hasAnswer<Answer>(box: Set<Message<Answer>>, answer: Answer) {
  for (const msg of box) {
    if (msg.answer === answer) {
      return true;
    }
  }
  return false;
}

export function getMessageWithAnswer<PMessage extends Message<any>>(
  box: Set<PMessage>,
  answer: PMessage extends Message<infer Answer> ? Answer : never
) {
  for (const msg of box) {
    if (msg.answer === answer) {
      return msg;
    }
  }
}
