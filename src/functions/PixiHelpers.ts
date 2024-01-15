import { ParticleContainer, Container } from "pixi.js";

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
  Child extends Container,
  Parent extends Container,
>(child: Child, isVisible: boolean, parent: Parent) {
  if (!isVisible) {
    parent.removeChild(child);
  } else if (!parent.children.includes(child)) {
    parent.addChild(child);
  }
}
