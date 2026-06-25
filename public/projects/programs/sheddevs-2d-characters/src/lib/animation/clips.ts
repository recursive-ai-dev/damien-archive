import { AnimationClip } from './schema';
import { SpeciesTraits } from './species';

export interface ClipOptions {
  intensity?: number;
  speed?: number;
  amplitude?: number;
}

/**
 * Creates an idle animation clip with species-specific adjustments
 */
export const createIdleClip = (
  direction: 'down' | 'left' | 'up' | 'right' = 'down',
  options?: ClipOptions,
  speciesTraits?: SpeciesTraits
): AnimationClip => {
  const { intensity = 1, speed = 1 } = options || {};
  const durationMs = Math.round(1000 / speed);
  
  // Apply species-specific adjustments
  let intensityMod = intensity;
  let speedMod = speed;

  if (speciesTraits) {
    // Adjust intensity based on species traits
    intensityMod *= speciesTraits.secondaryMotionIntensity;

    // Adjust speed based on species weight
    switch (speciesTraits.weight) {
      case 'light': speedMod *= 1.2; break;
      case 'heavy': speedMod *= 0.8; break;
    }
  }

  return {
    name: `idle_${direction}`,
    durationMs: Math.round(durationMs / speedMod),
    loop: true,
    tracks: [
      {
        prop: 'head_rx',
        keys: [
          { t: 0, v: 12, ease: 'sineInOut' },
          { t: 0.5, v: 12 + intensityMod, ease: 'sineInOut' },
          { t: 1, v: 12, ease: 'sineInOut' }
        ]
      },
      {
        prop: 'waist_t',
        keys: [
          { t: 0, v: 0.5, ease: 'sineInOut' },
          { t: 0.5, v: 0.5 + (0.02 * intensityMod), ease: 'sineInOut' },
          { t: 1, v: 0.5, ease: 'sineInOut' }
        ]
      },
      {
        prop: 's_half',
        keys: [
          { t: 0, v: 16, ease: 'sineInOut' },
          { t: 0.5, v: 16 + intensityMod, ease: 'sineInOut' },
          { t: 1, v: 16, ease: 'sineInOut' }
        ]
      }
    ]
  };
};

/**
 * Creates a walk animation clip with species-specific adjustments
 */
export const createWalkClip = (
  direction: 'down' | 'left' | 'up' | 'right' = 'down',
  options?: ClipOptions,
  speciesTraits?: SpeciesTraits
): AnimationClip => {
  const { intensity = 1, speed = 1, amplitude = 1 } = options || {};
  let durationMs = Math.round(800 / speed);
  
  // Apply species-specific adjustments
  let intensityMod = intensity;
  let speedMod = speed;
  let amplitudeMod = amplitude;

  if (speciesTraits) {
    // Adjust intensity based on species traits
    intensityMod *= speciesTraits.secondaryMotionIntensity;

    // Adjust amplitude based on gait
    switch (speciesTraits.gait) {
      case 'bouncy': amplitudeMod *= 1.3; break;
      case 'lumbering': amplitudeMod *= 0.8; break;
      case 'graceful': amplitudeMod *= 0.7; break;
      case 'erratic': amplitudeMod *= 1.2; break;
    }

    // Adjust speed based on movement style
    switch (speciesTraits.movementStyle) {
      case 'bipedal': break; // Default
      case 'quadrupedal': speedMod *= 1.2; break;
      case 'slithering': speedMod *= 0.7; break;
      case 'flying': speedMod *= 1.3; break;
      case 'swimming': speedMod *= 0.9; break;
      case 'hopping': speedMod *= 1.1; break;
    }

    // Adjust duration
    durationMs = Math.round(durationMs / speedMod);
  }

  // Base walk animation
  const baseClip: AnimationClip = {
    name: `walk_${direction}`,
    durationMs,
    loop: true,
    tracks: [
      {
        prop: 'leg_gap',
        keys: [
          { t: 0, v: 2, ease: 'quadInOut' },
          { t: 0.25, v: 2 + (6 * amplitudeMod), ease: 'quadInOut' },
          { t: 0.5, v: 2, ease: 'quadInOut' },
          { t: 0.75, v: 0, ease: 'quadInOut' },
          { t: 1, v: 2, ease: 'quadInOut' }
        ]
      },
      {
        prop: 'head_rx',
        keys: [
          { t: 0, v: 12, ease: 'bounceOut' },
          { t: 0.25, v: 12 + intensityMod, ease: 'bounceOut' },
          { t: 0.5, v: 12, ease: 'bounceOut' },
          { t: 0.75, v: 12 - intensityMod, ease: 'bounceOut' },
          { t: 1, v: 12, ease: 'bounceOut' }
        ]
      },
      {
        prop: 'robe_flare_px',
        keys: [
          { t: 0, v: 0, ease: 'elasticOut' },
          { t: 0.25, v: 3 * amplitudeMod, ease: 'elasticOut' },
          { t: 0.5, v: 0, ease: 'elasticOut' },
          { t: 0.75, v: 2 * amplitudeMod, ease: 'elasticOut' },
          { t: 1, v: 0, ease: 'elasticOut' }
        ]
      },
      {
        prop: 's_half',
        keys: [
          { t: 0, v: 16, ease: 'quadOut' },
          { t: 0.25, v: 16 + intensityMod, ease: 'quadOut' },
          { t: 0.5, v: 16, ease: 'quadOut' },
          { t: 0.75, v: 16 - intensityMod, ease: 'quadOut' },
          { t: 1, v: 16, ease: 'quadOut' }
        ]
      }
    ]
  };

  // Add species-specific tracks
  if (speciesTraits) {
    switch (speciesTraits.bodyType) {
      case 'quadruped':
        // Add more torso movement for quadrupeds
        baseClip.tracks.push({
          prop: 'h_half',
          keys: [
            { t: 0, v: 12, ease: 'quadOut' },
            { t: 0.25, v: 12 + intensityMod * 0.5, ease: 'quadOut' },
            { t: 0.5, v: 12, ease: 'quadOut' },
            { t: 0.75, v: 12 - intensityMod * 0.5, ease: 'quadOut' },
            { t: 1, v: 12, ease: 'quadOut' }
          ]
        });
        break;

      case 'avian':
        // Add arm/wing movement for birds
        baseClip.tracks.push({
          prop: 'arm_thickness',
          keys: [
            { t: 0, v: 2, ease: 'sineInOut' },
            { t: 0.25, v: 3, ease: 'sineInOut' },
            { t: 0.5, v: 2, ease: 'sineInOut' },
            { t: 0.75, v: 3, ease: 'sineInOut' },
            { t: 1, v: 2, ease: 'sineInOut' }
          ]
        });
        break;

      case 'insectoid':
        // Add erratic head movement for insects
        baseClip.tracks.push({
          prop: 'head_ry',
          keys: [
            { t: 0, v: 8, ease: 'elasticOut' },
            { t: 0.3, v: 9, ease: 'elasticOut' },
            { t: 0.5, v: 8, ease: 'elasticOut' },
            { t: 0.7, v: 7, ease: 'elasticOut' },
            { t: 1, v: 8, ease: 'elasticOut' }
          ]
        });
        break;
    }

    // Add gait-specific tracks
    switch (speciesTraits.gait) {
      case 'bouncy':
        // Enhance leg movement for bouncy gait
        baseClip.tracks.push({
          prop: 'leg_h',
          keys: [
            { t: 0, v: 20, ease: 'bounceOut' },
            { t: 0.25, v: 18, ease: 'bounceOut' },
            { t: 0.5, v: 20, ease: 'bounceOut' },
            { t: 0.75, v: 18, ease: 'bounceOut' },
            { t: 1, v: 20, ease: 'bounceOut' }
          ]
        });
        break;

      case 'lumbering':
        // Add waist movement for lumbering gait
        baseClip.tracks.push({
          prop: 'waist_t',
          keys: [
            { t: 0, v: 0.5, ease: 'quadInOut' },
            { t: 0.25, v: 0.55, ease: 'quadInOut' },
            { t: 0.5, v: 0.5, ease: 'quadInOut' },
            { t: 0.75, v: 0.45, ease: 'quadInOut' },
            { t: 1, v: 0.5, ease: 'quadInOut' }
          ]
        });
        break;
    }
  }

  return baseClip;
};

/**
 * Creates a run animation clip with species-specific adjustments
 */
export const createRunClip = (
  direction: 'down' | 'left' | 'up' | 'right' = 'down',
  options?: ClipOptions,
  speciesTraits?: SpeciesTraits
): AnimationClip => {
  const { intensity = 1.5, speed = 1.3, amplitude = 1.5 } = options || {};
  let durationMs = Math.round(600 / speed);
  
  // Apply species-specific adjustments
  let intensityMod = intensity;
  let speedMod = speed;
  let amplitudeMod = amplitude;

  if (speciesTraits) {
    // Adjust intensity based on species traits
    intensityMod *= speciesTraits.secondaryMotionIntensity;

    // Adjust amplitude based on gait
    switch (speciesTraits.gait) {
      case 'bouncy': amplitudeMod *= 1.5; break;
      case 'lumbering': amplitudeMod *= 0.7; break;
      case 'graceful': amplitudeMod *= 0.8; break;
      case 'erratic': amplitudeMod *= 1.4; break;
    }

    // Adjust speed based on movement style
    switch (speciesTraits.movementStyle) {
      case 'bipedal': break; // Default
      case 'quadrupedal': speedMod *= 1.4; break;
      case 'slithering': speedMod *= 0.6; break;
      case 'flying': speedMod *= 1.5; break;
      case 'swimming': speedMod *= 0.8; break;
      case 'hopping': speedMod *= 1.3; break;
    }

    // Adjust duration
    durationMs = Math.round(durationMs / speedMod);
  }

  // Base run animation
  const baseClip: AnimationClip = {
    name: `run_${direction}`,
    durationMs,
    loop: true,
    tracks: [
      {
        prop: 'leg_gap',
        keys: [
          { t: 0, v: 0, ease: 'cubicInOut' },
          { t: 0.2, v: 12 * amplitudeMod, ease: 'cubicInOut' },
          { t: 0.4, v: 0, ease: 'cubicInOut' },
          { t: 0.6, v: 8 * amplitudeMod, ease: 'cubicInOut' },
          { t: 0.8, v: 0, ease: 'cubicInOut' },
          { t: 1, v: 0, ease: 'cubicInOut' }
        ]
      },
      {
        prop: 'head_rx',
        keys: [
          { t: 0, v: 12, ease: 'backOut' },
          { t: 0.2, v: 12 + (2 * intensityMod), ease: 'backOut' },
          { t: 0.4, v: 12, ease: 'backOut' },
          { t: 0.6, v: 12 - (2 * intensityMod), ease: 'backOut' },
          { t: 0.8, v: 12, ease: 'backOut' },
          { t: 1, v: 12, ease: 'backOut' }
        ]
      },
      {
        prop: 'robe_flare_px',
        keys: [
          { t: 0, v: 0, ease: 'elasticOut' },
          { t: 0.2, v: 6 * amplitudeMod, ease: 'elasticOut' },
          { t: 0.4, v: 0, ease: 'elasticOut' },
          { t: 0.6, v: 4 * amplitudeMod, ease: 'elasticOut' },
          { t: 0.8, v: 0, ease: 'elasticOut' },
          { t: 1, v: 0, ease: 'elasticOut' }
        ]
      }
    ]
  };

  // Add species-specific tracks
  if (speciesTraits) {
    switch (speciesTraits.bodyType) {
      case 'quadruped':
        // Add more torso movement for quadrupeds
        baseClip.tracks.push({
          prop: 's_half',
          keys: [
            { t: 0, v: 16, ease: 'quadOut' },
            { t: 0.2, v: 18, ease: 'quadOut' },
            { t: 0.4, v: 16, ease: 'quadOut' },
            { t: 0.6, v: 17, ease: 'quadOut' },
            { t: 0.8, v: 16, ease: 'quadOut' },
            { t: 1, v: 16, ease: 'quadOut' }
          ]
        });
        break;

      case 'avian':
        // Add rapid wing flapping for birds
        baseClip.tracks.push({
          prop: 'arm_thickness',
          keys: [
            { t: 0, v: 2, ease: 'sineInOut' },
            { t: 0.2, v: 4, ease: 'sineInOut' },
            { t: 0.4, v: 2, ease: 'sineInOut' },
            { t: 0.6, v: 4, ease: 'sineInOut' },
            { t: 0.8, v: 2, ease: 'sineInOut' },
            { t: 1, v: 2, ease: 'sineInOut' }
          ]
        });
        break;

      case 'insectoid':
        // Add rapid head movement for insects
        baseClip.tracks.push({
          prop: 'head_ry',
          keys: [
            { t: 0, v: 8, ease: 'elasticOut' },
            { t: 0.2, v: 10, ease: 'elasticOut' },
            { t: 0.4, v: 8, ease: 'elasticOut' },
            { t: 0.6, v: 6, ease: 'elasticOut' },
            { t: 0.8, v: 8, ease: 'elasticOut' },
            { t: 1, v: 8, ease: 'elasticOut' }
          ]
        });
        break;
    }
  }

  return baseClip;
};

/**
 * Creates a jump animation clip with species-specific adjustments
 */
export const createJumpClip = (
  direction: 'down' | 'left' | 'up' | 'right' = 'down',
  options?: ClipOptions,
  speciesTraits?: SpeciesTraits
): AnimationClip => {
  const { intensity = 1, speed = 1 } = options || {};
  let durationMs = Math.round(1000 / speed);
  
  // Apply species-specific adjustments
  let intensityMod = intensity;
  let speedMod = speed;

  if (speciesTraits) {
    // Adjust intensity based on species traits
    intensityMod *= speciesTraits.secondaryMotionIntensity;

    // Adjust speed based on weight
    switch (speciesTraits.weight) {
      case 'light': speedMod *= 1.3; break;
      case 'medium': break; // Default
      case 'heavy': speedMod *= 0.7; break;
    }

    // Adjust duration
    durationMs = Math.round(durationMs / speedMod);
  }

  // Base jump animation
  const baseClip: AnimationClip = {
    name: `jump_${direction}`,
    durationMs,
    loop: false,
    tracks: [
      {
        prop: 'leg_gap',
        keys: [
          { t: 0, v: 2, ease: 'quadOut' },
          { t: 0.2, v: 0, ease: 'quadOut' },
          { t: 0.5, v: 0, ease: 'quadOut' },
          { t: 0.8, v: 8, ease: 'quadIn' },
          { t: 1, v: 2, ease: 'quadIn' }
        ]
      },
      {
        prop: 'head_rx',
        keys: [
          { t: 0, v: 12, ease: 'backOut' },
          { t: 0.2, v: 10, ease: 'backOut' },
          { t: 0.5, v: 10, ease: 'backOut' },
          { t: 0.8, v: 14, ease: 'backOut' },
          { t: 1, v: 12, ease: 'backOut' }
        ]
      },
      {
        prop: 's_half',
        keys: [
          { t: 0, v: 16, ease: 'elasticOut' },
          { t: 0.2, v: 14, ease: 'elasticOut' },
          { t: 0.5, v: 14, ease: 'elasticOut' },
          { t: 0.8, v: 18, ease: 'elasticOut' },
          { t: 1, v: 16, ease: 'elasticOut' }
        ]
      }
    ]
  };

  // Add species-specific tracks
  if (speciesTraits) {
    switch (speciesTraits.movementStyle) {
      case 'hopping':
        // Enhanced jump for hopping creatures
        baseClip.tracks.push({
          prop: 'leg_h',
          keys: [
            { t: 0, v: 20, ease: 'backOut' },
            { t: 0.2, v: 18, ease: 'backOut' },
            { t: 0.5, v: 16, ease: 'backOut' },
            { t: 0.8, v: 22, ease: 'backOut' },
            { t: 1, v: 20, ease: 'backOut' }
          ]
        });
        break;

      case 'flying':
        // Wing flap for flying creatures
        baseClip.tracks.push({
          prop: 'arm_thickness',
          keys: [
            { t: 0, v: 2, ease: 'elasticOut' },
            { t: 0.2, v: 4, ease: 'elasticOut' },
            { t: 0.5, v: 3, ease: 'elasticOut' },
            { t: 0.8, v: 4, ease: 'elasticOut' },
            { t: 1, v: 2, ease: 'elasticOut' }
          ]
        });
        break;
    }
  }

  return baseClip;
};

/**
 * Creates an attack animation clip with species-specific adjustments
 */
export const createAttackClip = (
  direction: 'down' | 'left' | 'up' | 'right' = 'down',
  options?: ClipOptions,
  speciesTraits?: SpeciesTraits
): AnimationClip => {
  const { intensity = 1, speed = 1.2 } = options || {};
  let durationMs = Math.round(500 / speed);
  
  // Apply species-specific adjustments
  let intensityMod = intensity;
  let speedMod = speed;

  if (speciesTraits) {
    // Adjust intensity based on species traits
    intensityMod *= speciesTraits.secondaryMotionIntensity;

    // Adjust speed based on weight and flexibility
    speedMod *= 1 + (speciesTraits.flexibility - 0.5) * 0.4;

    switch (speciesTraits.weight) {
      case 'light': speedMod *= 1.2; break;
      case 'medium': break; // Default
      case 'heavy': speedMod *= 0.8; break;
    }

    // Adjust duration
    durationMs = Math.round(durationMs / speedMod);
  }

  // Base attack animation
  const baseClip: AnimationClip = {
    name: `attack_${direction}`,
    durationMs,
    loop: false,
    tracks: [
      {
        prop: 'arm_thickness',
        keys: [
          { t: 0, v: 2, ease: 'backOut' },
          { t: 0.3, v: 5 * intensityMod, ease: 'backOut' },
          { t: 0.7, v: 3, ease: 'backOut' },
          { t: 1, v: 2, ease: 'backOut' }
        ]
      },
      {
        prop: 's_half',
        keys: [
          { t: 0, v: 16, ease: 'backOut' },
          { t: 0.3, v: 18, ease: 'backOut' },
          { t: 0.7, v: 17, ease: 'backOut' },
          { t: 1, v: 16, ease: 'backOut' }
        ]
      },
      {
        prop: 'head_rx',
        keys: [
          { t: 0, v: 12, ease: 'backOut' },
          { t: 0.3, v: 10, ease: 'backOut' },
          { t: 0.7, v: 14, ease: 'backOut' },
          { t: 1, v: 12, ease: 'backOut' }
        ]
      }
    ]
  };

  // Add species-specific tracks
  if (speciesTraits) {
    switch (speciesTraits.bodyType) {
      case 'insectoid':
        // Add rapid head movement for insect attack
        baseClip.tracks.push({
          prop: 'head_ry',
          keys: [
            { t: 0, v: 8, ease: 'elasticOut' },
            { t: 0.3, v: 12, ease: 'elasticOut' },
            { t: 0.7, v: 10, ease: 'elasticOut' },
            { t: 1, v: 8, ease: 'elasticOut' }
          ]
        });
        break;

      case 'aquatic':
        // Add body undulation for aquatic attack
        baseClip.tracks.push({
          prop: 'waist_t',
          keys: [
            { t: 0, v: 0.5, ease: 'sineInOut' },
            { t: 0.3, v: 0.6, ease: 'sineInOut' },
            { t: 0.7, v: 0.4, ease: 'sineInOut' },
            { t: 1, v: 0.5, ease: 'sineInOut' }
          ]
        });
        break;
    }
  }

  return baseClip;
};

/**
 * Creates a hurt animation clip with species-specific adjustments
 */
export const createHurtClip = (
  direction: 'down' | 'left' | 'up' | 'right' = 'down',
  options?: ClipOptions,
  speciesTraits?: SpeciesTraits
): AnimationClip => {
  const { intensity = 1, speed = 1 } = options || {};
  let durationMs = Math.round(400 / speed);
  
  // Apply species-specific adjustments
  let intensityMod = intensity;
  let speedMod = speed;

  if (speciesTraits) {
    // Adjust intensity based on species traits
    intensityMod *= speciesTraits.secondaryMotionIntensity;

    // Adjust speed based on flexibility
    speedMod *= 1 + (speciesTraits.flexibility - 0.5) * 0.4;

    // Adjust duration
    durationMs = Math.round(durationMs / speedMod);
  }

  // Base hurt animation
  const baseClip: AnimationClip = {
    name: `hurt_${direction}`,
    durationMs,
    loop: false,
    tracks: [
      {
        prop: 'head_rx',
        keys: [
          { t: 0, v: 12, ease: 'elasticOut' },
          { t: 0.2, v: 8, ease: 'elasticOut' },
          { t: 0.5, v: 15, ease: 'elasticOut' },
          { t: 1, v: 12, ease: 'elasticOut' }
        ]
      },
      {
        prop: 's_half',
        keys: [
          { t: 0, v: 16, ease: 'elasticOut' },
          { t: 0.2, v: 14, ease: 'elasticOut' },
          { t: 0.5, v: 17, ease: 'elasticOut' },
          { t: 1, v: 16, ease: 'elasticOut' }
        ]
      }
    ]
  };

  // Add species-specific tracks
  if (speciesTraits) {
    // Add more dramatic reaction for flexible creatures
    if (speciesTraits.flexibility > 0.7) {
      baseClip.tracks.push({
        prop: 'waist_t',
        keys: [
          { t: 0, v: 0.5, ease: 'elasticOut' },
          { t: 0.2, v: 0.4, ease: 'elasticOut' },
          { t: 0.5, v: 0.6, ease: 'elasticOut' },
          { t: 1, v: 0.5, ease: 'elasticOut' }
        ]
      });
    }

    // Add leg reaction for bipedal creatures
    if (speciesTraits.movementStyle === 'bipedal') {
      baseClip.tracks.push({
        prop: 'leg_gap',
        keys: [
          { t: 0, v: 2, ease: 'elasticOut' },
          { t: 0.2, v: 6, ease: 'elasticOut' },
          { t: 0.5, v: 4, ease: 'elasticOut' },
          { t: 1, v: 2, ease: 'elasticOut' }
        ]
      });
    }
  }

  return baseClip;
};

/**
 * Creates a species-specific animation clip
 */
export const createSpeciesSpecificClip = (
  speciesTraits: SpeciesTraits,
  clipType: string,
  direction: 'down' | 'left' | 'up' | 'right' = 'down'
): AnimationClip => {
  // Base duration and options
  let durationMs = 800;
  const options: ClipOptions = {
    intensity: 1,
    speed: 1,
    amplitude: 1
  };

  // Adjust options based on species traits
  options.intensity! *= speciesTraits.secondaryMotionIntensity;
  options.amplitude! *= speciesTraits.edgeDeformationFactor;
  options.speed! *= speciesTraits.fluidityFactor;

  // Create base clip based on type
  let baseClip: AnimationClip;

  switch (clipType) {
    case 'fly':
      if (speciesTraits.movementStyle !== 'flying') {
        return createIdleClip(direction, options, speciesTraits); // Fallback
      }

      baseClip = {
        name: `fly_${direction}`,
        durationMs: 600,
        loop: true,
        tracks: [
          {
            prop: 'arm_thickness',
            keys: [
              { t: 0, v: 2, ease: 'sineInOut' },
              { t: 0.25, v: 4, ease: 'sineInOut' },
              { t: 0.5, v: 2, ease: 'sineInOut' },
              { t: 0.75, v: 4, ease: 'sineInOut' },
              { t: 1, v: 2, ease: 'sineInOut' }
            ]
          },
          {
            prop: 'head_rx',
            keys: [
              { t: 0, v: 12, ease: 'quadOut' },
              { t: 0.5, v: 14, ease: 'quadOut' },
              { t: 1, v: 12, ease: 'quadOut' }
            ]
          },
          {
            prop: 's_half',
            keys: [
              { t: 0, v: 16, ease: 'sineInOut' },
              { t: 0.5, v: 15, ease: 'sineInOut' },
              { t: 1, v: 16, ease: 'sineInOut' }
            ]
          }
        ]
      };
      break;

    case 'swim':
      if (speciesTraits.movementStyle !== 'swimming') {
        return createIdleClip(direction, options, speciesTraits); // Fallback
      }

      baseClip = {
        name: `swim_${direction}`,
        durationMs: 800,
        loop: true,
        tracks: [
          {
            prop: 's_half',
            keys: [
              { t: 0, v: 16, ease: 'sineInOut' },
              { t: 0.25, v: 17, ease: 'sineInOut' },
              { t: 0.5, v: 16, ease: 'sineInOut' },
              { t: 0.75, v: 15, ease: 'sineInOut' },
              { t: 1, v: 16, ease: 'sineInOut' }
            ]
          },
          {
            prop: 'waist_t',
            keys: [
              { t: 0, v: 0.5, ease: 'sineInOut' },
              { t: 0.25, v: 0.55, ease: 'sineInOut' },
              { t: 0.5, v: 0.5, ease: 'sineInOut' },
              { t: 0.75, v: 0.45, ease: 'sineInOut' },
              { t: 1, v: 0.5, ease: 'sineInOut' }
            ]
          },
          {
            prop: 'leg_gap',
            keys: [
              { t: 0, v: 2, ease: 'sineInOut' },
              { t: 0.5, v: 0, ease: 'sineInOut' },
              { t: 1, v: 2, ease: 'sineInOut' }
            ]
          }
        ]
      };
      break;

    case 'slither':
      if (speciesTraits.movementStyle !== 'slithering') {
        return createIdleClip(direction, options, speciesTraits); // Fallback
      }

      baseClip = {
        name: `slither_${direction}`,
        durationMs: 1000,
        loop: true,
        tracks: [
          {
            prop: 'waist_t',
            keys: [
              { t: 0, v: 0.5, ease: 'sineInOut' },
              { t: 0.25, v: 0.6, ease: 'sineInOut' },
              { t: 0.5, v: 0.5, ease: 'sineInOut' },
              { t: 0.75, v: 0.4, ease: 'sineInOut' },
              { t: 1, v: 0.5, ease: 'sineInOut' }
            ]
          },
          {
            prop: 's_half',
            keys: [
              { t: 0, v: 16, ease: 'sineInOut' },
              { t: 0.25, v: 15, ease: 'sineInOut' },
              { t: 0.5, v: 16, ease: 'sineInOut' },
              { t: 0.75, v: 17, ease: 'sineInOut' },
              { t: 1, v: 16, ease: 'sineInOut' }
            ]
          },
          {
            prop: 'leg_gap',
            keys: [
              { t: 0, v: 0, ease: 'sineInOut' },
              { t: 1, v: 0, ease: 'sineInOut' }
            ]
          }
        ]
      };
      break;

    case 'hop':
      if (speciesTraits.movementStyle !== 'hopping') {
        return createIdleClip(direction, options, speciesTraits); // Fallback
      }

      baseClip = {
        name: `hop_${direction}`,
        durationMs: 500,
        loop: true,
        tracks: [
          {
            prop: 'leg_gap',
            keys: [
              { t: 0, v: 0, ease: 'quadOut' },
              { t: 0.2, v: 0, ease: 'quadOut' },
              { t: 0.4, v: 8, ease: 'quadOut' },
              { t: 0.6, v: 0, ease: 'quadOut' },
              { t: 1, v: 0, ease: 'quadOut' }
            ]
          },
          {
            prop: 's_half',
            keys: [
              { t: 0, v: 16, ease: 'quadOut' },
              { t: 0.2, v: 14, ease: 'quadOut' },
              { t: 0.4, v: 16, ease: 'quadOut' },
              { t: 0.6, v: 18, ease: 'quadOut' },
              { t: 1, v: 16, ease: 'quadOut' }
            ]
          },
          {
            prop: 'head_rx',
            keys: [
              { t: 0, v: 12, ease: 'quadOut' },
              { t: 0.2, v: 10, ease: 'quadOut' },
              { t: 0.4, v: 12, ease: 'quadOut' },
              { t: 0.6, v: 14, ease: 'quadOut' },
              { t: 1, v: 12, ease: 'quadOut' }
            ]
          }
        ]
      };
      break;

    default:
      return createIdleClip(direction, options, speciesTraits); // Fallback
  }

  return baseClip;
};

/**
 * Get standard clips for a character with species-specific adjustments
 */
export const getStandardClips = (
  options: ClipOptions = {},
  speciesTraits?: SpeciesTraits
): Record<string, AnimationClip> => {
  const directions = ['down', 'left', 'up', 'right'] as const;
  const clips: Record<string, AnimationClip> = {};

  directions.forEach(direction => {
    clips[`idle_${direction}`] = createIdleClip(direction, options, speciesTraits);
    clips[`walk_${direction}`] = createWalkClip(direction, options, speciesTraits);
    clips[`run_${direction}`] = createRunClip(direction, options, speciesTraits);
    clips[`jump_${direction}`] = createJumpClip(direction, options, speciesTraits);
    clips[`attack_${direction}`] = createAttackClip(direction, options, speciesTraits);
    clips[`hurt_${direction}`] = createHurtClip(direction, options, speciesTraits);

    // Add species-specific clips based on movement style
    if (speciesTraits) {
      switch (speciesTraits.movementStyle) {
        case 'flying':
          clips[`fly_${direction}`] = createSpeciesSpecificClip(speciesTraits, 'fly', direction);
          break;
        case 'swimming':
          clips[`swim_${direction}`] = createSpeciesSpecificClip(speciesTraits, 'swim', direction);
          break;
        case 'slithering':
          clips[`slither_${direction}`] = createSpeciesSpecificClip(speciesTraits, 'slither', direction);
          break;
        case 'hopping':
          clips[`hop_${direction}`] = createSpeciesSpecificClip(speciesTraits, 'hop', direction);
          break;
      }
    }
  });

  return clips;
};