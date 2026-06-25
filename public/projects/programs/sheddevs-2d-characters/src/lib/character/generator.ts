import { CharacterFlags, CharacterSpec, CharacterGeneratorResult, SpeciesType, AgeType, SizeType, MoodType, WealthType, StrengthType } from './types';

export class CharacterGenerator {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
  }

  private clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private pickOne<T extends string>(flags: Set<string>, options: T[], defaultValue: T): T {
    for (const option of options) {
      if (flags.has(`--${option}`)) {
        return option;
      }
    }
    return defaultValue;
  }

  private resolveArgs(flags: Set<string>): CharacterFlags {
    return {
      species: this.pickOne(flags, ['human', 'large_fantasy', 'small_fantasy', 'beast', 'spectral', 'machine'], 'human') as SpeciesType,
      age: this.pickOne(flags, ['young', 'middle_age', 'old', 'undead'], 'middle_age') as AgeType,
      size: this.pickOne(flags, ['small', 'medium', 'large'], 'medium') as SizeType,
      mood: this.pickOne(flags, ['at_peace', 'in_chaos'], 'at_peace') as MoodType,
      wealth: this.pickOne(flags, ['poor', 'middle_class', 'rich'], 'middle_class') as WealthType,
      strength: this.pickOne(flags, ['frail', 'weak', 'strong', 'powerful'], 'weak') as StrengthType,
    };
  }

  public computeSpecs(flags: Set<string> | string[], baseSize: number = 64): CharacterSpec {
    const fset = flags instanceof Set ? flags : new Set(flags);
    const args = this.resolveArgs(fset);

    const cx = Math.floor(baseSize / 2);
    const top_margin = 3;
    const bottom_margin = 3;
    const total_h = baseSize - top_margin - bottom_margin;

    let head_r = 0.18;
    let torso_r = 0.38;

    let r_s = 0.27;
    let r_w = 0.21;
    let r_h = 0.25;

    let head_n = 2.3;
    let waist_t = 0.50;

    const sizeScaleMap: Record<SizeType, number> = { small: 0.92, medium: 1.0, large: 1.10 };
    const size_scale = sizeScaleMap[args.size];

    const leg_gap_scale = args.mood === 'at_peace' ? 1.0 : 1.18;

    const clothing = {
      shoulder_pad_px: 0,
      waist_cinch_px: 0,
      hip_flare_px: 0,
      robe: false,
      robe_length: 0.0,
      robe_flare_px: 0,
      robe_closure: 1.0,
      robe_hip_extra_px: 0,
    };

    const sp = args.species;
    const age = args.age;
    const strength = args.strength;

    if (sp === 'human') {
      if (args.wealth === 'rich') {
        clothing.robe = true;
        clothing.robe_length = 0.65;
        clothing.robe_flare_px = 6;
      } else if (args.wealth === 'middle_class') {
        clothing.robe = true;
        clothing.robe_length = 0.45;
        clothing.robe_flare_px = 3;
      }
    } else if (sp === 'large_fantasy') {
      head_r = 0.15;
      torso_r = 0.45;
      r_s = 0.35;
      r_h = 0.32;
      clothing.robe = true;
      clothing.robe_length = 0.5;
      clothing.shoulder_pad_px = 2;
    } else if (sp === 'small_fantasy') {
      head_r = 0.28;
      torso_r = 0.32;
      r_s = 0.22;
      r_h = 0.24;
    } else if (sp === 'beast') {
      head_r = 0.22;
      torso_r = 0.42;
      head_n = 1.8;
      r_s = 0.32;
      r_h = 0.30;
      waist_t = 0.55;
    } else if (sp === 'spectral') {
      head_r = 0.20;
      torso_r = 0.50;
      head_n = 2.5;
      waist_t = 0.60;
    } else if (sp === 'machine') {
      head_r = 0.18;
      torso_r = 0.38;
      head_n = 1.5; // Boxy
      r_s = 0.30;
      r_h = 0.30;
      clothing.shoulder_pad_px = 3;
    }

    if (age === 'old') {
      waist_t = 0.45; // Slouched
    } else if (age === 'undead') {
      clothing.robe = true;
      clothing.robe_length = 0.8;
      clothing.robe_closure = 0.4;
      clothing.robe_flare_px = 10;
    }

    if (strength === 'powerful') {
      r_s += 0.08;
      r_h += 0.04;
      clothing.shoulder_pad_px += 2;
    } else if (strength === 'frail') {
      r_s -= 0.05;
      r_w -= 0.04;
      r_h -= 0.05;
    }

    if (args.mood === 'in_chaos') {
      clothing.robe_flare_px = Math.round(clothing.robe_flare_px * 1.5);
      clothing.robe_closure = Math.max(0.0, clothing.robe_closure - 0.20);
    }

    head_r = this.clamp(head_r, 0.12, 0.35);
    torso_r = this.clamp(torso_r, 0.28, 0.46);
    let legs_r = 1.0 - head_r - torso_r;
    legs_r = this.clamp(legs_r, 0.30, 0.56);

    const head_h = Math.max(6, Math.round(total_h * head_r));
    const torso_h = Math.max(10, Math.round(total_h * torso_r));
    const leg_h = Math.max(6, total_h - head_h - torso_h);

    let s_half = Math.round(0.5 * total_h * r_s * size_scale);
    let w_half = Math.round(0.5 * total_h * r_w * size_scale);
    let h_half = Math.round(0.5 * total_h * r_h * size_scale);

    s_half += clothing.shoulder_pad_px;
    w_half -= clothing.waist_cinch_px;
    h_half += clothing.hip_flare_px;

    const max_half = cx - 2;
    s_half = Math.floor(this.clamp(s_half, 4, max_half));
    h_half = Math.floor(this.clamp(h_half, 4, max_half));
    w_half = Math.floor(this.clamp(w_half, 2, Math.min(s_half, h_half)));

    const base_gap = Math.max(2, Math.round(0.08 * total_h));
    let leg_gap = Math.round(base_gap * leg_gap_scale);

    let w_min = 2;
    if (sp === 'spectral') w_min = 1;
    else if (sp === 'machine') w_min = 3;
    else if (age === 'undead') w_min = 1;

    const max_gap = Math.max(0, 2 * (Math.max(1, h_half - Math.max(1, w_min))));
    leg_gap = Math.floor(this.clamp(leg_gap, 0, max_gap));

    const head_ry = Math.floor(head_h / 2);
    const head_rx = Math.max(4, Math.round(head_h * 0.38));

    let arm_thickness = 2;
    if (strength === 'strong' || strength === 'powerful') arm_thickness = 3;
    else if (strength === 'frail') arm_thickness = 1;

    waist_t = this.clamp(waist_t, 0.35, 0.65);

    const robe_len_px = clothing.robe ? Math.round(leg_h * clothing.robe_length) : 0;

    return {
      cx,
      top_margin,
      bottom_margin,
      head_h,
      head_rx,
      head_ry,
      head_n,
      torso_h,
      leg_h,
      s_half,
      w_half,
      h_half,
      waist_t,
      leg_gap,
      w_min,
      arm_thickness,
      robe: clothing.robe,
      robe_len_px,
      robe_flare_px: clothing.robe_flare_px,
      robe_closure: clothing.robe_closure,
      robe_hip_extra_px: clothing.robe_hip_extra_px,
      species: args.species,
      size: args.size,
      age: args.age,
      strength: args.strength,
      wealth: args.wealth,
      mood: args.mood,
      base_size: baseSize,
    };
  }

  private getTorsoCoeffs(s_half: number, w_half: number, h_half: number, waist_t: number = 0.5) {
    const s = s_half;
    const w = w_half;
    const h = h_half;
    let t = waist_t;

    if (Math.abs(t * (t - 1.0)) < 1e-6) {
      t = 0.5;
    }

    const a = (w - s - t * (h - s)) / (t * (t - 1.0));
    const b = (h - s) - a;
    const c = s;
    return { a, b, c };
  }

  private drawSuperellipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, n: number, color: string = 'white') {
    n = Math.max(1.5, n);
    rx = Math.max(1, rx);
    ry = Math.max(1, ry);

    ctx.fillStyle = color;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = Math.abs((x - cx) / rx);
        const ny = Math.abs((y - cy) / ry);
        if (Math.pow(nx, n) + Math.pow(ny, n) <= 1.0) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  public generateGeometry(flags: Set<string> | string[], specIn?: CharacterSpec, baseSize: number = 64): { canvas: HTMLCanvasElement; spec: CharacterSpec } {
    const fset = flags instanceof Set ? flags : new Set(flags);
    const spec = specIn || this.computeSpecs(fset, baseSize);

    const canvas = document.createElement('canvas');
    canvas.width = baseSize;
    canvas.height = baseSize;
    const ctx = canvas.getContext('2d')!;

    const cx = spec.cx;
    let y = spec.top_margin;

    const head_cy = y + spec.head_ry;
    this.drawSuperellipse(ctx, cx, head_cy, spec.head_rx, spec.head_ry, spec.head_n);

    const neck_gap = 1;
    const torso_top = head_cy + spec.head_ry + neck_gap;

    const { a, b, c } = this.getTorsoCoeffs(spec.s_half, spec.w_half, spec.h_half, spec.waist_t);

    ctx.fillStyle = 'white';
    if (spec.species !== 'spectral') {
      const arm_t = spec.arm_thickness;
      const s_top = Math.round(spec.s_half);
      const arm_x_left0 = cx - s_top - arm_t;
      const arm_x_right0 = cx + s_top;
      const arm_y0 = torso_top + 1;
      const arm_y1 = torso_top + spec.torso_h - 1;
      const arm_h = Math.max(1, arm_y1 - arm_y0);

      ctx.fillRect(arm_x_left0, arm_y0, arm_t, arm_h);
      ctx.fillRect(arm_x_right0, arm_y0, arm_t, arm_h);
    }

    // Rasterize torso
    let acc = 0.0;
    for (let i = 0; i < spec.torso_h; i++) {
      const y_line = torso_top + i;
      const t = spec.torso_h <= 1 ? 0 : i / (spec.torso_h - 1);
      const w_f = a * t * t + b * t + c;
      const v = w_f + acc;
      const half_w = Math.round(v);
      acc = v - half_w;
      const clamped_half_w = Math.floor(this.clamp(half_w, 1, baseSize / 2 - 1));
      ctx.fillRect(cx - clamped_half_w, y_line, clamped_half_w * 2 + 1, 1);
    }

    const leg_top = torso_top + spec.torso_h;
    const leg_h = spec.leg_h;
    let gap_half = Math.floor(spec.leg_gap / 2);
    const w_top = Math.max(1, spec.h_half - gap_half);
    const w_min = Math.max(1, spec.w_min);

    if (spec.species === 'spectral') {
      gap_half = 0;
    }

    for (let j = 0; j < leg_h; j++) {
      const y_line = leg_top + j;
      const u = leg_h <= 1 ? 0 : j / (leg_h - 1);
      let w_leg = Math.round(this.lerp(w_top, w_min, u));
      w_leg = Math.max(0, w_leg);

      ctx.fillRect(cx - gap_half - w_leg, y_line, w_leg, 1);
      ctx.fillRect(cx + gap_half, y_line, w_leg, 1);
    }

    // Robe overlay
    if (spec.robe && spec.robe_len_px > 0) {
      const robe_len = Math.min(spec.robe_len_px, leg_h);
      const robe_flare = Math.max(0, spec.robe_flare_px);
      const robe_closure = this.clamp(spec.robe_closure, 0.0, 1.0);
      const hip_extra = Math.max(0, spec.robe_hip_extra_px);

      for (let j = 0; j < robe_len; j++) {
        const y_line = leg_top + j;
        const u = robe_len <= 1 ? 0 : j / (robe_len - 1);

        let w_cloth = spec.h_half + hip_extra;
        w_cloth = Math.round(this.lerp(w_cloth, w_cloth + robe_flare, u));
        w_cloth = Math.floor(this.clamp(w_cloth, 1, baseSize / 2 - 1));

        const g_cloth = Math.round(spec.leg_gap * (1.0 - robe_closure) * (1.0 - u));
        const g_half = Math.floor(g_cloth / 2);

        if (g_cloth <= 0) {
          ctx.fillRect(cx - w_cloth, y_line, w_cloth * 2 + 1, 1);
        } else {
          ctx.fillRect(cx - g_half - w_cloth, y_line, w_cloth, 1);
          ctx.fillRect(cx + g_half, y_line, w_cloth, 1);
        }
      }
    }

    return { canvas, spec };
  }

  public renderCharacter(flags: Set<string> | string[], baseSize: number = 64): CharacterGeneratorResult {
    const { canvas, spec } = this.generateGeometry(flags, undefined, baseSize);
    return { composite: canvas, spec };
  }
}
