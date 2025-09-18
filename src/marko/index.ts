
// Template registry with cache busting support

import {State, Mode} from '../state';
import {JumpToMessage} from '../messages';
import {menuRoute} from '../routes';

export interface IMarkoTemplateInfo {
  loader: (cacheBust?: string) => Promise<{default: Marko.Template<any>}>;
  placeholderId: string;
  getProps: (state: State) => any;
}

export const MARKO_TEMPLATES = {
  DevToolsPanel: {
    loader: (cacheBust?: string) =>
      cacheBust ? import('./DevToolsPanel.marko' + cacheBust) : import('./DevToolsPanel.marko'),
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
  ToolbarSection: {
    loader: (cacheBust?: string) =>
      cacheBust ? import('./ToolbarSection.marko' + cacheBust) : import('./ToolbarSection.marko'),
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
      cacheBust ? import('./SignInForm.marko' + cacheBust) : import('./SignInForm.marko'),
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
      cacheBust ? import('./MainMenu.marko' + cacheBust) : import('./MainMenu.marko'),
    placeholderId: 'main-menu-placeholder',
    getProps: (state: State) => ({
      isVisible: state.route.current.equals(menuRoute),
      isAtStart: state.isAtStart,
    })
  }
} as const;
