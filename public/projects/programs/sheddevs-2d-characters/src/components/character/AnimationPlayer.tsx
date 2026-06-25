'use client';

import React, { useRef, useEffect, useState } from 'react';
import { CharacterGenerator } from '@/lib/character/generator';
import { AnimationApplier } from '@/lib/animation/apply';
import { getStandardClips } from '@/lib/animation/clips';
import { ThemeEngine } from '@/lib/theme/engine';
import { defaultThemes, defaultRules } from '@/lib/theme/default-themes';
import { CharacterFlags, CharacterSpec } from '@/lib/character/types';
import { AnimationClip } from '@/lib/animation/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

interface AnimationPlayerProps {
  flags: CharacterFlags;
  theme?: string;
}

export const AnimationPlayer: React.FC<AnimationPlayerProps> = ({
  flags,
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generator] = useState(() => new CharacterGenerator());
  const [animationApplier] = useState(() => new AnimationApplier());
  const [themeEngine] = useState(() => new ThemeEngine(defaultThemes, defaultRules));
  
  const [currentAnimation, setCurrentAnimation] = useState<AnimationClip | null>(null);
  const [animationName, setAnimationName] = useState<string>('idle_down');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [spec, setSpec] = useState<CharacterSpec | null>(null);

  const standardClips = getStandardClips();

  // Convert flags to Set
  const flagsSet = new Set(
    Object.entries(flags)
      .filter(([_, value]) => value)
      .map(([key, value]) => `--${value}`)
  );

  // Get base spec
  useEffect(() => {
    try {
      const baseSpec = generator.computeSpecs(flagsSet, 64);
      setSpec(baseSpec);
    } catch (error) {
      console.error('Error computing spec:', error);
    }
  }, [flags, generator]);

  // Set current animation
  useEffect(() => {
    const clip = standardClips[animationName];
    if (clip) {
      setCurrentAnimation(clip);
      setCurrentTime(0);
    }
  }, [animationName, standardClips]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !currentAnimation || !spec) return;

    const startTime = Date.now() - (currentTime * currentAnimation.durationMs);
    let animationFrameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newTime = (elapsed * playbackSpeed) / currentAnimation.durationMs;
      
      if (loop || newTime <= 1) {
        const t = newTime % 1;
        setCurrentTime(t);
        
        // Render frame
        renderFrame(t);
        
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        setCurrentTime(1);
        renderFrame(1);
      }
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isPlaying, currentAnimation, spec, playbackSpeed, loop]);

  const renderFrame = (t: number) => {
    if (!canvasRef.current || !spec || !currentAnimation) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, canvas.width, canvas.height);
    }

    try {
      // Apply animation to spec
      let animatedSpec = animationApplier.applyTracks(spec, currentAnimation, t);
      animatedSpec = animationApplier.applySecondaryMotion(animatedSpec, t, spec);

      // Generate character with animated spec
      const { canvas: characterCanvas } = generator.generateGeometry(flagsSet, animatedSpec, 64);

      // Apply theme if selected
      if (theme) {
        const selectedTheme = defaultThemes.find(t => t.name === theme);
        if (selectedTheme) {
          themeEngine.sprayOnCanvas(characterCanvas, selectedTheme);
        }
      }

      // Draw character
      ctx.drawImage(characterCanvas, 0, 0);

      // Draw frame info
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(2, 2, 60, 20);
      ctx.fillStyle = 'white';
      ctx.font = '10px monospace';
      ctx.fillText(`Frame: ${Math.floor(t * 60)}/60`, 4, 14);

    } catch (error) {
      console.error('Error rendering animation frame:', error);
    }
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center lines
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStepBack = () => {
    const newTime = Math.max(0, currentTime - 1/60);
    setCurrentTime(newTime);
    renderFrame(newTime);
  };

  const handleStepForward = () => {
    const newTime = Math.min(1, currentTime + 1/60);
    setCurrentTime(newTime);
    renderFrame(newTime);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    renderFrame(0);
  };

  const handleTimeChange = (value: number[]) => {
    const newTime = value[0] / 100;
    setCurrentTime(newTime);
    if (!isPlaying) {
      renderFrame(newTime);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Animation Player</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={64}
              height={64}
              className="border rounded-lg bg-white"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          <div className="space-y-4">
            {/* Animation controls */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStepBack}
                disabled={currentTime <= 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handlePlayPause}
                size="sm"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleStepForward}
                disabled={currentTime >= 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Timeline slider */}
            <div className="space-y-2">
              <Label>Timeline</Label>
              <Slider
                value={[currentTime * 100]}
                onValueChange={handleTimeChange}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0:00</span>
                <span>{Math.floor(currentTime * 60)}/60 frames</span>
                <span>{currentAnimation ? `${(currentAnimation.durationMs / 1000).toFixed(1)}s` : '1.0s'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Animation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Animation</Label>
              <Select value={animationName} onValueChange={setAnimationName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(standardClips).map(([name, clip]) => (
                    <SelectItem key={name} value={name}>
                      {name.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Playback Speed</Label>
              <Slider
                value={[playbackSpeed]}
                onValueChange={(value) => setPlaybackSpeed(value[0])}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
              <div className="text-sm text-center">{playbackSpeed.toFixed(1)}x</div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="loop"
                checked={loop}
                onCheckedChange={setLoop}
              />
              <Label htmlFor="loop">Loop Animation</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="grid"
                checked={showGrid}
                onCheckedChange={setShowGrid}
              />
              <Label htmlFor="grid">Show Grid</Label>
            </div>
          </div>

          {currentAnimation && (
            <div className="text-sm text-muted-foreground">
              <p><strong>Duration:</strong> {(currentAnimation.durationMs / 1000).toFixed(1)}s</p>
              <p><strong>Tracks:</strong> {currentAnimation.tracks.length}</p>
              <p><strong>Loop:</strong> {currentAnimation.loop ? 'Yes' : 'No'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {spec && (
        <Card>
          <CardHeader>
            <CardTitle>Animation Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            {currentAnimation && (
              <div className="space-y-2">
                {currentAnimation.tracks.map((track, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {track.prop}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {track.keys.length} keys
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};