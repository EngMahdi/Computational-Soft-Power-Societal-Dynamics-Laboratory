/**
 * seedRNG.ts
 * ─────────────────────────────────────────────────────────────
 * Seeded Pseudo-Random Number Generator (Mulberry32 algorithm)
 * يضمن إعادة إنتاج نفس النتائج باستخدام نفس الـ seed.
 * ضروري للنشر الأكاديمي (Reproducibility).
 *
 * الاستخدام:
 *   const rng = new SeededRNG(42);
 *   rng.random()  // بديل Math.random() — نفس النتيجة دائماً مع seed=42
 * ─────────────────────────────────────────────────────────────
 */

export class SeededRNG {
  private state: number;
  readonly seed: number;
  private callCount: number = 0;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2 ** 32);
    this.state = this.seed;
  }

  /** [0, 1) — بديل Math.random() */
  random(): number {
    this.callCount++;
    // Mulberry32 — سريع وجودة إحصائية عالية
    this.state |= 0;
    this.state = this.state + 0x6d2b79f5 | 0;
    let z = Math.imul(this.state ^ this.state >>> 15, 1 | this.state);
    z = z + Math.imul(z ^ z >>> 7, 61 | z) ^ z;
    return ((z ^ z >>> 14) >>> 0) / 4294967296;
  }

  /** [min, max) */
  range(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  /** عدد صحيح [min, max] */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** اختيار عنصر عشوائي من مصفوفة */
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.random() * arr.length)];
  }

  /** خلط مصفوفة (Fisher-Yates) */
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** توزيع Gaussian (Box-Muller) */
  gaussian(mean: number, std: number): number {
    const u1 = this.random();
    const u2 = this.random();
    const z0 = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.min(1, mean + z0 * std));
  }

  /** معلومات الـ seed للتصدير */
  getInfo(): { seed: number; callCount: number } {
    return { seed: this.seed, callCount: this.callCount };
  }

  /** إعادة تعيين بنفس الـ seed */
  reset(): void {
    this.state = this.seed;
    this.callCount = 0;
  }
}

/** Instance عالمية — تُبدَّل عند بدء المحاكاة */
let _globalRNG: SeededRNG = new SeededRNG();

export function initGlobalRNG(seed?: number): SeededRNG {
  _globalRNG = new SeededRNG(seed);
  return _globalRNG;
}

export function rng(): SeededRNG {
  return _globalRNG;
}

/** بديل Math.random() */
export function rand(): number {
  return _globalRNG.random();
}

/** عدد صحيح [min, max] */
export function randInt(min: number, max: number): number {
  return _globalRNG.int(min, max);
}

/** توزيع Gaussian محدود في [0,1] */
export function randGaussian(mean: number, std: number): number {
  return _globalRNG.gaussian(mean, std);
}
