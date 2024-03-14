import {
  AnimationClip as THREEAnimationClip,
  KeyframeTrack as THREEKeyframeTrack
} from "three";

/** @file necessary because THREE's types are messed up */

interface IKeyframeTrack<Value> {
  name: string;
  type: "string";
  times: Float32Array;
  values: Value[];
}

export interface IAnimationClip<TrackValue> {
  name: string;
  tracks: IKeyframeTrack<TrackValue>[];
  /**
   * @default -1
   */
  duration: number;
}

export class Animation {
  playing = false;
  clipIndex = 0;
  constructor(readonly clips = [] as AnimationClip[]) {}
}

export class AnimationClip extends THREEAnimationClip {
  declare tracks: KeyframeTrack[];
  static parse(json: any): AnimationClip {
    return super.parse(json) as any;
  }
}

export class KeyframeTrack extends THREEKeyframeTrack {
  type = "string";
  constructor(name: string, times: Float32Array, values: string[]) {
    super(name, times, values as any);
    this.values = values as any;
  }
}
