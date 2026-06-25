import { Ease } from "./easing";
import { CharacterSpec } from '../character/types';
import { AnimationClip, AnimationTrack } from './schema';
import { SpeciesTraits } from './species';
import { EdgePoint, deformEdges, detectEdges, EdgeDetectionConfig } from './edgeDetection';

/**
 * Configuration for fluid motion
 */
export interface FluidMotionConfig {
  velocitySmoothing: number; // How much to smooth velocity changes (0-1)
  accelerationSmoothing: number; // How much to smooth acceleration changes (0-1)
  jitterReduction: number; // How much to reduce jitter in motion (0-1)
  overshootFactor: number; // How much to allow overshooting in motion (0-1)
  bounceReduction: number; // How much to reduce bouncing in motion (0-1)
  naturalFrequency: number; // Base frequency for natural motion
  dampingRatio: number; // Damping ratio for oscillations
}

/**
 * Default configuration for fluid motion
 */
export const DEFAULT_FLUID_CONFIG: FluidMotionConfig = {
  velocitySmoothing: 0.7,
  accelerationSmoothing: 0.5,
  jitterReduction: 0.8,
  overshootFactor: 0.3,
  bounceReduction: 0.6,
  naturalFrequency: 2.5,
  dampingRatio: 0.7
};

/**
 * Motion state for tracking character movement
 */
export interface MotionState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  previousPositions: Array<{ x: number; y: number }>;
  previousVelocities: Array<{ x: number; y: number }>;
  previousAccelerations: Array<{ x: number; y: number }>;
  lastUpdateTime: number;
}

/**
 * Creates a new motion state
 */
export function createMotionState(initialPosition = { x: 0, y: 0 }): MotionState {
  return {
    position: { ...initialPosition },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    previousPositions: Array(5).fill({ ...initialPosition }),
    previousVelocities: Array(5).fill({ x: 0, y: 0 }),
    previousAccelerations: Array(5).fill({ x: 0, y: 0 }),
    lastUpdateTime: Date.now()
  };
}

/**
 * Updates motion state based on new position
 */
export function updateMotionState(
  state: MotionState, 
  newPosition: { x: number; y: number },
  config: FluidMotionConfig = DEFAULT_FLUID_CONFIG
): MotionState {
  const now = Date.now();
  const deltaTime = Math.min(0.1, (now - state.lastUpdateTime) / 1000); // Cap at 100ms to avoid huge jumps
  
  if (deltaTime <= 0) return state; // Avoid division by zero
  
  // Calculate new velocity
  const rawVelocity = {
    x: (newPosition.x - state.position.x) / deltaTime,
    y: (newPosition.y - state.position.y) / deltaTime
  };
  
  // Apply velocity smoothing
  const smoothedVelocity = {
    x: rawVelocity.x * (1 - config.velocitySmoothing) + state.velocity.x * config.velocitySmoothing,
    y: rawVelocity.y * (1 - config.velocitySmoothing) + state.velocity.y * config.velocitySmoothing
  };
  
  // Calculate new acceleration
  const rawAcceleration = {
    x: (smoothedVelocity.x - state.velocity.x) / deltaTime,
    y: (smoothedVelocity.y - state.velocity.y) / deltaTime
  };
  
  // Apply acceleration smoothing
  const smoothedAcceleration = {
    x: rawAcceleration.x * (1 - config.accelerationSmoothing) + state.acceleration.x * config.accelerationSmoothing,
    y: rawAcceleration.y * (1 - config.accelerationSmoothing) + state.acceleration.y * config.accelerationSmoothing
  };
  
  // Update history arrays
  const newPreviousPositions = [state.position, ...state.previousPositions.slice(0, -1)];
  const newPreviousVelocities = [state.velocity, ...state.previousVelocities.slice(0, -1)];
  const newPreviousAccelerations = [state.acceleration, ...state.previousAccelerations.slice(0, -1)];
  
  return {
    position: newPosition,
    velocity: smoothedVelocity,
    acceleration: smoothedAcceleration,
    previousPositions: newPreviousPositions,
    previousVelocities: newPreviousVelocities,
    previousAccelerations: newPreviousAccelerations,
    lastUpdateTime: now
  };
}

/**
 * Applies fluid motion to character animation
 */
export function applyFluidMotion(
  baseSpec: CharacterSpec,
  clip: AnimationClip,
  t: number,
  motionState: MotionState,
  speciesTraits: SpeciesTraits,
  config: FluidMotionConfig = DEFAULT_FLUID_CONFIG
): CharacterSpec {
  // Create a modified spec with basic animation applied
  let modifiedSpec = { ...baseSpec };
  
  // Apply each track with fluid motion enhancements
  for (const track of clip.tracks) {
    const value = interpolateKeyWithFluidMotion(
      track, 
      t, 
      motionState, 
      speciesTraits,
      config
    );
    
    // Apply the value to the spec
    (modifiedSpec as any)[track.prop] = value;
  }
  
  // Apply species-specific fluid motion enhancements
  modifiedSpec = applySpeciesFluidMotion(modifiedSpec, motionState, speciesTraits, config);
  
  // Apply edge-based deformation if the species has high fluidity
  if (speciesTraits.fluidityFactor > 0.5) {
    const edgeConfig: EdgeDetectionConfig = {
      resolution: 24,
      smoothingFactor: 0.7,
      deformationIntensity: speciesTraits.edgeDeformationFactor,
      velocitySensitivity: 0.6
    };
    
    // Detect edges
    const edges = detectEdges(modifiedSpec, edgeConfig);
    
    // Deform edges based on motion
    const deformedEdges = deformEdges(
      edges,
      motionState.velocity,
      motionState.acceleration,
      edgeConfig,
      speciesTraits.edgeDeformationFactor
    );
    
    // Apply edge deformation to the spec
    modifiedSpec = applyEdgeDeformation(modifiedSpec, deformedEdges, speciesTraits);
  }
  
  return modifiedSpec;
}

/**
 * Interpolates animation keyframes with fluid motion enhancements
 */
function interpolateKeyWithFluidMotion(
  track: AnimationTrack,
  t: number,
  motionState: MotionState,
  speciesTraits: SpeciesTraits,
  config: FluidMotionConfig
): number {
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
  
  // Basic interpolated value
  const basicValue = prevKey.v + (nextKey.v - prevKey.v) * easedT;
  
  // Apply fluid motion enhancements based on property
  let fluidValue = basicValue;
  
  // Calculate motion influence factor based on species traits
  const motionFactor = speciesTraits.fluidityFactor * 0.5;
  
  // Apply property-specific fluid motion
  switch (track.prop) {
    case 'head_rx':
    case 'head_ry':
      // Head rotation responds to acceleration with some delay
      const headAccelFactor = 0.15 * motionFactor;
      fluidValue += -motionState.acceleration.y * headAccelFactor;
      break;
      
    case 's_half':
    case 'h_half':
      // Torso size responds to velocity changes (squash and stretch)
      const speedChange = Math.abs(
        Math.hypot(motionState.velocity.x, motionState.velocity.y) - 
        Math.hypot(motionState.previousVelocities[0].x, motionState.previousVelocities[0].y)
      );
      const squashStretchFactor = 0.1 * motionFactor;
      fluidValue += speedChange * squashStretchFactor;
      break;
      
    case 'leg_gap':
      // Leg gap responds to horizontal velocity
      const legGapFactor = 0.2 * motionFactor;
      fluidValue += Math.abs(motionState.velocity.x) * legGapFactor;
      break;
      
    case 'robe_flare_px':
      // Robe flare responds to velocity with inertia
      const robeVelocityFactor = 0.3 * motionFactor;
      const robeAccelFactor = 0.2 * motionFactor;
      fluidValue += Math.hypot(motionState.velocity.x, motionState.velocity.y) * robeVelocityFactor;
      fluidValue += Math.hypot(motionState.acceleration.x, motionState.acceleration.y) * robeAccelFactor;
      break;
  }
  
  // Apply natural oscillation based on species traits
  const oscillationFactor = speciesTraits.secondaryMotionIntensity * 0.2;
  const naturalFrequency = config.naturalFrequency * (1 + oscillationFactor);
  const dampingRatio = config.dampingRatio * (1 - oscillationFactor * 0.5);
  
  // Calculate oscillation based on property
  let oscillation = 0;
  
  switch (track.prop) {
    case 'head_rx':
      oscillation = Math.sin(t * Math.PI * 2 * naturalFrequency) * oscillationFactor * 2;
      break;
      
    case 's_half':
    case 'h_half':
      oscillation = Math.sin(t * Math.PI * 2 * naturalFrequency * 1.5) * oscillationFactor;
      break;
      
    case 'robe_flare_px':
      oscillation = Math.sin(t * Math.PI * 2 * naturalFrequency * 0.8) * oscillationFactor * 3;
      break;
  }
  
  // Apply damping to oscillation
  oscillation *= Math.exp(-dampingRatio * t * 5);
  
  // Add oscillation to fluid value
  fluidValue += oscillation;
  
  return fluidValue;
}

/**
 * Applies species-specific fluid motion enhancements
 */
function applySpeciesFluidMotion(
  spec: CharacterSpec,
  motionState: MotionState,
  traits: SpeciesTraits,
  config: FluidMotionConfig
): CharacterSpec {
  const modifiedSpec = { ...spec };
  
  // Calculate motion intensity
  const speed = Math.hypot(motionState.velocity.x, motionState.velocity.y);
  const accel = Math.hypot(motionState.acceleration.x, motionState.acceleration.y);
  
  // Apply species-specific motion based on body type
  switch (traits.bodyType) {
    case 'humanoid':
      // Humanoids have balanced motion
      break;
      
    case 'quadruped':
      // Quadrupeds have more horizontal stretching during motion
      if (speed > 0.5) {
        modifiedSpec.s_half = Math.round(modifiedSpec.s_half * (1 + speed * 0.05 * traits.fluidityFactor));
        modifiedSpec.h_half = Math.round(modifiedSpec.h_half * (1 - speed * 0.03 * traits.fluidityFactor));
      }
      break;
      
    case 'avian':
      // Avians have more vertical motion during flight
      if (traits.wingMovement && speed > 0.5) {
        const wingFactor = traits.wingMovement.amplitude * Math.sin(Date.now() / 1000 * traits.wingMovement.frequency);
        modifiedSpec.arm_thickness = Math.max(1, Math.round(modifiedSpec.arm_thickness * (1 + wingFactor * 0.3)));
      }
      break;
      
    case 'aquatic':
      // Aquatic creatures have smooth, wave-like motion
      if (traits.finMovement) {
        const waveFactor = traits.finMovement.amplitude * Math.sin(Date.now() / 1000 * traits.finMovement.frequency);
        modifiedSpec.s_half = Math.round(modifiedSpec.s_half * (1 + waveFactor * 0.1));
      }
      break;
      
    case 'insectoid':
      // Insectoids have rapid, erratic motion
      if (traits.wingMovement && speed > 0.3) {
        const jitterFactor = Math.sin(Date.now() / 100) * traits.secondaryMotionIntensity * 0.1;
        modifiedSpec.head_rx = Math.round(modifiedSpec.head_rx * (1 + jitterFactor));
      }
      break;
  }
  
  // Apply species-specific appendage motion
  if (traits.tailMovement) {
    // Tail swaying based on horizontal velocity and acceleration
    const tailSwayFactor = traits.tailMovement.amplitude * 
                          Math.sin(Date.now() / 1000 * traits.tailMovement.frequency + traits.tailMovement.phase);
    
    // This would be applied to a tail property if it existed
    // For now, we'll use it to affect the robe flare as a demonstration
    if (modifiedSpec.robe) {
      modifiedSpec.robe_flare_px = Math.max(0, (modifiedSpec.robe_flare_px || 0) + tailSwayFactor * 3);
    }
  }
  
  // Apply species-specific gait modifications
  switch (traits.gait) {
    case 'bouncy':
      // Bouncy gait has more vertical oscillation
      const bounceFactor = Math.sin(Date.now() / 500) * traits.secondaryMotionIntensity * 0.2;
      modifiedSpec.leg_h = Math.round(modifiedSpec.leg_h * (1 + bounceFactor));
      break;
      
    case 'lumbering':
      // Lumbering gait has more horizontal sway
      const swayFactor = Math.sin(Date.now() / 800) * traits.secondaryMotionIntensity * 0.15;
      modifiedSpec.waist_t = Math.max(0.35, Math.min(0.65, modifiedSpec.waist_t + swayFactor * 0.05));
      break;
      
    case 'graceful':
      // Graceful gait has smooth, flowing motion
      const graceFactor = Math.sin(Date.now() / 1200) * traits.secondaryMotionIntensity * 0.1;
      modifiedSpec.head_rx = Math.round(modifiedSpec.head_rx * (1 + graceFactor * 0.05));
      break;
      
    case 'erratic':
      // Erratic gait has unpredictable movements
      const erraticFactor = (Math.sin(Date.now() / 300) + Math.cos(Date.now() / 500)) * traits.secondaryMotionIntensity * 0.1;
      modifiedSpec.leg_gap = Math.max(0, modifiedSpec.leg_gap + erraticFactor * 2);
      break;
  }
  
  return modifiedSpec;
}

/**
 * Applies edge deformation to character spec
 */
function applyEdgeDeformation(
  spec: CharacterSpec,
  deformedEdges: EdgePoint[],
  traits: SpeciesTraits
): CharacterSpec {
  const modifiedSpec = { ...spec };
  
  // Group edges by segment
  const edgesBySegment: Record<string, EdgePoint[]> = {};
  
  for (const edge of deformedEdges) {
    if (!edgesBySegment[edge.segment]) {
      edgesBySegment[edge.segment] = [];
    }
    edgesBySegment[edge.segment].push(edge);
  }
  
  // Apply deformation based on segment
  if (edgesBySegment.head && edgesBySegment.head.length > 0) {
    // Calculate average head deformation
    const headEdges = edgesBySegment.head;
    const avgDeformation = headEdges.reduce((sum, edge) => {
      const originalX = edge.x - edge.normal.x * edge.curvature;
      const originalY = edge.y - edge.normal.y * edge.curvature;
      const deformX = edge.x - originalX;
      const deformY = edge.y - originalY;
      return sum + Math.sqrt(deformX * deformX + deformY * deformY);
    }, 0) / headEdges.length;
    
    // Apply head deformation
    modifiedSpec.head_rx = Math.round(modifiedSpec.head_rx * (1 + avgDeformation * 0.1));
    modifiedSpec.head_ry = Math.round(modifiedSpec.head_ry * (1 + avgDeformation * 0.1));
  }
  
  if (edgesBySegment.torso && edgesBySegment.torso.length > 0) {
    // Calculate average torso deformation
    const torsoEdges = edgesBySegment.torso;
    const avgDeformation = torsoEdges.reduce((sum, edge) => {
      const originalX = edge.x - edge.normal.x * edge.curvature;
      const originalY = edge.y - edge.normal.y * edge.curvature;
      const deformX = edge.x - originalX;
      const deformY = edge.y - originalY;
      return sum + Math.sqrt(deformX * deformX + deformY * deformY);
    }, 0) / torsoEdges.length;
    
    // Apply torso deformation
    modifiedSpec.s_half = Math.round(modifiedSpec.s_half * (1 + avgDeformation * 0.15));
    modifiedSpec.h_half = Math.round(modifiedSpec.h_half * (1 + avgDeformation * 0.15));
  }
  
  if (edgesBySegment.robe && edgesBySegment.robe.length > 0) {
    // Calculate average robe deformation
    const robeEdges = edgesBySegment.robe;
    const avgDeformation = robeEdges.reduce((sum, edge) => {
      const originalX = edge.x - edge.normal.x * edge.curvature;
      const originalY = edge.y - edge.normal.y * edge.curvature;
      const deformX = edge.x - originalX;
      const deformY = edge.y - originalY;
      return sum + Math.sqrt(deformX * deformX + deformY * deformY);
    }, 0) / robeEdges.length;
    
    // Apply robe deformation
    modifiedSpec.robe_flare_px = Math.max(0, (modifiedSpec.robe_flare_px || 0) + avgDeformation * 3);
  }
  
  return modifiedSpec;
}