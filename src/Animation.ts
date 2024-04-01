import {
  AnimationClip as THREEAnimationClip,
  KeyframeTrack as THREEKeyframeTrack
} from "three";

/** @file necessary because THREE's types are messed up */

export interface IAnimation {
  playing: boolean;
  clipIndex: number;
  clips: IAnimationClip<any>[];
}

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
  constructor(name = "", duration = -1, tracks = [] as KeyframeTrack[]) {
    super(name, duration, tracks);
  }
  static parse(json: IAnimationClip<any>): AnimationClip {
    return super.parse(json) as any;
  }
  static toJSON(clip: AnimationClip): IAnimationClip<any> {
    const json = super.toJSON(clip);
    for (const track of clip.tracks) {
      track.type = "string";
    }
    return json;
  }
}

export class KeyframeTrack extends THREEKeyframeTrack {
  type = "string";
  // THREE uses this instead of `type` when serializing, for some reason
  ValueTypeName = "string";
  constructor(name: string, times: Float32Array, values: string[]) {
    super(name, times, values as any);
    this.values = values as any;
  }
}
