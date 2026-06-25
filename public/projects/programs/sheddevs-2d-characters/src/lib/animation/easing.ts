export const Ease = {
  linear: (t: number): number => t,
  quadIn: (t: number): number => t * t,
  quadOut: (t: number): number => t * (2 - t),
  quadInOut: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  cubicIn: (t: number): number => t * t * t,
  cubicOut: (t: number): number => (--t) * t * t + 1,
  cubicInOut: (t: number): number => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  quartIn: (t: number): number => t * t * t * t,
  quartOut: (t: number): number => 1 - (--t) * t * t * t,
  quartInOut: (t: number): number => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  quintIn: (t: number): number => t * t * t * t * t,
  quintOut: (t: number): number => 1 + (--t) * t * t * t * t,
  quintInOut: (t: number): number => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
  sineIn: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),
  sineOut: (t: number): number => Math.sin((t * Math.PI) / 2),
  sineInOut: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,
  expoIn: (t: number): number => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  expoOut: (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  expoInOut: (t: number): number => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  circIn: (t: number): number => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  circOut: (t: number): number => Math.sqrt(1 - Math.pow(t - 1, 2)),
  circInOut: (t: number): number => t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
  backIn: (t: number): number => {
    const c = 1.70158;
    return c * t * t * t - t * t;
  },
  backOut: (t: number): number => {
    const c = 1.70158;
    return 1 + c * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
  backInOut: (t: number): number => {
    const c = 1.70158 * 1.525;
    return t < 0.5 
      ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2 
      : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2;
  },
  elasticIn: (t: number): number => {
    const c = 2 * Math.PI / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c);
  },
  elasticOut: (t: number): number => {
    const c = 2 * Math.PI / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c) + 1;
  },
  elasticInOut: (t: number): number => {
    const c = 2 * Math.PI / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c)) / 2 
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c)) / 2 + 1;
  },
  bounceIn: (t: number): number => 1 - Ease.bounceOut(1 - t),
  bounceOut: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      t -= 1.5 / d1;
      return n1 * t * t + 0.75;
    } else if (t < 2.5 / d1) {
      t -= 2.25 / d1;
      return n1 * t * t + 0.9375;
    } else {
      t -= 2.625 / d1;
      return n1 * t * t + 0.984375;
    }
  },
  bounceInOut: (t: number): number => t < 0.5 
    ? (1 - Ease.bounceOut(1 - 2 * t)) / 2 
    : (1 + Ease.bounceOut(2 * t - 1)) / 2
} as const;

export type EasingType = keyof typeof Ease;