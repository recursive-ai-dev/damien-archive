import { CharacterSpec } from '../character/types';

export class CharacterConstraints {
  static getConstraintFor(prop: string): (val: number, spec: CharacterSpec) => number {
    const constraints: Record<string, (val: number, spec: CharacterSpec) => number> = {
      head_rx: (val) => Math.max(4, val),
      head_ry: (val) => Math.max(3, val),
      head_n: (val) => Math.max(1.5, val),
      waist_t: (val) => Math.max(0.35, Math.min(0.65, val)),
      leg_gap: (val) => Math.max(0, val),
      s_half: (val, s) => Math.max(4, Math.min(s.cx - 2, val)),
      w_half: (val, s) => Math.max(2, Math.min(s.s_half, val)),
      h_half: (val, s) => Math.max(4, Math.min(s.cx - 2, val)),
      arm_thickness: (val) => Math.max(1, Math.min(5, val)),
      robe_flare_px: (val) => Math.max(0, val),
      robe_closure: (val) => Math.max(0, Math.min(1, val)),
      robe_len_px: (val, s) => Math.max(0, Math.min(s.leg_h, val)),
    };
    
    return constraints[prop] || ((val) => val);
  }
}