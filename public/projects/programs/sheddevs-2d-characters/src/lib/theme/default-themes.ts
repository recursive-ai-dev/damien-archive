import { Theme, ThemeRule } from './engine';

export const defaultRules: ThemeRule[] = [
  { target: 'all', property: 'fill', color: '#ffffff' }
];

export const defaultThemes: Theme[] = [
  {
    name: 'forest_theme',
    primary_color: '#2d5a27',
    secondary_color: '#4a7c44',
    accent_color: '#8b4513'
  },
  {
    name: 'ocean_theme',
    primary_color: '#1a4d6e',
    secondary_color: '#2c7fb8',
    accent_color: '#f0ead6'
  },
  {
    name: 'desert_theme',
    primary_color: '#c27e3a',
    secondary_color: '#e3b448',
    accent_color: '#3d3d3d'
  },
  {
    name: 'volcano_theme',
    primary_color: '#8b0000',
    secondary_color: '#ff4500',
    accent_color: '#2f2f2f'
  },
  {
    name: 'void_theme',
    primary_color: '#1a1a2e',
    secondary_color: '#16213e',
    accent_color: '#e94560'
  },
  {
    name: 'celestial_theme',
    primary_color: '#fff5e1',
    secondary_color: '#ffdac1',
    accent_color: '#b5ead7'
  },
  {
    name: 'cyberpunk_theme',
    primary_color: '#00fff5',
    secondary_color: '#ff00ff',
    accent_color: '#ffff00'
  },
  {
    name: 'royal_theme',
    primary_color: '#4b0082',
    secondary_color: '#ffd700',
    accent_color: '#ffffff'
  },
  {
    name: 'earth_theme',
    primary_color: '#4b3621',
    secondary_color: '#556b2f',
    accent_color: '#d2b48c'
  },
  {
    name: 'spectral_theme',
    primary_color: '#e0ffff',
    secondary_color: '#afeeee',
    accent_color: '#00ced1'
  }
];
