import { ParticleContainer, Container } from "pixi.js";

export interface VoidSprite<Texture> {
  x: number;
  y: number;
  texture: Texture;
}

export interface VoidContainer<Sprite> {
  addChild: (...children: Array<Sprite>) => void;
  removeChild: (...children: Array<Sprite>) => void;
  children: Array<Sprite>;
}

export function createContainer(
  width: number,
  height: number,
  zIndex: number,
): Container {
  const container = new Container();
  container.width = width;
  container.height = height;
  container.zIndex = zIndex;
  return container;
}

export function createZSortableContainer(
  width: number,
  height: number,
  zIndex: number,
): Container {
  const container = new Container();
  container.width = width;
  container.height = height;
  container.zIndex = zIndex;
  container.sortableChildren = true;
  return container;
}

export function createParticleContainer(
  width: number,
  height: number,
  zIndex: number,
): ParticleContainer {
  const container = new ParticleContainer(1024, {
    alpha: true,
    tint: true,
    rotation: false,
    vertices: false,
    uvs: false,
    scale: false,
  });
  container.zIndex = zIndex;
  container.width = width;
  container.height = height;
  return container;
}

/** @see https://github.com/pixijs/pixijs/issues/9845
 */
export function setVisibility<
  Texture,
  Sprite extends VoidSprite<Texture>,
  Container extends VoidContainer<Sprite>,
>(sprite: Sprite, isVisible: boolean, container: Container) {
  if (!isVisible) {
    container.removeChild(sprite);
  } else if (!container.children.includes(sprite)) {
    container.addChild(sprite);
  }
}
