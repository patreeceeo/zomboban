const enum RhythmType {
  STEADY,
  FRAME
}

interface Rhythm {
  type: RhythmType;
  index: number;
}

interface SteadyRhythm {
  intervalMs: number;
  intervalId: NodeJS.Timeout;
}

interface FrameRhythm {
  callback: () => void;
}

const ALL_RHYTHMS: Array<Rhythm> = []

const STEADY_RHYTHMS: Array<SteadyRhythm> = [];

const FRAME_RHYTHMS: Array<FrameRhythm> = [];

const FRAME_CALLBACKS: Array<() => void> = [];

export function removeRhythm(id: number) {
  const rhythm = ALL_RHYTHMS[id];
  switch(rhythm.type) {
    case RhythmType.STEADY: {
      const steadyRhythm = STEADY_RHYTHMS[rhythm.index];
      clearInterval(steadyRhythm.intervalId);
      delete STEADY_RHYTHMS[rhythm.index];
      break;
    }
    case RhythmType.FRAME: {
      const frameRhythm = FRAME_RHYTHMS[rhythm.index];
      const index = FRAME_CALLBACKS.indexOf(frameRhythm.callback);
      if(index !== -1) {
        FRAME_CALLBACKS.splice(index, 1);
      }
      delete FRAME_RHYTHMS[rhythm.index];
      break;
    }
  }
  delete ALL_RHYTHMS[id];
}

function handleFrame() {
  FRAME_CALLBACKS.forEach(callback => callback());
  requestAnimationFrame(handleFrame);
}
requestAnimationFrame(handleFrame);

export function addSteadyRhythm(intervalMs: number, callback: () => void): number {
  const rhythm = {
    type: RhythmType.STEADY,
    index: STEADY_RHYTHMS.length
  };
  ALL_RHYTHMS.push(rhythm);
  const intervalId = setInterval(callback, intervalMs);
  STEADY_RHYTHMS.push({
    intervalMs,
    intervalId
  });
  return ALL_RHYTHMS.length - 1;
}

export function addFrameRhythm(callback: () => void): number {
  const rhythm = {
    type: RhythmType.FRAME,
    index: FRAME_RHYTHMS.length
  };
  ALL_RHYTHMS.push(rhythm);
  FRAME_RHYTHMS.push({
    callback
  });
  FRAME_CALLBACKS.push(callback);
  return ALL_RHYTHMS.length - 1;
}

