import { Vector3 } from "./Three";
import { invariant } from "./Error";
import { InstanceMap } from "./collections";
import { BehaviorState } from "./state";
import { EntityWithComponents } from "./Component";
import { BehaviorComponent } from "./components";
import { ITilesState, TileMatrix } from "./systems/TileSystem";
import { BehaviorEnum } from "./behaviors";

export interface IActor {
  behaviorId: BehaviorEnum;
  inbox: IMessageInstanceMap;
  outbox: IMessageInstanceMap;
}

const nilActor = {} as any as IActor;

interface IMessageInstanceMap extends InstanceMap<IMessageConstructor<any>> {}

export interface IMessageConstructor<Response>
  extends IConstructor<
    Message<Response>,
    ConstructorParameters<typeof Message<any>>
  > {
  // TODO use toString instead?
  type: string;
}

const definedMessages = new Map<string, IMessageConstructor<any>>();
export function defineMessage<Answer>(
  ctor: IMessageConstructor<Answer>
): IMessageConstructor<Answer> {
  invariant(
    !definedMessages.has(ctor.type),
    `Message of type ${ctor.type} has already been defined`
  );
  definedMessages.set(ctor.type, ctor);
  return ctor;
}

export abstract class Message<Answer> {
  constructor(
    readonly receiver: IActor,
    readonly sender: IActor,
    readonly id = Message.getNextId()
  ) {}
  toString() {
    return this.constructor.name;
  }
  // TODO use constructor as the type value instead?
  get type() {
    return (this.constructor as IMessageConstructor<any>).type;
  }
  response?: Answer;
  static nextId = 0;
  static getNextId() {
    return this.nextId++;
  }
}

type TBuilderHiddenFields = "sender" | "receiver" | "MessageCtor";

const builder = {
  sender: nilActor,
  receiver: nilActor,
  MessageCtor: null! as IMessageConstructor<any>,
  from(sender: IActor) {
    this.sender = sender;
    return this as Omit<typeof builder, "from" | TBuilderHiddenFields>;
  },
  to(receiver: IActor) {
    const { sender, MessageCtor } = this;
    invariant(sender !== nilActor, `Expected sender to have been provided`);
    return new MessageCtor(receiver, sender);
  }
};

/** @deprecated */
export function createMessage<Answer>(
  MessageCtor: IMessageConstructor<Answer>
) {
  builder.MessageCtor = MessageCtor;
  return builder as Omit<typeof builder, "to" | TBuilderHiddenFields>;
}

export interface MessageHandler<Entity, Context, Response> {
  (receiver: Entity, context: Context, message: Message<Response>): Response;
}

export function sendMessage<PResponse>(
  msg: Message<PResponse>,
  context: BehaviorState
): PResponse | undefined {
  const { receiver, sender } = msg;

  const behavior = context.getBehavior(receiver.behaviorId);
  const response = behavior.onReceive(msg, receiver, context);
  msg.response = response;
  receiver.inbox.add(msg);
  sender.outbox.add(msg);

  return response;
}

export function sendMessageToEachWithin<PResponse>(
  msgFactory: (entity: IActor) => Message<PResponse>,
  context: BehaviorState & ITilesState,
  tilePosition: Vector3
) {
  const receivers = getReceivers(context.tiles, tilePosition);

  for (const receiver of receivers) {
    sendMessage(msgFactory(receiver), context);
  }
}

export function getReceivers(
  tiles: TileMatrix,
  vecInTiles: Vector3
): Iterable<EntityWithComponents<typeof BehaviorComponent>> {
  const receivers = tiles.atPoint(vecInTiles);

  let allHaveBehavior = true;
  for (const entity of receivers) {
    allHaveBehavior &&= BehaviorComponent.has(entity);
  }
  invariant(
    allHaveBehavior,
    "Expected tile entities to have behavior components"
  );

  return receivers as Iterable<EntityWithComponents<typeof BehaviorComponent>>;
}
