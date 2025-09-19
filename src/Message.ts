import { Vector3 } from "three";
import { InstanceMap } from "./collections";
import { State } from "./state";
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
  type: string;
}

// TODO messages could just be symbols?
export abstract class Message<Answer> {
  targetTilePosition?: Vector3;

  constructor(
    readonly sender: ITileActor,
    readonly id = Message.getNextId()
  ) {}
  responses: Answer[] = [];
  getClass() {
    return this.constructor as IMessageConstructor<Answer>;
  }
  toString() {
    return this.constructor.name;
  }
  get type() {
    return this.getClass().type;
  }
  reduceResponses(): Answer | undefined {
    return this.responses[0];
  }
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
  receiver: ITileActor,
  context: State & ITilesState
): Message<PResponse> {
  const { sender } = msg;
  receiver.inbox.add(msg);
  sender.outbox.add(msg);
  const behavior = context.behavior.get(receiver.behaviorId);
  const response = behavior.onReceive(msg, receiver, context);
  if(response !== undefined) {
    msg.responses.push(response);
  }
  return msg
}

export function sendMessageToTile<PResponse>(
  msg: Message<PResponse>,
  tilePosition: Vector3,
  context: State & ITilesState
): Message<PResponse> {
  const { sender } = msg;

  // Store the target tile position in the message for collision detection
  msg.targetTilePosition = tilePosition;

  const receivers = getReceivers(
    context.tiles,
    tilePosition,
    sender
  );

  for (const receiver of receivers) {
    sendMessage(msg, receiver, context)
  }

  return msg;
}

const _receivers = [] as TileEntity[];
export function getReceivers(
  tiles: TileMatrix,
  vecInTiles: Vector3,
  sender: IActor
): ITileActor[] {
  tiles.getNtts(_receivers, vecInTiles.x, vecInTiles.y, vecInTiles.z);


  return _receivers.filter((entity) => 
    BehaviorComponent.has(entity) && entity !== sender
  ) as unknown as ITileActor[];
}
