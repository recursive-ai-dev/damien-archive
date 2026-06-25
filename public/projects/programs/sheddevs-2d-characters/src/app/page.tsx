'use client';

import React, { useState } from 'react';
import { CharacterPreview } from '@/components/character/CharacterPreview';
import { SpriteSheetExporter } from '@/components/character/SpriteSheetExporter';
import { AnimationPlayer } from '@/components/character/AnimationPlayer';
import { CharacterFlags } from '@/lib/character/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [flags, setFlags] = useState<CharacterFlags>({
    species: 'human',
    age: 'middle_age',
    size: 'medium',
    mood: 'at_peace',
    wealth: 'middle_class',
    strength: 'weak'
  });

  const [theme, setTheme] = useState<string>('forest_theme');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            2D Character Generator
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Create pixel-perfect characters with animations and themes
          </p>
        </div>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Character Preview</TabsTrigger>
            <TabsTrigger value="animation">Animation Player</TabsTrigger>
            <TabsTrigger value="export">Sprite Sheet Export</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to the 2D Character Generator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Customize your character using the controls below. Adjust species, age, size, mood, 
                  wealth, and strength to create unique character variations. Apply different themes 
                  to change the visual style and colors.
                </p>
              </CardContent>
            </Card>
            
            <CharacterPreview
              flags={flags}
              onFlagsChange={setFlags}
              theme={theme}
              onThemeChange={setTheme}
            />
          </TabsContent>

          <TabsContent value="animation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Animation Player</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Preview character animations with full playback controls. Choose from different 
                  animation types, adjust playback speed, enable looping, and see real-time animation 
                  tracks and frame data.
                </p>
              </CardContent>
            </Card>
            
            <AnimationPlayer
              flags={flags}
              theme={theme}
            />
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Sprite Sheets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Generate sprite sheets for game development. Select animations, configure the layout, 
                  and export both the sprite sheet PNG and metadata JSON file. Perfect for integrating 
                  with game engines like Unity, Godot, or custom game frameworks.
                </p>
              </CardContent>
            </Card>
            
            <SpriteSheetExporter
              flags={flags}
              theme={theme}
            />
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Character Generation</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• 6 species types</li>
                  <li>• 4 age categories</li>
                  <li>• 3 size variations</li>
                  <li>• Mood and wealth options</li>
                  <li>• Strength levels</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Animation System</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Multiple easing functions</li>
                  <li>• Directional animations</li>
                  <li>• Idle, walk, run, jump</li>
                  <li>• Secondary motion effects</li>
                  <li>• Configurable timing</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">Theme Engine</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• 10 built-in themes</li>
                  <li>• Color harmony generation</li>
                  <li>• Lighting simulation</li>
                  <li>• Accessibility support</li>
                  <li>• Custom theme blending</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}