import { CharacterSpec } from '../character/types';
import { AnimationClip } from './schema';
import { AnimationApplier } from './apply';
import { CharacterGenerator } from '../character/generator';
import { SpeciesTraits, getSpeciesTraits } from './species';
import { EdgeDetectionConfig } from './edgeDetection';
import { FluidMotionConfig, DEFAULT_FLUID_CONFIG, createMotionState } from './fluidMotion';

export interface SpriteSheetConfig {
  frameWidth: number;
  frameHeight: number;
  cols: number;
  rows: number;
  padding?: number;
  speciesName?: string;
  enableEdgeDetection?: boolean;
  enableFluidMotion?: boolean;
}

export interface SpriteSheetMetadata {
  frameW: number;
  frameH: number;
  cols: number;
  rows: number;
  frames: number;
  species?: string;
  anchors?: Record<string, [number, number]>;
  events?: Array<{ f: number; name: string }>;
  animations?: Record<string, number[]>;
  edgeData?: Array<{
    frame: number;
    edges: Array<{
      x: number;
      y: number;
      normal: { x: number; y: number };
    }>;
  }>;
}

export class SpriteSheetGenerator {
  private characterGenerator: CharacterGenerator;
  private animationApplier: AnimationApplier;
  private speciesTraits: SpeciesTraits;
  private edgeDetectionConfig: EdgeDetectionConfig;
  private fluidMotionConfig: FluidMotionConfig;

  constructor(seed?: number, speciesName: string = 'human') {
    this.characterGenerator = new CharacterGenerator(seed);

    // Get species traits
    this.speciesTraits = getSpeciesTraits(speciesName);

    // Configure edge detection based on species traits
    this.edgeDetectionConfig = {
      resolution: 24,
      smoothingFactor: 0.7,
      deformationIntensity: this.speciesTraits.edgeDeformationFactor,
      velocitySensitivity: 0.6
    };

    // Configure fluid motion based on species traits
    this.fluidMotionConfig = {
      ...DEFAULT_FLUID_CONFIG,
      velocitySmoothing: 0.7 * this.speciesTraits.fluidityFactor,
      naturalFrequency: DEFAULT_FLUID_CONFIG.naturalFrequency *
                       (0.8 + this.speciesTraits.secondaryMotionIntensity * 0.4),
      dampingRatio: DEFAULT_FLUID_CONFIG.dampingRatio *
                   (1.2 - this.speciesTraits.secondaryMotionIntensity * 0.4)
    };

    // Initialize animation applier with species-specific settings
    this.animationApplier = new AnimationApplier({
      speciesName,
      edgeDetection: this.edgeDetectionConfig,
      fluidMotion: this.fluidMotionConfig,
      enableEdgeDetection: true,
      enableFluidMotion: true
    });
  }

  /**
   * Set the species for the sprite sheet generator
   */
  setSpecies(speciesName: string): void {
    this.speciesTraits = getSpeciesTraits(speciesName);

    // Update edge detection config
    this.edgeDetectionConfig.deformationIntensity = this.speciesTraits.edgeDeformationFactor;

    // Update fluid motion config
    this.fluidMotionConfig.velocitySmoothing = 0.7 * this.speciesTraits.fluidityFactor;
    this.fluidMotionConfig.naturalFrequency = DEFAULT_FLUID_CONFIG.naturalFrequency *
                                            (0.8 + this.speciesTraits.secondaryMotionIntensity * 0.4);
    this.fluidMotionConfig.dampingRatio = DEFAULT_FLUID_CONFIG.dampingRatio *
                                        (1.2 - this.speciesTraits.secondaryMotionIntensity * 0.4);

    // Update animation applier
    this.animationApplier.setSpecies(speciesName);
  }

  /**
   * Generate a sprite sheet for a single animation clip
   */
  generateSpriteSheet(
    baseFlags: Set<string>,
    clip: AnimationClip,
    config: SpriteSheetConfig
  ): { canvas: HTMLCanvasElement; metadata: SpriteSheetMetadata } {
    const {
      frameWidth,
      frameHeight,
      cols,
      rows,
      padding = 0,
      speciesName = 'human',
      enableEdgeDetection = true,
      enableFluidMotion = true
    } = config;

    const totalFrames = cols * rows;
    
    // Set species if specified
    if (speciesName !== 'human') {
      this.setSpecies(speciesName);
    }

    // Configure animation applier
    this.animationApplier = new AnimationApplier({
      speciesName,
      edgeDetection: this.edgeDetectionConfig,
      fluidMotion: this.fluidMotionConfig,
      enableEdgeDetection,
      enableFluidMotion
    });

    // Create sprite sheet canvas
    const sheetWidth = cols * (frameWidth + padding) - padding;
    const sheetHeight = rows * (frameHeight + padding) - padding;
    const spriteSheet = document.createElement('canvas');
    spriteSheet.width = sheetWidth;
    spriteSheet.height = sheetHeight;
    const ctx = spriteSheet.getContext('2d')!;

    // Generate base spec
    const baseSpec = this.characterGenerator.computeSpecs(baseFlags, frameWidth);

    // Initialize motion state for fluid motion
    const motionState = createMotionState();

    // Generate frames
    const frameDuration = clip.durationMs / totalFrames;
    
    // Edge data for metadata
    const edgeData = enableEdgeDetection ? [] as any : undefined;

    for (let frame = 0; frame < totalFrames; frame++) {
      const t = frame / (totalFrames - 1);
      
      // Calculate frame position for motion tracking
      const frameX = (frame % cols) * (frameWidth + padding);
      const frameY = Math.floor(frame / cols) * (frameHeight + padding);

      // Update motion state with new position
      this.animationApplier.updateMotion({ x: frameX, y: frameY });
      
      // Apply animation tracks with species-specific enhancements
      let spec = this.animationApplier.applyTracks(baseSpec, clip, t);

      // Generate character frame
      const { canvas: characterCanvas } = this.characterGenerator.generateGeometry(baseFlags, spec);

      // Calculate frame position
      const col = frame % cols;
      const row = Math.floor(frame / cols);
      const x = col * (frameWidth + padding);
      const y = row * (frameHeight + padding);

      // Draw frame to sprite sheet
      ctx.drawImage(characterCanvas, x, y);

      // Store edge data if enabled
      if (edgeData) {
        // This would be populated with actual edge data from the edge detection system
        // For now, we'll just add a placeholder
        edgeData.push({
          frame,
          edges: [] // This would be populated with actual edge points
        });
      }
    }

    // Generate metadata
    const metadata: SpriteSheetMetadata = {
      frameW: frameWidth,
      frameH: frameHeight,
      cols,
      rows,
      frames: totalFrames,
      species: speciesName,
      anchors: {
        pivot: [frameWidth / 2, frameHeight - 8] // Feet center
      },
      edgeData
    };

    return { canvas: spriteSheet, metadata };
  }

  /**
   * Generate a sprite sheet with multiple directional animations
   */
  generateDirectionalSpriteSheet(
    baseFlags: Set<string>,
    clips: Record<string, AnimationClip>,
    config: SpriteSheetConfig
  ): { canvas: HTMLCanvasElement; metadata: SpriteSheetMetadata } {
    const {
      frameWidth,
      frameHeight,
      cols,
      rows,
      padding = 0,
      speciesName = 'human',
      enableEdgeDetection = true,
      enableFluidMotion = true
    } = config;

    // Set species if specified
    if (speciesName !== 'human') {
      this.setSpecies(speciesName);
    }

    // Configure animation applier
    this.animationApplier = new AnimationApplier({
      speciesName,
      edgeDetection: this.edgeDetectionConfig,
      fluidMotion: this.fluidMotionConfig,
      enableEdgeDetection,
      enableFluidMotion
    });

    const directions = ['down', 'left', 'up', 'right'];

    // Determine which animations to include based on species
    let animations = ['idle', 'walk'];

    // Add species-specific animations
    switch (this.speciesTraits.movementStyle) {
      case 'flying':
        animations.push('fly');
        break;
      case 'swimming':
        animations.push('swim');
        break;
      case 'slithering':
        animations.push('slither');
        break;
      case 'hopping':
        animations.push('hop');
        break;
    }

    // Add common animations
    animations.push('run', 'jump', 'attack', 'hurt');
    
    // Create sprite sheet canvas
    const sheetWidth = cols * (frameWidth + padding) - padding;
    const sheetHeight = rows * (frameHeight + padding) - padding;
    const spriteSheet = document.createElement('canvas');
    spriteSheet.width = sheetWidth;
    spriteSheet.height = sheetHeight;
    const ctx = spriteSheet.getContext('2d')!;

    // Generate base spec
    const baseSpec = this.characterGenerator.computeSpecs(baseFlags, frameWidth);

    // Initialize motion state for fluid motion
    const motionState = createMotionState();

    // Animation mapping
    const animationMap: Record<string, number[]> = {};
    let frameIndex = 0;

    // Edge data for metadata
    const edgeData = enableEdgeDetection ? [] as any : undefined;

    for (const direction of directions) {
      for (const animation of animations) {
        const clipName = `${animation}_${direction}`;
        const clip = clips[clipName];
        if (!clip) continue;

        const framesPerAnimation = 4; // Standard 4 frames per animation
        const frameIndices: number[] = [];

        for (let frame = 0; frame < framesPerAnimation; frame++) {
          const t = frame / (framesPerAnimation - 1);
          
          // Calculate frame position for motion tracking
          const frameX = (frameIndex % cols) * (frameWidth + padding);
          const frameY = Math.floor(frameIndex / cols) * (frameHeight + padding);

          // Update motion state with new position
          this.animationApplier.updateMotion({ x: frameX, y: frameY });
          
          // Apply animation tracks with species-specific enhancements
          let spec = this.animationApplier.applyTracks(baseSpec, clip, t);

          // Generate character frame
          const { canvas: characterCanvas } = this.characterGenerator.generateGeometry(baseFlags, spec);

          // Handle right direction by mirroring left
          let frameCanvas = characterCanvas;
          if (direction === 'right') {
            frameCanvas = document.createElement('canvas');
            frameCanvas.width = frameWidth;
            frameCanvas.height = frameHeight;
            const frameCtx = frameCanvas.getContext('2d')!;
            frameCtx.translate(frameWidth, 0);
            frameCtx.scale(-1, 1);
            frameCtx.drawImage(characterCanvas, 0, 0);
          }

          // Calculate frame position
          const col = frameIndex % cols;
          const row = Math.floor(frameIndex / cols);
          const x = col * (frameWidth + padding);
          const y = row * (frameHeight + padding);

          // Draw frame to sprite sheet
          ctx.drawImage(frameCanvas, x, y);

          // Store edge data if enabled
          if (edgeData) {
            // This would be populated with actual edge data from the edge detection system
            // For now, we'll just add a placeholder
            edgeData.push({
              frame: frameIndex,
              edges: [] // This would be populated with actual edge points
            });
          }

          frameIndices.push(frameIndex);
          frameIndex++;
        }

        animationMap[clipName] = frameIndices;
      }
    }

    // Generate metadata
    const metadata: SpriteSheetMetadata = {
      frameW: frameWidth,
      frameH: frameHeight,
      cols,
      rows,
      frames: frameIndex,
      species: speciesName,
      anchors: {
        pivot: [frameWidth / 2, frameHeight - 8] // Feet center
      },
      animations: animationMap,
      edgeData
    };

    return { canvas: spriteSheet, metadata };
  }

  /**
   * Export sprite sheet to files
   */
  exportSpriteSheet(
    canvas: HTMLCanvasElement,
    metadata: SpriteSheetMetadata,
    filename: string
  ): void {
    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    // Export metadata as JSON
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const metadataUrl = URL.createObjectURL(metadataBlob);
    const a = document.createElement('a');
    a.href = metadataUrl;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(metadataUrl);
  }

  /**
   * Generate sprite sheets for multiple species
   */
  generateMultiSpeciesSpriteSheets(
    baseFlags: Set<string>,
    clips: Record<string, AnimationClip>,
    config: SpriteSheetConfig,
    speciesNames: string[]
  ): Record<string, { canvas: HTMLCanvasElement; metadata: SpriteSheetMetadata }> {
    const results: Record<string, { canvas: HTMLCanvasElement; metadata: SpriteSheetMetadata }> = {};

    for (const speciesName of speciesNames) {
      // Update config with species name
      const speciesConfig = {
        ...config,
        speciesName
      };

      // Generate sprite sheet for this species
      results[speciesName] = this.generateDirectionalSpriteSheet(baseFlags, clips, speciesConfig);
    }

    return results;
  }
}