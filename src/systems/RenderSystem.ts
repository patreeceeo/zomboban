import {
  Sprite,
  Material,
  Mesh,
  OrthographicCamera,
  Object3D,
  BoxGeometry,
  MeshBasicMaterial
} from "three";
import { SystemWithQueries } from "../System";
import {
  InSceneTag,
  RenderOptionsComponent,
  TransformComponent
} from "../components";
import {
  DebugState,
  EntityManagerState,
  RendererState,
  TimeState
} from "../state";
import { ITilesState } from "./TileSystem";
import { convertToPixels } from "../units/convert";
import { Tiles } from "../units/types";
import { invariant } from "../Error";
import { VIEWPORT_SIZE } from "../constants";
import { EntityWithComponents } from "../Component";
import {createEffectComposer} from "../rendering";

// TODO move this to src/rendering
export function createOrthographicCamera() {
  const offsetWidth = VIEWPORT_SIZE.x;
  const offsetHeight = VIEWPORT_SIZE.y;
  const camera = new OrthographicCamera(
    offsetWidth / -2,
    offsetWidth / 2,
    offsetHeight / 2,
    offsetHeight / -2,
    0.1,
    10000
  );

  camera.zoom = 1;
  camera.updateProjectionMatrix();
  camera.updateMatrix();
  camera.lookAt(0, 0, 0);

  return camera;
}

type Context = EntityManagerState &
  RendererState &
  TimeState &
  ITilesState &
  DebugState;

export class RenderSystem extends SystemWithQueries<Context> {
  renderOptionsQuery = this.createQuery([
    RenderOptionsComponent,
    TransformComponent,
    InSceneTag
  ]);
  renderQuery = this.createQuery([TransformComponent, InSceneTag]);

  // Debug visualization
  #debugCubes = new Map<string, Mesh>();
  #debugGeometry = new BoxGeometry(64, 64, 32);
  #debugMaterial = new MeshBasicMaterial({ 
    color: 0xff0000, 
    transparent: true, 
    opacity: 0.3 
  });
  start(state: Context) {
    const {renderQuery} = this;
    this.resources.push(
      renderQuery.stream((entity) => {
        const { scene } = state;
        const { transform } = entity;
        transform.removeFromParent();
        transform.parent = scene;
        scene.children.push(transform);
      }),
      renderQuery.onRemove((entity) => {
        this.handleRemove(entity, state);
      }),
      state.streamCameras((camera) => {
        this.setUpActiveCamera(state, camera);
      })
    );
  }
  stop(state: Context) {
    for(const entity of this.renderQuery) {
      this.handleRemove(entity, state);
    }
    
    // Clean up debug cubes
    for (const [, cube] of this.#debugCubes) {
      state.scene.remove(cube);
    }
    this.#debugCubes.clear();
  }
  handleRemove = (entity: EntityWithComponents<typeof TransformComponent>, state: Context) =>{
    const { scene } = state;
    const { transform } = entity;
    const index = scene.children.indexOf(transform);
    invariant(index !== -1, `Entity not found in scene`);
    transform.parent = null;
    scene.children.splice(index, 1);
  }
  render(state: Context) {
    state.composer.render(state.dt);
  }
  setUpActiveCamera(
    state: Context,
    camera: OrthographicCamera
  ) {
    state.composer.dispose();
    state.composer = createEffectComposer(state.renderer, state.scene, camera)
  }
  setRenderOptions(
    entity: EntityWithComponents<
      typeof RenderOptionsComponent | typeof TransformComponent
    >
  ) {
    const meshes = findMeshes(entity.transform);
    for (const mesh of meshes) {
      mesh.renderOrder = entity.renderOrder;
      const {material} = mesh;
      assertMaterial(material);
      material.depthTest = entity.depthTest;
      material.opacity = entity.opacity;
      if(entity.opacity < 1) {
        material.transparent = true;
      } else {
        material.transparent = false;
      }
    }
    const sprites = findSprites(entity.transform);
    for (const sprite of sprites) {
      sprite.renderOrder = entity.renderOrder;
      const {material} = sprite;
      assertMaterial(material);
      material.depthTest = entity.depthTest;
    }
  }
  update(state: Context) {
    for (const entity of this.renderOptionsQuery) {
      this.setRenderOptions(entity);
    }

    const {camera} = state;
    if(camera) {
      const { cameraTarget, cameraOffset, lookAtTarget } = state;
      camera.position.copy(cameraTarget).add(cameraOffset);
      if(lookAtTarget) {
        camera.lookAt(cameraTarget);
      }
    }

    this.updateDebugCubes(state);
    this.render(state);
  }

  updateDebugCubes(state: Context) {
    const debugCubes = this.#debugCubes;
    const debugGeometry = this.#debugGeometry;
    const debugMaterial = this.#debugMaterial;
    const { scene } = state;
    // Clear existing debug cubes
    for (const [, cube] of debugCubes) {
      scene.remove(cube);
    }
    debugCubes.clear();

    // Only render debug cubes if debug tiles are enabled
    if (!state.debugTilesEnabled) {
      return;
    }

    // Iterate through all tiles in the matrix
    for (const [x, y, z, tileData] of state.tiles.entries()) {
      if (tileData.regularNtts.size > 0 || tileData.platformNtt) {
        const key = `${x},${y},${z}`;
        
        const cube = new Mesh(debugGeometry, debugMaterial);
        cube.position.set(
          convertToPixels(x as Tiles),
          convertToPixels(y as Tiles),
          convertToPixels(z as Tiles) + 16 // Slightly above ground
        );
        
        scene.add(cube);
        debugCubes.set(key, cube);
      }
    }
  }
}

function assertMaterial(
  material: any,
): asserts material is Material {
  invariant(
    (material as Material).isMaterial,
    `Expected .material to be of type Material`
  );
}

/**
* Finds all meshes in the given object3d and its children.
*/
function findMeshes(object3d: Object3D): Mesh[] {
  const meshes: Mesh[] = [];
  object3d.traverse((child) => {
    if ((child as Mesh).isMesh) {
      meshes.push(child as Mesh);
    }
  });
  return meshes;
}

function findSprites(object3d: Object3D): Sprite[] {
  const sprites: Sprite[] = [];
  object3d.traverse((child) => {
    if ((child as Sprite).isSprite) {
      sprites.push(child as Sprite);
    }
  });
  return sprites;
}
