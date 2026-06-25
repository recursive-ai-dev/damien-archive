import { EasingType } from './easing';

export interface AnimationKeyframe {
  t: number;        // Time in [0,1]
  v: number;        // Value
  ease?: EasingType; // Easing function to next keyframe
}

export interface AnimationTrack {
  prop: string;                 // Property to animate (e.g., "head_rx", "waist_t")
  keys: AnimationKeyframe[];    // Keyframes for this track
  weight?: number;              // Track weight for blending (default: 1.0)
}

export interface AnimationClip {
  name: string;                 // Clip name
  durationMs: number;           // Duration in milliseconds
  loop?: boolean;               // Whether to loop (default: false)
  speed?: number;               // Playback speed multiplier (default: 1.0)
  blendTime?: number;           // Blend in/out time in milliseconds (default: 0)
  tracks: AnimationTrack[];     // Animation tracks
  events?: AnimationEvent[];    // Events triggered during animation
}

export interface AnimationEvent {
  time: number;     // Time in [0,1] when event triggers
  name: string;     // Event name
  data?: any;       // Optional event data
}

export interface AnimationState {
  clip: AnimationClip;
  time: number;     // Current time in [0,1]
  weight: number;   // Blend weight (0-1)
  speed: number;    // Playback speed
  paused: boolean;  // Whether animation is paused
  loop: boolean;    // Whether to loop
}