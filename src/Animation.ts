/** @file Animation wrapper for three.js AnimationClip */

import { AnimationClip } from "three";
import type { AnimationClipJSON, KeyframeTrackJSON, AnimationBlendMode, InterpolationModes } from "three";

export interface IAnimation {
  playing: boolean;
  clipIndex: number;
  clips: AnimationClip[];
}

export interface IAnimationJson {
  playing: boolean;
  clipIndex: number;
  clips: AnimationClipJson[];
}

export class Animation implements IAnimation {
  playing = false;
  clipIndex = 0;
  constructor(readonly clips: AnimationClip[] = []) {}
}

export class AnimationJson implements IAnimationJson {
  constructor(
    readonly clips: AnimationClipJson[] = [],
    readonly playing = false,
    readonly clipIndex = 0
  ) {}

  static fromJson(data: IAnimationJson): Animation {
    return new Animation(
      data.clips.map((json) => AnimationClipJson.parse(json))
    );
  }

  static indexOfClip(animation: Animation, clipName: string) {
    for (let index = 0; index < animation.clips.length; index++) {
      const clip = animation.clips[index];
      if (clip.name === clipName) {
        return index;
      }
    }
    return -1;
  }
}

type IAnimationClipJson = Omit<AnimationClipJSON, "tracks"> & {
  tracks: KeyframeTrackJson[];
};

// Helper classes for creating animation data
export class AnimationClipJson implements IAnimationClipJson {
  static parse(json: AnimationClipJson): AnimationClip {
    return AnimationClip.parse(json as any);
  }
  static fromClip(clip: AnimationClip): AnimationClipJson {
    return AnimationClip.toJSON(clip) as any;
  }
  constructor(
    readonly name: string,
    readonly duration: number = -1,
    readonly tracks: KeyframeTrackJson[] = [],
    readonly uuid: string = "",
    readonly blendMode: AnimationBlendMode = 0 as AnimationBlendMode
  ) {}
}

type IKeyframeTrackJson = Omit<KeyframeTrackJSON, "values"> & {
  values: string[];
};

export class KeyframeTrackJson implements IKeyframeTrackJson {
  readonly type: string;
  constructor(
    readonly name: string,
    valueTypeName: string,
    readonly times: number[],
    readonly values: string[],
    readonly interpolation?: InterpolationModes
  ) {
    this.type = valueTypeName;
  }
}

