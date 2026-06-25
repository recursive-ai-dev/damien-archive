import { CharacterSpec } from '../character/types';
import { AnimationClip, AnimationTrack } from './schema';
import { Ease, EasingType } from './easing';
import { SpeciesTraits, getSpeciesTraits, applySpeciesTraits } from './species';
import { EdgeDetectionConfig, detectEdges, deformEdges } from './edgeDetection';
import { FluidMotionConfig, DEFAULT_FLUID_CONFIG, MotionState, createMotionState, updateMotionState, applyFluidMotion } from './fluidMotion';

export interface SecondaryMotionConfig {
  breathing?: {
    amplitude: number;
    frequency: number;
  };
  robeSway?: {
    amplitude: number;
    frequency: number;
    phase: number;
  };
  hairMovement?: {
    amplitude: number;
    frequency: number;
  };
}

export interface AnimationApplierConfig {
  secondaryMotion: SecondaryMotionConfig;
  edgeDetection: EdgeDetectionConfig;
  fluidMotion: FluidMotionConfig;
  speciesName: string;
  enableEdgeDetection: boolean;
  enableFluidMotion: boolean;
}

export class AnimationApplier {
  private animationCache: Map<string, Map<number, CharacterSpec>> = new Map();
  private lastTimeMap: Map<string, number> = new Map();
  private config: AnimationApplierConfig;
  private speciesTraits: SpeciesTraits;
  private motionState: MotionState;
  private lastPosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor(config?: Partial<AnimationApplierConfig>) {
    // Default configuration
    this.config = {
      secondaryMotion: {
        breathing: { amplitude: 0.02, frequency: 2 },
        robeSway: { amplitude: 2, frequency: 2, phase: Math.PI / 4 },
        hairMovement: { amplitude: 1, frequency: 3 }
      },
      edgeDetection: {
        resolution: 24,
        smoothingFactor: 0.7,
        deformationIntensity: 0.5,
        velocitySensitivity: 0.6
      },
      fluidMotion: DEFAULT_FLUID_CONFIG,
      speciesName: 'human',
      enableEdgeDetection: true,
      enableFluidMotion: true,
      ...config
    };

    // Initialize species traits
    this.speciesTraits = getSpeciesTraits(this.config.speciesName);

    // Initialize motion state
    this.motionState = createMotionState();
  }

  /**
   * Set the species for animation
   */
  setSpecies(speciesName: string): void {
    this.config.speciesName = speciesName;
    this.speciesTraits = getSpeciesTraits(speciesName);

    // Clear animation cache when species changes
    this.animationCache.clear();
  }

  /**
   * Update motion state based on character position
   */
  updateMotion(position: { x: number; y: number }): void {
    this.motionState = updateMotionState(this.motionState, position, this.config.fluidMotion);
    this.lastPosition = { ...position };
  }

  private interpolateKey(track: AnimationTrack, t: number): number {
    if (track.keys.length === 0) return 0;
    if (track.keys.length === 1) return track.keys[0].v;

    // Handle t outside [0,1] range
    const clampedT = Math.max(0, Math.min(1, t));
    
    // Find the two keys to interpolate between
    let prevKey = track.keys[0];
    let nextKey = track.keys[track.keys.length - 1];

    for (let i = 0; i < track.keys.length - 1; i++) {
      if (clampedT >= track.keys[i].t && clampedT <= track.keys[i + 1].t) {
        prevKey = track.keys[i];
        nextKey = track.keys[i + 1];
        break;
      }
    }

    // Calculate local t between the two keys
    const localT = (clampedT - prevKey.t) / (nextKey.t - prevKey.t);
    
    // Apply easing
    const easedT = prevKey.ease ? Ease[prevKey.ease](localT) : localT;

    // Interpolate value
    return prevKey.v + (nextKey.v - prevKey.v) * easedT;
  }

  private applyPropertyConstraints(spec: CharacterSpec, prop: string, value: number): void {
    const constraints: Record<string, (val: number, spec: CharacterSpec) => number> = {
      head_rx: (val) => Math.max(4, val),
      head_ry: (val) => Math.max(3, val),
      head_n: (val) => Math.max(1.5, val),
      waist_t: (val) => Math.max(0.35, Math.min(0.65, val)),
      leg_gap: (val) => Math.max(0, val),
      s_half: (val, s) => Math.max(4, Math.min(s.cx - 2, val)),
      w_half: (val, s) => Math.max(2, Math.min(s.s_half, val)),
      h_half: (val, s) => Math.max(4, Math.min(s.cx - 2, val)),
      arm_thickness: (val) => Math.max(1, Math.min(5, val)),
      robe_flare_px: (val) => Math.max(0, val),
      robe_closure: (val) => Math.max(0, Math.min(1, val)),
      robe_len_px: (val, s) => Math.max(0, Math.min(s.leg_h, val)),
    };

    const constraint = constraints[prop];
    if (constraint) {
      (spec as any)[prop] = constraint(value, spec);
    } else {
      console.warn(`No constraint defined for property: ${prop}`);
    }
  }

  /**
   * Apply animation tracks to a character spec
   */
  applyTracks(baseSpec: CharacterSpec, clip: AnimationClip, t: number): CharacterSpec {
    const cacheKey = Math.round(t * 100);
    const clipCache = this.animationCache.get(clip.name);

    if (clipCache && clipCache.has(cacheKey)) {
      return clipCache.get(cacheKey)!;
    }

    // Apply species traits to base spec
    let modifiedSpec = applySpeciesTraits({ ...baseSpec }, this.speciesTraits);

    // Apply each track
    for (const track of clip.tracks) {
      const value = this.interpolateKey(track, t);
      this.applyPropertyConstraints(modifiedSpec, track.prop, value);
    }

    // Apply fluid motion if enabled
    if (this.config.enableFluidMotion) {
      modifiedSpec = applyFluidMotion(
        modifiedSpec,
        clip,
        t,
        this.motionState,
        this.speciesTraits,
        this.config.fluidMotion
      );
    } else {
      // Apply traditional secondary motion
      modifiedSpec = this.applySecondaryMotion(modifiedSpec, t, baseSpec);
    }

    // Apply edge detection and deformation if enabled
    if (this.config.enableEdgeDetection) {
      const edges = detectEdges(modifiedSpec, this.config.edgeDetection);
      const deformedEdges = deformEdges(
        edges,
        this.motionState.velocity,
        this.motionState.acceleration,
        this.config.edgeDetection,
        this.speciesTraits.edgeDeformationFactor
      );

      // Apply edge deformation (handled within fluid motion if that's enabled)
      if (!this.config.enableFluidMotion) {
        // Simple edge deformation for demonstration
        if (deformedEdges.length > 0) {
          // Calculate average deformation
          const avgDeformation = deformedEdges.reduce((sum, edge) => {
            const deformAmount = Math.sqrt(
              edge.normal.x * edge.normal.x + edge.normal.y * edge.normal.y
            ) * edge.curvature;
            return sum + deformAmount;
          }, 0) / deformedEdges.length;

          // Apply simple deformation to relevant properties
          if (modifiedSpec.robe) {
            modifiedSpec.robe_flare_px = Math.max(0, (modifiedSpec.robe_flare_px || 0) + avgDeformation * 2);
          }

          modifiedSpec.s_half = Math.round(modifiedSpec.s_half * (1 + avgDeformation * 0.05));
          modifiedSpec.h_half = Math.round(modifiedSpec.h_half * (1 + avgDeformation * 0.05));
        }
      }
    }

    // Cache the result
    if (!this.animationCache.has(clip.name)) {
      this.animationCache.set(clip.name, new Map());
    }
    this.animationCache.get(clip.name)!.set(cacheKey, modifiedSpec);

    return modifiedSpec;
  }

  /**
   * Apply secondary motion effects (traditional approach)
   */
  applySecondaryMotion(spec: CharacterSpec, t: number, baseSpec: CharacterSpec): CharacterSpec {
    const modifiedSpec = { ...spec };
    const { secondaryMotion } = this.config;

    // Breathing effect - scale torso width
    if (secondaryMotion.breathing) {
      const { amplitude, frequency } = secondaryMotion.breathing;
      const breathingScale = 1 + amplitude * Math.sin(2 * Math.PI * frequency * t);
      modifiedSpec.s_half = Math.round(baseSpec.s_half * breathingScale);
      modifiedSpec.h_half = Math.round(baseSpec.h_half * breathingScale);
    }

    // Robe sway effect
    if (spec.robe && secondaryMotion.robeSway) {
      const { amplitude, frequency, phase } = secondaryMotion.robeSway;
      const swayAmount = amplitude * Math.sin(2 * Math.PI * frequency * t + phase);
      modifiedSpec.robe_flare_px = Math.max(0, spec.robe_flare_px + swayAmount);
    }

    // Hair movement effect
    if (spec.hair && secondaryMotion.hairMovement) {
      const { amplitude, frequency } = secondaryMotion.hairMovement;
      const hairMovement = amplitude * Math.sin(2 * Math.PI * frequency * t);
      modifiedSpec.head_rx = Math.max(4, spec.head_rx + hairMovement);
    }

    // Apply species-specific secondary motion
    switch (this.speciesTraits.bodyType) {
      case 'quadruped':
        // Add tail swaying for quadrupeds if they have a tail movement config
        if (this.speciesTraits.tailMovement) {
          const { amplitude, frequency, phase } = this.speciesTraits.tailMovement;
          const tailSway = amplitude * Math.sin(2 * Math.PI * frequency * t + phase);

          // Apply to robe flare as a proxy for tail movement
          if (spec.robe) {
            modifiedSpec.robe_flare_px = Math.max(0, (modifiedSpec.robe_flare_px || 0) + tailSway);
          }
        }
        break;

      case 'avian':
        // Add wing flapping for avians
        if (this.speciesTraits.wingMovement) {
          const { amplitude, frequency } = this.speciesTraits.wingMovement;
          const wingFlap = amplitude * Math.sin(2 * Math.PI * frequency * t);

          // Apply to arm thickness as a proxy for wing movement
          modifiedSpec.arm_thickness = Math.max(1, Math.min(5, spec.arm_thickness + wingFlap));
        }
        break;

      case 'aquatic':
        // Add fin movement for aquatic creatures
        if (this.speciesTraits.finMovement) {
          const { amplitude, frequency } = this.speciesTraits.finMovement;
          const finWave = amplitude * Math.sin(2 * Math.PI * frequency * t);

          // Apply to torso width as a proxy for fin movement
          modifiedSpec.s_half = Math.round(spec.s_half * (1 + finWave * 0.05));
        }
        break;
    }

    return modifiedSpec;
  }

  /**
   * Blend multiple animations together
   */
  blendAnimations(
    baseSpec: CharacterSpec,
    clips: { clip: AnimationClip; weight: number }[],
    t: number
  ): CharacterSpec {
    let blendedSpec = { ...baseSpec };
    let totalWeight = 0;

    // Apply species traits to base spec
    blendedSpec = applySpeciesTraits(blendedSpec, this.speciesTraits);

    for (const { clip, weight } of clips) {
      if (weight <= 0) continue;
      
      const animatedSpec = this.applyTracks(baseSpec, clip, t);
      
      // Apply weighted blending
      for (const key in animatedSpec) {
        if (key === 'robe' || key === 'hair') continue; // Skip non-numeric properties
        
        const baseValue = (baseSpec as any)[key];
        const animValue = (animatedSpec as any)[key];
        
        (blendedSpec as any)[key] = baseValue + (animValue - baseValue) * weight;
      }
      
      totalWeight += weight;
    }

    // Normalize if totalWeight > 1
    if (totalWeight > 1) {
      for (const key in blendedSpec) {
        if (key === 'robe' || key === 'hair') continue;
        
        const baseValue = (baseSpec as any)[key];
        const blendedValue = (blendedSpec as any)[key];
        
        (blendedSpec as any)[key] = baseValue + (blendedValue - baseValue) / totalWeight;
      }
    }

    return blendedSpec;
  }
}