export class TimeState {
  frameDelta = 0;
  fixedDelta = 1000 / 60 // 60 FPS
  time = 0;
  timeScale = 1;
  isPaused = false;
}
