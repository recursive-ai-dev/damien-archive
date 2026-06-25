export type SpeciesType = 'human' | 'large_fantasy' | 'small_fantasy' | 'beast' | 'spectral' | 'machine';
export type AgeType = 'young' | 'middle_age' | 'old' | 'undead';
export type SizeType = 'small' | 'medium' | 'large';
export type MoodType = 'at_peace' | 'in_chaos';
export type WealthType = 'poor' | 'middle_class' | 'rich';
export type StrengthType = 'frail' | 'weak' | 'strong' | 'powerful';

export interface CharacterFlags {
  species: SpeciesType;
  age: AgeType;
  size: SizeType;
  mood: MoodType;
  wealth: WealthType;
  strength: StrengthType;
}

export interface CharacterSpec {
  cx: number;
  top_margin: number;
  bottom_margin: number;
  head_h: number;
  head_rx: number;
  head_ry: number;
  head_n: number;
  torso_h: number;
  leg_h: number;
  s_half: number;
  w_half: number;
  h_half: number;
  waist_t: number;
  leg_gap: number;
  w_min: number;
  arm_thickness: number;
  robe: boolean;
  robe_len_px: number;
  robe_flare_px: number;
  robe_closure: number;
  robe_hip_extra_px: number;

  // Metadata fields
  species: string;
  size: string;
  age: string;
  strength: string;
  wealth: string;
  mood: string;
  base_size: number;

  // Optional/Dynamic fields for animation or other features
  hair?: boolean;
  [key: string]: any;
}

export interface CharacterGeneratorResult {
  composite: HTMLCanvasElement;
  spec: CharacterSpec;
}
