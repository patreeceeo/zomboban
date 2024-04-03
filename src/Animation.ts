/** @file necessary because THREE's types are messed up */

import { AnimationClip, KeyframeTrack } from "three";

export interface IAnimation<Values = Float32Array, Times = Float32Array> {
  playing: boolean;
  clipIndex: number;
  clips: IAnimationClip<Values, Times>[];
}

export interface IAnimationJson<Values = Float32Array, Times = Float32Array> {
  playing: boolean;
  clipIndex: number;
  clips: IAnimationClipJson<Values, Times>[];
}

interface IKeyframeTrackJson<Values = Float32Array, Times = Float32Array> {
  name: string;
  ValueTypeName: string;
  times: Times;
  values: Values;
}

export type IKeyframeTrack<
  Values = Float32Array,
  Times = Float32Array
> = IKeyframeTrackJson<Values, Times> &
  Omit<KeyframeTrack, keyof IKeyframeTrackJson>;

interface IAnimationClipJson<Values = Float32Array, Times = Float32Array> {
  name: string;
  tracks: IKeyframeTrackJson<Values, Times>[];
  /**
   * @default -1
   */
  duration: number;
}

interface IAnimationClipPartial<Values = Float32Array, Times = Float32Array> {
  tracks: IKeyframeTrack<Values, Times>[];
}

export type IAnimationClip<
  Values = Float32Array,
  Times = Float32Array
> = IAnimationClipPartial<Values, Times> &
  Omit<AnimationClip, keyof IAnimationClipPartial>;

export class Animation<Values = Float32Array, Times = Float32Array>
  implements IAnimation<Values, Times>
{
  playing = false;
  clipIndex = 0;
  constructor(readonly clips = [] as IAnimationClip<Values, Times>[]) {}
}

export class AnimationJson<Values extends any[], Tracks>
  implements IAnimationJson<Values, Tracks>
{
  constructor(
    readonly clips = [] as IAnimationClipJson<Values, Tracks>[],
    readonly playing = false,
    readonly clipIndex = 0
  ) {
    return new Animation(
      clips.map((json) => {
        const clip = AnimationClip.parse(json);
        for (const track of clip.tracks) {
          (track as any).type = track.ValueTypeName;
        }
        return clip;
      }) as unknown as IAnimationClip<Values, Tracks>[]
    );
  }
}

export class AnimationClipJson<Values extends any[] = any[]>
  implements IAnimationClipJson<Values, number[]>
{
  constructor(
    readonly name = "",
    readonly duration = -1,
    readonly tracks = [] as IKeyframeTrackJson<Values, number[]>[]
  ) {}
}

export class KeyframeTrackJson<Values extends any[] = any[]>
  implements IKeyframeTrackJson<Values, number[]>
{
  type: string;
  constructor(
    readonly name: string,
    readonly ValueTypeName: string,
    readonly times: number[],
    readonly values: Values
  ) {
    this.type = ValueTypeName;
  }
}
