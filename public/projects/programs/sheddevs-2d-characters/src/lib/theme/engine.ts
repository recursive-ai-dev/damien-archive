export interface Theme {
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color?: string;
  rules?: ThemeRule[];
}

export interface ThemeRule {
  target: 'head' | 'torso' | 'legs' | 'robe' | 'all';
  property: 'fill' | 'outline' | 'shadow';
  color: string;
  opacity?: number;
}

export class ThemeEngine {
  private themes: Theme[];
  private rules: ThemeRule[];

  constructor(themes: Theme[], rules: ThemeRule[]) {
    this.themes = themes;
    this.rules = rules;
  }

  public applyTheme(canvas: HTMLCanvasElement, themeName: string): HTMLCanvasElement {
    const theme = this.themes.find(t => t.name === themeName);
    if (!theme) return canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Very simple "spray" application: replace white with primary, etc.
    // In a real robust system, we would use the SDF and more advanced color theory.
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const a = data[i+3];

      if (a > 0) {
        if (r === 255 && g === 255 && b === 255) {
          const color = this.hexToRgb(theme.primary_color);
          data[i] = color.r;
          data[i+1] = color.g;
          data[i+2] = color.b;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  public sprayOnCanvas(canvas: HTMLCanvasElement, theme: Theme) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const primary = this.hexToRgb(theme.primary_color);

    for (let i = 0; i < data.length; i += 4) {
      if (data[i+3] > 0) {
        // Simple blend/replace
        data[i] = primary.r;
        data[i+1] = primary.g;
        data[i+2] = primary.b;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  }
}
