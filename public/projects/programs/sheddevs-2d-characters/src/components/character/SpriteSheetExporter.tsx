'use client';

import React, { useState, useRef } from 'react';
import { CharacterGenerator } from '@/lib/character/generator';
import { SpriteSheetGenerator, SpriteSheetConfig } from '@/lib/animation/spritesheet';
import { getStandardClips } from '@/lib/animation/clips';
import { CharacterFlags } from '@/lib/character/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface SpriteSheetExporterProps {
  flags: CharacterFlags;
  theme?: string;
}

export const SpriteSheetExporter: React.FC<SpriteSheetExporterProps> = ({
  flags,
  theme
}) => {
  const [generator] = useState(() => new CharacterGenerator());
  const [spriteSheetGenerator] = useState(() => new SpriteSheetGenerator());
  const [config, setConfig] = useState<SpriteSheetConfig>({
    frameWidth: 64,
    frameHeight: 64,
    cols: 4,
    rows: 4,
    padding: 2
  });
  const [selectedAnimations, setSelectedAnimations] = useState<string[]>(['idle_down', 'walk_down']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Convert flags to Set
  const flagsSet = new Set(
    Object.entries(flags)
      .filter(([_, value]) => value)
      .map(([key, value]) => `--${value}`)
  );

  const standardClips = getStandardClips();

  const handleConfigChange = (key: keyof SpriteSheetConfig, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleAnimationToggle = (animationName: string) => {
    setSelectedAnimations(prev => 
      prev.includes(animationName)
        ? prev.filter(name => name !== animationName)
        : [...prev, animationName]
    );
  };

  const generateSpriteSheet = async () => {
    setIsGenerating(true);
    
    try {
      // Filter selected clips
      const selectedClips: Record<string, any> = {};
      selectedAnimations.forEach(name => {
        if (standardClips[name]) {
          selectedClips[name] = standardClips[name];
        }
      });

      if (Object.keys(selectedClips).length === 0) {
        toast({
          title: "No animations selected",
          description: "Please select at least one animation to generate.",
          variant: "destructive"
        });
        return;
      }

      // Generate sprite sheet
      const { canvas, metadata } = spriteSheetGenerator.generateDirectionalSpriteSheet(
        flagsSet,
        selectedClips,
        config
      );

      // Create preview URL
      const url = canvas.toDataURL('image/png');
      setPreviewUrl(url);

      // Download files
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `character-${timestamp}`;

      // Download sprite sheet
      canvas.toBlob((blob) => {
        if (blob) {
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${filename}.png`;
          a.click();
          URL.revokeObjectURL(downloadUrl);
        }
      });

      // Download metadata
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      const metadataUrl = URL.createObjectURL(metadataBlob);
      const a = document.createElement('a');
      a.href = metadataUrl;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(metadataUrl);

      toast({
        title: "Sprite sheet generated!",
        description: `Generated ${metadata.frames} frames across ${Object.keys(selectedAnimations).length} animations.`,
      });

    } catch (error) {
      console.error('Error generating sprite sheet:', error);
      toast({
        title: "Generation failed",
        description: "There was an error generating the sprite sheet.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sprite Sheet Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Frame Width</Label>
              <Slider
                value={[config.frameWidth]}
                onValueChange={(value) => handleConfigChange('frameWidth', value[0])}
                min={32}
                max={128}
                step={32}
                className="w-full"
              />
              <div className="text-sm text-center">{config.frameWidth}px</div>
            </div>

            <div className="space-y-2">
              <Label>Frame Height</Label>
              <Slider
                value={[config.frameHeight]}
                onValueChange={(value) => handleConfigChange('frameHeight', value[0])}
                min={32}
                max={128}
                step={32}
                className="w-full"
              />
              <div className="text-sm text-center">{config.frameHeight}px</div>
            </div>

            <div className="space-y-2">
              <Label>Columns</Label>
              <Slider
                value={[config.cols]}
                onValueChange={(value) => handleConfigChange('cols', value[0])}
                min={2}
                max={8}
                step={1}
                className="w-full"
              />
              <div className="text-sm text-center">{config.cols}</div>
            </div>

            <div className="space-y-2">
              <Label>Rows</Label>
              <Slider
                value={[config.rows]}
                onValueChange={(value) => handleConfigChange('rows', value[0])}
                min={2}
                max={8}
                step={1}
                className="w-full"
              />
              <div className="text-sm text-center">{config.rows}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Padding</Label>
            <Slider
              value={[config.padding || 0]}
              onValueChange={(value) => handleConfigChange('padding', value[0])}
              min={0}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="text-sm text-center">{config.padding || 0}px</div>
          </div>

          <div className="text-sm text-muted-foreground">
            Total frames: {config.cols * config.rows} | 
            Sheet size: {config.cols * (config.frameWidth + (config.padding || 0)) - (config.padding || 0)}×{config.rows * (config.frameHeight + (config.padding || 0)) - (config.padding || 0)}px
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Animation Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(standardClips).map(([name, clip]) => (
              <div key={name} className="flex items-center space-x-2">
                <Switch
                  id={name}
                  checked={selectedAnimations.includes(name)}
                  onCheckedChange={() => handleAnimationToggle(name)}
                />
                <Label htmlFor={name} className="text-sm">
                  {name.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground">
            Selected animations: {selectedAnimations.length}
          </div>
        </CardContent>
      </Card>

      {previewUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Sprite sheet preview"
                className="border rounded-lg max-w-full"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={generateSpriteSheet}
              disabled={isGenerating || selectedAnimations.length === 0}
              className="flex-1"
            >
              {isGenerating ? 'Generating...' : 'Generate Sprite Sheet'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAnimations(['idle_down', 'walk_down']);
                setPreviewUrl(null);
              }}
            >
              Reset
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            This will generate a PNG sprite sheet and JSON metadata file with animation data,
            including frame positions and anchor points for game development.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};