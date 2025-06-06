import { Vector3 } from "./Three";
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


export function sendMessage<PResponse>(
  msg: Message<PResponse>,
  tilePosition: Vector3,
  context: BehaviorState & ITilesState
): Iterable<PResponse | undefined> {
  const { sender } = msg;
  const responses = [] as (PResponse | undefined)[];

  const receivers = getReceivers(
    context.tiles,
    tilePosition,
    sender
  );

  for (const receiver of receivers) {
    receiver.inbox.add(msg);
    sender.outbox.add(msg);
    const behavior = context.getBehavior(receiver.behaviorId);
    const response = behavior.onReceive(msg, receiver, context);
    msg.response ??= response;
    responses.push(response);
  }

  return responses;
}

const _receivers = [] as TileEntity[];
export function getReceivers(
  tiles: TileMatrix,
  vecInTiles: Vector3,
  sender: IActor
): EntityWithComponents<typeof BehaviorComponent>[] {
  tiles.getNtts(_receivers, vecInTiles.x, vecInTiles.y, vecInTiles.z);


  return _receivers.filter((entity) => 
    BehaviorComponent.has(entity) && entity !== sender
  ) as unknown as EntityWithComponents<typeof BehaviorComponent>[]
}
