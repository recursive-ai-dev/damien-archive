'use client';

import React, { useRef, useEffect, useState } from 'react';
import { CharacterGenerator } from '@/lib/character/generator';
import { ThemeEngine } from '@/lib/theme/engine';
import { defaultThemes, defaultRules } from '@/lib/theme/default-themes';
import { CharacterFlags, CharacterSpec } from '@/lib/character/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CharacterPreviewProps {
  flags: CharacterFlags;
  onFlagsChange: (flags: CharacterFlags) => void;
  theme?: string;
  onThemeChange?: (theme: string) => void;
}

export const CharacterPreview: React.FC<CharacterPreviewProps> = ({
  flags,
  onFlagsChange,
  theme,
  onThemeChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generator] = useState(() => new CharacterGenerator());
  const [themeEngine] = useState(() => new ThemeEngine(defaultThemes, defaultRules));
  const [currentTheme, setCurrentTheme] = useState(theme || 'forest_theme');
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(100);
  const [spec, setSpec] = useState<CharacterSpec | null>(null);

  // Convert flags to Set for generator
  const flagsSet = new Set(
    Object.entries(flags)
      .filter(([_, value]) => value)
      .map(([key, value]) => `--${value}`)
  );

  // Render character
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    try {
      // Generate character
      const result = generator.renderCharacter(flagsSet, 64);
      setSpec(result.spec);

      // Apply theme if selected
      if (currentTheme) {
        const selectedTheme = defaultThemes.find(t => t.name === currentTheme);
        if (selectedTheme) {
          themeEngine.sprayOnCanvas(result.composite, selectedTheme);
        }
      }

      // Draw character
      ctx.drawImage(result.composite, 0, 0);
    } catch (error) {
      console.error('Error rendering character:', error);
    }
  }, [flags, currentTheme, generator, themeEngine]);

  // Animation loop
  useEffect(() => {
    if (!animationPlaying) return;

    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 60);
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [animationPlaying, animationSpeed]);

  const handleFlagChange = (key: keyof CharacterFlags, value: string) => {
    onFlagsChange({ ...flags, [key]: value as any });
  };

  const handleThemeChange = (newTheme: string) => {
    setCurrentTheme(newTheme);
    onThemeChange?.(newTheme);
  };

  const toggleAnimation = () => {
    setAnimationPlaying(!animationPlaying);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Character Preview</CardTitle>
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
          
          <div className="flex justify-center gap-2">
            <Button
              onClick={toggleAnimation}
              variant={animationPlaying ? 'destructive' : 'default'}
              size="sm"
            >
              {animationPlaying ? 'Stop' : 'Play'} Animation
            </Button>
            <Button
              onClick={() => setAnimationFrame(0)}
              variant="outline"
              size="sm"
            >
              Reset
            </Button>
          </div>

          {animationPlaying && (
            <div className="space-y-2">
              <Label>Animation Speed</Label>
              <Slider
                value={[animationSpeed]}
                onValueChange={(value) => setAnimationSpeed(value[0])}
                min={50}
                max={500}
                step={10}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Character Customization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Species</Label>
              <Select value={flags.species} onValueChange={(value) => handleFlagChange('species', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="human">Human</SelectItem>
                  <SelectItem value="large_fantasy">Large Fantasy</SelectItem>
                  <SelectItem value="small_fantasy">Small Fantasy</SelectItem>
                  <SelectItem value="beast">Beast</SelectItem>
                  <SelectItem value="spectral">Spectral</SelectItem>
                  <SelectItem value="machine">Machine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Age</Label>
              <Select value={flags.age} onValueChange={(value) => handleFlagChange('age', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="young">Young</SelectItem>
                  <SelectItem value="middle_age">Middle Age</SelectItem>
                  <SelectItem value="old">Old</SelectItem>
                  <SelectItem value="undead">Undead</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={flags.size} onValueChange={(value) => handleFlagChange('size', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mood</Label>
              <Select value={flags.mood} onValueChange={(value) => handleFlagChange('mood', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="at_peace">At Peace</SelectItem>
                  <SelectItem value="in_chaos">In Chaos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Wealth</Label>
              <Select value={flags.wealth} onValueChange={(value) => handleFlagChange('wealth', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="middle_class">Middle Class</SelectItem>
                  <SelectItem value="rich">Rich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Strength</Label>
              <Select value={flags.strength} onValueChange={(value) => handleFlagChange('strength', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frail">Frail</SelectItem>
                  <SelectItem value="weak">Weak</SelectItem>
                  <SelectItem value="strong">Strong</SelectItem>
                  <SelectItem value="powerful">Powerful</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {defaultThemes.map((theme) => (
              <Button
                key={theme.name}
                variant={currentTheme === theme.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange(theme.name)}
                className="h-auto p-2"
              >
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: theme.primary_color }}
                  />
                  <span className="text-xs">{theme.name.replace('_theme', '')}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {spec && (
        <Card>
          <CardHeader>
            <CardTitle>Character Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>Head Height: {spec.head_h}px</div>
              <div>Torso Height: {spec.torso_h}px</div>
              <div>Leg Height: {spec.leg_h}px</div>
              <div>Head Ratio: {spec.head_n.toFixed(2)}</div>
              <div>Shoulder Width: {spec.s_half * 2}px</div>
              <div>Waist Width: {spec.w_half * 2}px</div>
              <div>Hip Width: {spec.h_half * 2}px</div>
              <div>Leg Gap: {spec.leg_gap}px</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};