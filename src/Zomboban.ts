import {Mode, State} from "./state";
import {
  ActionSystem,
  AnimationSystem,
  BehaviorSystem,
  EditorSystem,
  EntityInspectorSystem,
  MarkoRenderSystem,
  GameSystem,
  InputSystem,
  LoadingSystem,
  ModelSystem,
  RenderSystem,
  SceneManagerSystem,
  TileSystem,
  type KeyMapping
} from "./systems";
import {
  decreaseTimeScale,
  handleEditorRedo,
  handleEditorUndo,
  handleRestart,
  handleToggleEditor,
  increaseTimeScale,
  toggleDebugTiles
} from "./inputs";
import {combineKeys, Key, KeyCombo} from "./Input";
import {InSceneTag, TransformComponent} from "./components";
import {AmbientLight, DirectionalLight, OrthographicCamera} from "three";
import {addFrameRhythmCallback, addSteadyRhythmCallback, removeRhythmCallback, startFrameRhythms} from "./Rhythm";
import {VIEWPORT_SIZE} from "./constants";
import {editorRoute, gameRoute, menuRoute, ROUTES} from "./routes";
import {JumpToMessage} from "./messages";

const BASIC_SYSTEMS = [
  LoadingSystem,
  SceneManagerSystem,
  TileSystem,
  BehaviorSystem,
  ActionSystem,
  ModelSystem,
  AnimationSystem,
  RenderSystem,
  InputSystem,
  EntityInspectorSystem,
  MarkoRenderSystem,
];

export function registerRouteSystems() {
  ROUTES.register(gameRoute, [...BASIC_SYSTEMS, GameSystem])
    .registerWithGuard(editorRoute, [...BASIC_SYSTEMS,
                       MarkoRenderSystem,
                      EditorSystem,
    ], (state) => state.isSignedIn)
    .register(menuRoute, [LoadingSystem, MarkoRenderSystem]);
}

const IMAGE_PATH = "/assets/images";
const MODEL_PATH = "/assets/models";

export const ASSET_IDS = {
  editorNormalCursor: `${IMAGE_PATH}/normal_cursor.gif`,
  editorReplaceCursor: `${IMAGE_PATH}/replace_cursor.gif`,
  toggleButton: `${IMAGE_PATH}/green_button.gif`,
  toggleButtonPress: `${IMAGE_PATH}/green_button_press.gif`,
  toggleWall: `${MODEL_PATH}/wall_green.glb`,
  toggleWallOff: `${IMAGE_PATH}/green_wall_off.gif`,
  player: `${MODEL_PATH}/player.glb`,
  block: `${MODEL_PATH}/block.glb`,
  wall: `${MODEL_PATH}/wall_red.glb`,
  monster: `${MODEL_PATH}/monster.glb`,
  terminal: `${MODEL_PATH}/terminal.glb`,
  fire: `${MODEL_PATH}/fire.glb`
};

export async function start(state: State) {
  const { keyMapping } = state.input;

  registerInputHandlers(keyMapping);

  lights(state);
  camera(state);
  action(state);
}

const mappingPairs = [
    [Key.Space, handleToggleEditor],
    [combineKeys(Key.Shift, Key.r), handleRestart],
    [Key.u, handleEditorUndo],
    [combineKeys(Key.Shift, Key.u), handleEditorRedo],
    [combineKeys(Key.Shift, Key.ArrowDown), decreaseTimeScale],
    [combineKeys(Key.Shift, Key.ArrowUp), increaseTimeScale],
    [combineKeys(Key.i, Key.t), toggleDebugTiles],
  ] as const

export function registerInputHandlers(mapping: KeyMapping<State>) {
  for (const [key, handler] of mappingPairs) {
    mapping.add(key as KeyCombo, handler);
  }
}

export function registerMarkoTemplates(state: State) {
  state.markoTemplates = {
    DevToolsPanel: {
      loader: (cacheBust?: string) =>
        cacheBust ? import('./marko/DevToolsPanel.marko' + cacheBust) : import('./marko/DevToolsPanel.marko'),
      placeholderId: 'dev-tools-placeholder',
      getProps: (state: State) => ({
        isOpen: state.devTools.isOpen,
        inspectorData: Array.from(state.devTools.entityData.values()),
        componentNames: state.devTools.componentNames,
        selectedEntityIds: Array.from(state.devTools.selectedEntityIds),
        currentLevelId: state.currentLevelId,
        onSelectEntity: (entityId: number) => {
          if(state.mode !== Mode.Edit) return;

          // Jump cursor to the selected entity
          for(const cursor of state.cursorEntities) {
            const selectedEntity = state.world.getEntity(entityId) as any
            const behavior = state.behavior.get(cursor.behaviorId);
            behavior.onReceive(new JumpToMessage(selectedEntity), cursor, state);
          }
        },
        onLevelChange: (levelIndex: number) => {
          state.currentLevelId = levelIndex;
        },
        timeScale: state.time.timeScale,
        onTimeScaleChange: (value: number) => {
          state.time.timeScale = value;
        },
      })
    },
    TouchCursor: {
      loader: (cacheBust?: string) =>
        cacheBust ? import('./marko/TouchCursor.marko' + cacheBust) : import('./marko/TouchCursor.marko'),
      placeholderId: 'touch-cursor-placeholder',
      getProps: (state: State) => {
        if (!state.input.touchStartPosition) {
          return {
            isVisible: false,
            position: { x: 0, y: 0 },
            activeDirection: state.input.currentTouchDirection
          };
        }

        const canvas = state.render.canvas;
        const canvasBounds = canvas.getBoundingClientRect();

        // Transform canvas-relative coordinates to screen pixel coordinates
        const screenX = state.input.touchStartPosition.x + canvas.clientWidth / 2 + canvasBounds.left;
        const screenY = state.input.touchStartPosition.y + canvas.clientHeight / 2 + canvasBounds.top;

        return {
          isVisible: state.input.isTouching,
          position: { x: screenX, y: screenY },
          activeDirection: state.input.currentTouchDirection
        };
      }
    },
    ToolbarSection: {
      loader: (cacheBust?: string) =>
        cacheBust ? import('./marko/ToolbarSection.marko' + cacheBust) : import('./marko/ToolbarSection.marko'),
      placeholderId: 'toolbar-placeholder',
      getProps: (state: State) => ({
        isSignedIn: state.isSignedIn,
        currentLevelId: state.currentLevelId,
        isPaused: state.time.isPaused,
        state: state
      })
    },
    SignInForm: {
      loader: (cacheBust?: string) =>
        cacheBust ? import('./marko/SignInForm.marko' + cacheBust) : import('./marko/SignInForm.marko'),
      placeholderId: 'sign-in-form-placeholder',
      getProps: (state: State) => ({
        isOpen: state.isSignInFormOpen,
        onClose: () => {
          state.isSignInFormOpen = false;
        },
        onSignIn: () => {
          state.isSignedIn = true;
        }
      })
    },
    MainMenu: {
      loader: (cacheBust?: string) =>
        cacheBust ? import('./marko/MainMenu.marko' + cacheBust) : import('./marko/MainMenu.marko'),
      placeholderId: 'main-menu-placeholder',
      getProps: (state: State) => ({
        isVisible: state.route.current.equals(menuRoute),
        isAtStart: state.isAtStart,
      })
    }
  }
}

export function lights(state: State) {
  const lights = state.world.addEntity();
  TransformComponent.add(lights);
  const { transform: lightTransform } = lights;
  InSceneTag.add(lights);
  lightTransform.add(new DirectionalLight(0xffffff, 5));
  lightTransform.add(new AmbientLight(0xffffff, 2));
  lightTransform.position.set(0, -100, 595);
  lightTransform.lookAt(0, 0, 0);
}

export function camera(state: State) {
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

  state.render.camera = camera;
  state.render.cameraOffset.set(0, -450, 1000);
}

const abortController = new AbortController();
function action(
  state: State
) {
  const { systemManager } = state;
  const steadyRhythm = addSteadyRhythmCallback(100, () => systemManager.updateServices());
  const frameRhythm = addFrameRhythmCallback((dt) => {
    const { timeScale } = state.time;
    state.time.frameDelta = dt * timeScale;
    // NOTE: state.time is updated in ActionSystem
    systemManager.update();
  });

  startFrameRhythms();

  abortController.abort();
  window.addEventListener("blur", () => {
    removeRhythmCallback(steadyRhythm);
    removeRhythmCallback(frameRhythm);
  }, {signal: abortController.signal});

  window.addEventListener("focus", () => action(state), {signal: abortController.signal})
}
