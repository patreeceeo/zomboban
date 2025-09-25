import { System } from "../System";
import { State } from "../state";
import { RhythmType } from "../Rhythm";
import { LoadingItem } from "./LoadingSystem";

export class AudioSystem extends System<State> {
  rhythmType = RhythmType.Frame;

  async start(state: State) {
    const musicPath = "/assets/music/01.mp3";

    const loadingItem = new LoadingItem("background music", async () => {
      try {
        const audio = new Audio(musicPath);
        audio.loop = true;
        audio.volume = state.audio.volume;

        // Preload the audio
        await new Promise<void>((resolve, reject) => {
          audio.addEventListener("canplaythrough", () => resolve(), { once: true });
          audio.addEventListener("error", (e) => reject(e), { once: true });
          audio.load();
        });

        state.audio.backgroundMusic = audio;
        state.audio.musicLoaded = true;
      } catch (error) {
        console.error("Failed to load background music:", error);
        // Continue without music if loading fails
        state.audio.musicLoaded = false;
      }
    });

    state.loadingItems.add(loadingItem);
  }

  update(state: State) {
    const { audio, time } = state;

    if (!audio.musicLoaded || !audio.backgroundMusic) {
      return;
    }

    // Control playback based on pause state
    if (time.isPaused) {
      if (!audio.backgroundMusic.paused) {
        audio.backgroundMusic.pause();
      }
    } else {
      if (audio.backgroundMusic.paused) {
        // Handle potential autoplay restrictions
        audio.backgroundMusic.play().catch(error => {
          // Autoplay was prevented, will try again on user interaction
          console.log("Autoplay prevented, will retry on user interaction:", error);
        });
      }
    }

    // Update volume and mute state
    audio.backgroundMusic.volume = audio.muted ? 0 : audio.volume;
  }

  stop(state: State) {
    if (state.audio.backgroundMusic) {
      state.audio.backgroundMusic.pause();
      state.audio.backgroundMusic.currentTime = 0;
      state.audio.backgroundMusic = undefined;
    }
    state.audio.musicLoaded = false;
  }
}