import { CharacterSpec } from '../character/types';

/**
 * Species traits that affect animation behavior
 */
export interface SpeciesTraits {
  // Physical characteristics
  bodyType: 'humanoid' | 'quadruped' | 'avian' | 'aquatic' | 'insectoid';
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  weight: 'light' | 'medium' | 'heavy';
  flexibility: number; // 0-1 scale, affects motion fluidity
  
  // Movement characteristics
  movementStyle: 'bipedal' | 'quadrupedal' | 'slithering' | 'flying' | 'swimming' | 'hopping';
  gait: 'smooth' | 'bouncy' | 'lumbering' | 'graceful' | 'erratic';
  
  // Animation modifiers
  secondaryMotionIntensity: number; // 0-1 scale
  edgeDeformationFactor: number; // How much edges deform during motion
  fluidityFactor: number; // How fluid the motion appears
  
  // Species-specific animation parameters
  tailMovement?: {
    amplitude: number;
    frequency: number;
    phase: number;
  };
  wingMovement?: {
    amplitude: number;
    frequency: number;
    flapStyle: 'smooth' | 'rapid' | 'gliding';
  };
  tentacleMovement?: {
    amplitude: number;
    frequency: number;
    waviness: number;
  };
  finMovement?: {
    amplitude: number;
    frequency: number;
    flowDirection: 'forward' | 'lateral';
  };
}

/**
 * Default species traits for common character types
 */
export const SPECIES_PRESETS: Record<string, SpeciesTraits> = {
  human: {
    bodyType: 'humanoid',
    size: 'medium',
    weight: 'medium',
    flexibility: 0.6,
    movementStyle: 'bipedal',
    gait: 'smooth',
    secondaryMotionIntensity: 0.7,
    edgeDeformationFactor: 0.4,
    fluidityFactor: 0.7
  },
  elf: {
    bodyType: 'humanoid',
    size: 'medium',
    weight: 'light',
    flexibility: 0.8,
    movementStyle: 'bipedal',
    gait: 'graceful',
    secondaryMotionIntensity: 0.8,
    edgeDeformationFactor: 0.3,
    fluidityFactor: 0.9
  },
  dwarf: {
    bodyType: 'humanoid',
    size: 'small',
    weight: 'heavy',
    flexibility: 0.4,
    movementStyle: 'bipedal',
    gait: 'lumbering',
    secondaryMotionIntensity: 0.5,
    edgeDeformationFactor: 0.6,
    fluidityFactor: 0.5
  },
  wolf: {
    bodyType: 'quadruped',
    size: 'medium',
    weight: 'medium',
    flexibility: 0.7,
    movementStyle: 'quadrupedal',
    gait: 'smooth',
    secondaryMotionIntensity: 0.6,
    edgeDeformationFactor: 0.5,
    fluidityFactor: 0.8,
    tailMovement: {
      amplitude: 0.3,
      frequency: 2.5,
      phase: Math.PI / 6
    }
  },
  bird: {
    bodyType: 'avian',
    size: 'small',
    weight: 'light',
    flexibility: 0.9,
    movementStyle: 'flying',
    gait: 'graceful',
    secondaryMotionIntensity: 0.9,
    edgeDeformationFactor: 0.2,
    fluidityFactor: 0.95,
    wingMovement: {
      amplitude: 0.7,
      frequency: 4.0,
      flapStyle: 'smooth'
    }
  },
  fish: {
    bodyType: 'aquatic',
    size: 'small',
    weight: 'light',
    flexibility: 0.95,
    movementStyle: 'swimming',
    gait: 'smooth',
    secondaryMotionIntensity: 0.9,
    edgeDeformationFactor: 0.3,
    fluidityFactor: 1.0,
    finMovement: {
      amplitude: 0.5,
      frequency: 3.0,
      flowDirection: 'lateral'
    }
  },
  insect: {
    bodyType: 'insectoid',
    size: 'tiny',
    weight: 'light',
    flexibility: 0.7,
    movementStyle: 'flying',
    gait: 'erratic',
    secondaryMotionIntensity: 0.8,
    edgeDeformationFactor: 0.2,
    fluidityFactor: 0.7,
    wingMovement: {
      amplitude: 0.9,
      frequency: 8.0,
      flapStyle: 'rapid'
    }
  },
  octopus: {
    bodyType: 'aquatic',
    size: 'medium',
    weight: 'medium',
    flexibility: 1.0,
    movementStyle: 'swimming',
    gait: 'graceful',
    secondaryMotionIntensity: 1.0,
    edgeDeformationFactor: 0.8,
    fluidityFactor: 1.0,
    tentacleMovement: {
      amplitude: 0.8,
      frequency: 1.5,
      waviness: 0.9
    }
  }
};

/**
 * Get species traits for a given species name
 */
export function getSpeciesTraits(speciesName: string): SpeciesTraits {
  return SPECIES_PRESETS[speciesName] || SPECIES_PRESETS.human;
}

/**
 * Apply species-specific modifications to a character spec
 */
export function applySpeciesTraits(spec: CharacterSpec, traits: SpeciesTraits): CharacterSpec {
  const modifiedSpec = { ...spec };
  
  // Apply body type modifications
  switch (traits.bodyType) {
    case 'humanoid':
      // Default humanoid proportions
      break;
    case 'quadruped':
      // Adjust for quadruped proportions
      modifiedSpec.waist_t = 0.65; // Lower waist position
      modifiedSpec.leg_h = Math.round(modifiedSpec.leg_h * 0.8); // Shorter legs
      modifiedSpec.s_half = Math.round(modifiedSpec.s_half * 1.3); // Wider torso
      modifiedSpec.h_half = Math.round(modifiedSpec.h_half * 0.9); // Flatter torso
      break;
    case 'avian':
      // Adjust for bird proportions
      modifiedSpec.head_rx = Math.round(modifiedSpec.head_rx * 0.8); // Smaller head
      modifiedSpec.arm_thickness = Math.max(1, Math.round(modifiedSpec.arm_thickness * 1.5)); // Thicker arms for wings
      break;
    case 'aquatic':
      // Adjust for aquatic proportions
      modifiedSpec.leg_gap = Math.round(modifiedSpec.leg_gap * 0.3); // Closer legs
      modifiedSpec.leg_h = Math.round(modifiedSpec.leg_h * 0.6); // Shorter legs
      break;
    case 'insectoid':
      // Adjust for insect proportions
      modifiedSpec.head_rx = Math.round(modifiedSpec.head_rx * 1.2); // Larger head
      modifiedSpec.head_ry = Math.round(modifiedSpec.head_ry * 1.2); // Wider head
      modifiedSpec.s_half = Math.round(modifiedSpec.s_half * 0.8); // Narrower torso
      break;
  }
  
  // Apply size modifications
  const sizeFactors = {
    tiny: 0.6,
    small: 0.8,
    medium: 1.0,
    large: 1.3,
    huge: 1.8
  };
  
  const sizeFactor = sizeFactors[traits.size];
  modifiedSpec.head_rx = Math.round(modifiedSpec.head_rx * sizeFactor);
  modifiedSpec.head_ry = Math.round(modifiedSpec.head_ry * sizeFactor);
  modifiedSpec.s_half = Math.round(modifiedSpec.s_half * sizeFactor);
  modifiedSpec.h_half = Math.round(modifiedSpec.h_half * sizeFactor);
  modifiedSpec.leg_h = Math.round(modifiedSpec.leg_h * sizeFactor);
  
  return modifiedSpec;
}