import { Texture, Sprite as BaseSprite, Object3D } from "three";

const nullTexture = new Texture();

export class Sprite extends BaseSprite {
  #texture = nullTexture;
  constructor(readonly parent: Object3D) {
    super();
    parent.add(this);
  }

  set texture(texture: Texture) {
    const { image } = texture as { image: InstanceType<typeof Image> };
    if (this.#texture !== texture) {
      this.material.map = texture;
      this.parent.scale.set(image.naturalWidth, image.naturalHeight, 1);
      this.material.needsUpdate = true;
      this.#texture = texture;
    }
  }

  get texture() {
    return this.#texture;
  }
}
