import { Sprite, Vector3 } from "three";
import { IEntity } from "../EntityManager";
import {
  IActor,
  IHasSprite,
  IHasTexture,
  IMaybeVisible,
  IMovable,
  IPositionable,
  ISerializable,
  ISpawnable,
} from "../components";

interface ISpriteEntityJSON
  extends IEntity,
    IHasTexture,
    IMaybeVisible,
    IPositionable,
    IMovable,
    ISpawnable,
    IActor {}

export class SpriteEntity
  implements IHasSprite, ISerializable<ISpriteEntityJSON>
{
  static isInstance(entity: IEntity): entity is SpriteEntity {
    return entity instanceof SpriteEntity;
  }
  spawned = false;
  readonly sprite = new Sprite();
  readonly position = this.sprite.position;
  get visible() {
    return this.sprite.visible;
  }
  set visible(value: boolean) {
    this.sprite.visible = value;
  }
  velocity = new Vector3();
  behaviorId = "behavior/null";
  textureId = "texture/null";

  constructor(readonly name: string) {}

  serialize() {
    return {
      name: this.name,
      position: this.position,
      visible: this.visible,
      velocity: this.velocity,
      spawned: this.spawned,
      behaviorId: this.behaviorId,
      textureId: this.textureId,
    };
  }
  deserialize(data: ISpriteEntityJSON) {
    this.position.copy(data.position);
    this.visible = data.visible;
    this.velocity.copy(data.velocity);
    this.spawned = data.spawned;
    this.behaviorId = data.behaviorId;
    this.textureId = data.textureId;
  }
}
