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