export type AgeGroup = "teen" | "youth" | "adult" | "elder";

export interface AgeProfile {
  group: AgeGroup;
  age:   number;
}

export function randomAgeProfile(): AgeProfile {
  const rand = Math.random();
  if (rand < 0.20) return { group: "teen",  age: 13 + Math.floor(Math.random() * 7) };
  if (rand < 0.53) return { group: "youth", age: 20 + Math.floor(Math.random() * 15) };
  if (rand < 0.83) return { group: "adult", age: 35 + Math.floor(Math.random() * 20) };
  return              { group: "elder", age: 55 + Math.floor(Math.random() * 25) };
}

/**
 * Age progression after a specific number of ticks
 * @param profile Current age profile
 * @param ticks Number of elapsed ticks
 * @param yearsPerTick How many years each tick represents (default: 0.01 = 1% من السنة ≈ 3.65 أيام)
 */
export function advanceAge(profile: AgeProfile, ticks: number, yearsPerTick: number = 0.01): AgeProfile {
  const newAge = profile.age + ticks * yearsPerTick;
  let group: AgeGroup = profile.group;
  
  // Update age group when crossing thresholds
  if (newAge >= 55) group = 'elder';
  else if (newAge >= 35) group = 'adult';
  else if (newAge >= 20) group = 'youth';
  else group = 'teen';
  
  // Keep age as a precise decimal to accumulate naturally each cycle
  return { group, age: newAge };
}

/**
 * Convert tick number to text time representation
 */
export function tickToTimeLabel(tick: number, yearsPerTick: number = 0.01): string {
  const totalYears = tick * yearsPerTick;
  if (totalYears < 1) {
    const days = Math.round(totalYears * 365);
    return `${days} days`;
  }
  if (totalYears < 2) {
    return `1 year`;
  }
  return `${Math.round(totalYears)} years`;
}

// Acceptance range for external influence
export function susceptibility(ag: AgeProfile): number {
  const map: Record<AgeGroup, number> = { teen: 1.35, youth: 1.10, adult: 0.85, elder: 0.70 };
  return map[ag.group];
}

// Influence range on others (social authority)
export function socialAuthority(ag: AgeProfile): number {
  const map: Record<AgeGroup, number> = { teen: 0.60, youth: 0.95, adult: 1.10, elder: 1.25 };
  return map[ag.group];
}

// Primary information source
export function primaryInfoSource(ag: AgeProfile): string {
  const map: Record<AgeGroup, string> = {
    teen:  "tiktok_instagram",
    youth: "telegram_twitter",
    adult: "tv_whatsapp",
    elder: "mosque_oral",
  };
  return map[ag.group];
}

// Fear of collapse
export function collapseFearBaseline(ag: AgeProfile): number {
  const map: Record<AgeGroup, number> = { teen: 0.25, youth: 0.45, adult: 0.70, elder: 0.85 };
  return map[ag.group];
}

// Display color on Canvas
export function ageColor(ag: AgeProfile): string {
  const map: Record<AgeGroup, string> = {
    teen:  "#60a5fa",
    youth: "#34d399",
    adult: "#f59e0b",
    elder: "#a78bfa",
  };
  return map[ag.group];
}