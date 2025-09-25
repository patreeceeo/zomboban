import { requestAnimationFrame, cancelAnimationFrame, setInterval, clearInterval } from "./globals";
import { invariant } from "./Error";

export abstract class Rhythm {
  protected callback: Function;

  constructor(callback: Function) {
    invariant(callback !== undefined && callback !== null, "Rhythm callback must be defined");
    this.callback = callback;
  }

  abstract start(): void;
  abstract stop(): void;
}

export enum RhythmType {
  Frame = "Frame",
  FixedStep = "FixedStep"
}

export class FrameRhythm extends Rhythm {
  private startTime?: number;
  private previousTime: number = 0;
  private animationId?: number;
  private frameCallback: (deltaTime: number, elapsedTime: number) => void;

  constructor(callback: (deltaTime: number, elapsedTime: number) => void) {
    super(callback);
    this.frameCallback = callback;
  }

  private handleFrame = (elapsedTime: number): void => {
    if (this.startTime === undefined) {
      this.startTime = elapsedTime;
    }
    // Only call callback after we have a previous time to calculate delta from
    if (this.previousTime !== 0 && this.previousTime !== elapsedTime) {
      const deltaTime = elapsedTime - this.previousTime;
      this.frameCallback(deltaTime, elapsedTime);
    }
    this.previousTime = elapsedTime;
    this.animationId = requestAnimationFrame(this.handleFrame);
  }

  start(): void {
    invariant(this.animationId === undefined, "FrameRhythm is already running");
    this.animationId = requestAnimationFrame(this.handleFrame);
  }

  stop(): void {
    invariant(this.animationId !== undefined, "FrameRhythm is not running");
    cancelAnimationFrame(this.animationId);
    this.animationId = undefined;
    this.startTime = undefined;
    this.previousTime = 0;
  }
}

export class SteadyRhythm extends Rhythm {
  private intervalMs: number;
  private intervalId?: NodeJS.Timeout;
  private steadyCallback: () => void;

  constructor(callback: () => void, intervalMs: number) {
    super(callback);
    invariant(intervalMs > 0, "Interval must be positive");
    this.steadyCallback = callback;
    this.intervalMs = intervalMs;
  }

  start(): void {
    invariant(this.intervalId === undefined, "SteadyRhythm is already running");
    this.intervalId = setInterval(this.steadyCallback, this.intervalMs);
  }

  stop(): void {
    invariant(this.intervalId !== undefined, "SteadyRhythm is not running");
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  }
}

export class FixedStepRhythm extends Rhythm {
  private fixedDelta: number;
  private maxFrameTime: number;
  private accumulator: number = 0;
  private startTime?: number;
  private previousTime: number = 0;
  private animationId?: number;
  private simulationCallback: (fixedDelta: number) => void;

  constructor(callback: (fixedDelta: number) => void, fixedDelta: number, maxFrameTime: number = 250) {
    super(callback);
    invariant(fixedDelta > 0, "Fixed delta must be positive");
    invariant(maxFrameTime > 0, "Max frame time must be positive");
    invariant(maxFrameTime >= fixedDelta, "Max frame time must be at least as large as fixed delta");
    this.simulationCallback = callback;
    this.fixedDelta = fixedDelta;
    this.maxFrameTime = maxFrameTime;
  }

  private handleFrame = (elapsedTime: number): void => {
    if (this.startTime === undefined) {
      this.startTime = elapsedTime;
    }

    // Only process after we have a previous time to calculate delta from
    if (this.previousTime !== 0 && this.previousTime !== elapsedTime) {
      const frameTime = Math.min(elapsedTime - this.previousTime, this.maxFrameTime);
      this.accumulator += frameTime;

      // Run fixed timesteps while we have accumulated enough time
      while (this.accumulator >= this.fixedDelta) {
        this.simulationCallback(this.fixedDelta);
        this.accumulator -= this.fixedDelta;
      }
    }

    this.previousTime = elapsedTime;
    this.animationId = requestAnimationFrame(this.handleFrame);
  }

  start(): void {
    invariant(this.animationId === undefined, "FixedStepRhythm is already running");
    this.animationId = requestAnimationFrame(this.handleFrame);
  }

  stop(): void {
    invariant(this.animationId !== undefined, "FixedStepRhythm is not running");
    cancelAnimationFrame(this.animationId);
    this.animationId = undefined;
    this.startTime = undefined;
    this.previousTime = 0;
    this.accumulator = 0;
  }
}
