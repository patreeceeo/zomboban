import { Vector3 } from "./Three";
import { invariant } from "./Error";
import { InstanceMap } from "./collections";
import { BehaviorState } from "./state";
import { EntityWithComponents } from "./Component";
import { BehaviorComponent } from "./components";
import { ITilesState, TileEntity, TileMatrix } from "./systems/TileSystem";
import { BehaviorEnum } from "./behaviors";

export interface IActor {
  behaviorId: BehaviorEnum;
  inbox: IMessageInstanceMap;
  outbox: IMessageInstanceMap;
}

interface ITileActor extends IActor {
  tilePosition: Vector3;
}

interface IMessageInstanceMap extends InstanceMap<IMessageConstructor<any>> {}

export interface IMessageConstructor<Response>
  extends IConstructor<
    Message<Response>,
    ConstructorParameters<typeof Message<any>>
  > {
  // TODO use toString instead?
  type: string;
}

// TODO messages could just be symbols?
export abstract class Message<Answer> {
  constructor(
    readonly sender: ITileActor,
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

export type MessageAnswer<T> = T extends Message<infer Answer> ? Answer : never;

export interface MessageHandler<Entity, Context, Response> {
  (receiver: Entity, context: Context, message: Message<Response>): Response;
}

const receivers = [] as TileEntity[];

export function sendMessage<PResponse>(
  msg: Message<PResponse>,
  { x, y, z }: Vector3,
  context: BehaviorState & ITilesState
): Iterable<PResponse | undefined> {
  const { sender } = msg;
  const responses = [] as (PResponse | undefined)[];

  for (const receiver of context.tiles.getNtts(receivers, x, y, z)) {
    if (BehaviorComponent.has(receiver)) {
      const behavior = context.getBehavior(receiver.behaviorId);
      const response = behavior.onReceive(msg, receiver, context);
      msg.response = response;
      receiver.inbox.add(msg);
      sender.outbox.add(msg);
      responses.push(response);
    }
  }
  return responses;
}

export function getReceivers(
  tiles: TileMatrix,
  vecInTiles: Vector3
): Iterable<EntityWithComponents<typeof BehaviorComponent>> {
  tiles.getNtts(receivers, vecInTiles.x, vecInTiles.y, vecInTiles.z);

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
