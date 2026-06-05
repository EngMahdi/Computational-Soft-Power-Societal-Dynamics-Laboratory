import type { EmotionalState } from '../types/agent';
import { decayEmotions } from '../types/agent';
import type { AgeProfile } from '../types/age';
import { advanceAge, susceptibility } from '../types/age';
import { safeClamp } from '../utils/metrics';
import type { TheoryApplication } from '../i18n/types';
import { applyTheoriesToMetrics } from './theoryEffects';

export const TICK_DAYS = 1;
export const TICK_YEARS = TICK_DAYS / 365;

/** السمات النفسية الـ12 للوكيل */
export type AgentTrait = Record<string, number>;

export interface DynamicAgent {
  traits: AgentTrait;
  memory: { recentEvents: string[]; longTermBeliefs: string[]; exposureCount: Record<string, number> };
  emotionalState: EmotionalState;
  state: string;
  ageProfile: AgeProfile;
  injectionHistory: any[];
  activeInjection?: { type: string; remainingTicks: number; narrative?: string; spreadToNetwork?: boolean; spreadRadius?: number; durationTicks?: number };
}

export function ageBaselineTraits(age: number): Partial<Record<string, number>> {
  const openness = 0.65 - 0.003 * (age - 15);
  const skepticism = 0.3 + 0.004 * age;
  const tribalism = 0.3 + 0.003 * Math.max(0, age - 25);
  const aggression = 0.45 - 0.002 * (age - 15);
  const trust = age < 35 ? 0.7 - 0.005 * age : 0.5 + 0.004 * (age - 35);
  const cognitive = 0.7 - 0.005 * age;
  const ideological = 0.2 + 0.006 * age;
  const attention = 0.6 - 0.001 * Math.abs(age - 35);
  const fearSens = 0.3 + 0.005 * age;
  const emotionality = 0.6 - 0.003 * (age - 20);
  const prestige = 0.6 - 0.002 * Math.max(0, age - 25);
  const conformity = 0.4 + 0.004 * Math.max(0, age - 30);

  return {
    openness: safeClamp(openness, 0.1),
    skepticism: safeClamp(skepticism, 0.1),
    tribalism: safeClamp(tribalism, 0.1),
    aggression: safeClamp(aggression, 0.1),
    trust_in_institutions: safeClamp(trust, 0.1),
    cognitive_flexibility: safeClamp(cognitive, 0.1),
    ideological_rigidity: safeClamp(ideological, 0.1),
    attention_span: safeClamp(attention, 0.1),
    fear_sensitivity: safeClamp(fearSens, 0.1),
    emotionality: safeClamp(emotionality, 0.1),
    prestige_seeking: safeClamp(prestige, 0.1),
    conformity: safeClamp(conformity, 0.1),
  };
}

export function applyEnvironment(
  traits: Record<string, number>,
  metrics: Record<string, number>,
  age: number
): Record<string, number> {
  const pol   = metrics.polarization            || 0;
  const coh   = metrics.cohesion                || 0;
  const frag  = metrics.identity_fragmentation  || 0;
  const meme  = metrics.memetic_velocity        || 0;
  const elite = metrics.elite_dominance         || 0;
  const resist = metrics.resistance_strength    || 0;
  const echo  = metrics.echo_density            || 0;
  const narr  = metrics.narrative_volatility    || 0;
  const algo  = metrics.algorithmic_capture     || 0;
  const ent   = metrics.ideological_entropy     || 0;
  const belief = metrics.belief_adoption        || 0;

  const updated = { ...traits };

  // التأثيرات مُعايَرة: ثُلث القيمة السابقة لمنع التراكم غير المحدود
  // المقاييس تتحرك ببطء ولكن بشكل ملحوظ عبر المحاكاة
  updated.aggression            = safeClamp((updated.aggression            || 0.5) + pol    * 0.03);
  updated.tribalism             = safeClamp((updated.tribalism             || 0.5) + pol    * 0.02);
  updated.trust_in_institutions = safeClamp((updated.trust_in_institutions || 0.5) + coh    * 0.03);
  updated.skepticism            = safeClamp((updated.skepticism            || 0.5) + frag   * 0.02);
  updated.openness              = safeClamp((updated.openness              || 0.5) - frag   * 0.02);
  updated.cognitive_flexibility = safeClamp((updated.cognitive_flexibility || 0.5) + meme   * 0.02);
  updated.prestige_seeking      = safeClamp((updated.prestige_seeking      || 0.5) + elite  * 0.02);
  updated.skepticism            = safeClamp((updated.skepticism            || 0.5) + resist  * 0.03);
  updated.ideological_rigidity  = safeClamp((updated.ideological_rigidity  || 0.5) + resist  * 0.02 + echo * 0.03);
  updated.conformity            = safeClamp((updated.conformity            || 0.5) + echo   * 0.02 + algo * 0.02);
  updated.fear_sensitivity      = safeClamp((updated.fear_sensitivity      || 0.5) + narr   * 0.03);
  updated.emotionality          = safeClamp((updated.emotionality          || 0.5) + narr   * 0.02);
  updated.openness              = safeClamp((updated.openness              || 0.5) + ent    * 0.02 + belief * 0.02);
  updated.skepticism            = safeClamp((updated.skepticism            || 0.5) + ent    * 0.015);

  return updated;
}

export function emotionToTraits(
  traits: Record<string, number>,
  emotional: EmotionalState
): Record<string, number> {
  const updated = { ...traits };
  if (emotional.fear > 0.6) {
    updated.fear_sensitivity = safeClamp((updated.fear_sensitivity || 0.5) + 0.02);
    updated.openness = safeClamp((updated.openness || 0.5) - 0.01);
    updated.tribalism = safeClamp((updated.tribalism || 0.5) + 0.01);
  }
  if (emotional.anger > 0.6) {
    updated.aggression = safeClamp((updated.aggression || 0.3) + 0.02);
    updated.openness = safeClamp((updated.openness || 0.5) - 0.01);
  }
  if (emotional.hope > 0.6) {
    updated.openness = safeClamp((updated.openness || 0.5) + 0.02);
    updated.trust_in_institutions = safeClamp((updated.trust_in_institutions || 0.5) + 0.02);
  }
  if (emotional.despair > 0.6) {
    updated.trust_in_institutions = safeClamp((updated.trust_in_institutions || 0.5) - 0.02);
    updated.skepticism = safeClamp((updated.skepticism || 0.5) + 0.02);
  }
  if (emotional.solidarity > 0.6) {
    updated.conformity = safeClamp((updated.conformity || 0.5) + 0.01);
    updated.tribalism = safeClamp((updated.tribalism || 0.5) - 0.01);
  }
  return updated;
}

export function lifeEvent(
  agent: DynamicAgent,
  metrics: Record<string, number>
): { traits: Record<string, number>; emotional: EmotionalState; memoryEvent?: string } {
  const pol    = metrics.polarization          || 0;
  const coh    = metrics.cohesion              || 0;
  const narr   = metrics.narrative_volatility  || 0;
  const resist = metrics.resistance_strength   || 0;
  const echo   = metrics.echo_density          || 0;
  const traits   = { ...agent.traits };
  const emotional = { ...agent.emotionalState };
  let memoryEvent: string | undefined;

  // احتمالات مُعايَرة: مرة كل ~50-100 tick بدلاً من كل 10-33 tick
  // عند pol=0.3 → احتمال 0.3×0.03 = 0.009 = مرة كل ~111 tick
  if (Math.random() < pol * 0.03) {
    emotional.fear    = Math.min(1, emotional.fear    + 0.15);
    emotional.despair = Math.min(1, emotional.despair + 0.10);
    emotional.anger   = Math.min(1, emotional.anger   + 0.08);
    traits.fear_sensitivity = safeClamp((traits.fear_sensitivity || 0.5) + 0.02);
    traits.aggression       = safeClamp((traits.aggression       || 0.3) + 0.02);
    memoryEvent = 'trauma_polarization';
  }
  if (Math.random() < (1 - coh) * 0.03) {
    emotional.despair = Math.min(1, emotional.despair + 0.10);
    emotional.anger   = Math.min(1, emotional.anger   + 0.08);
    traits.trust_in_institutions = safeClamp((traits.trust_in_institutions || 0.5) - 0.02);
    memoryEvent = memoryEvent || 'economic_stress';
  }
  if (Math.random() < narr * 0.04) {
    emotional.anger  = Math.min(1, emotional.anger  + 0.12);
    emotional.fear   = Math.min(1, emotional.fear   + 0.08);
    traits.skepticism = safeClamp((traits.skepticism || 0.5) + 0.02);
    traits.emotionality = safeClamp((traits.emotionality || 0.5) + 0.01);
    memoryEvent = memoryEvent || 'info_shock';
  }
  if (Math.random() < resist * 0.04) {
    emotional.hope       = Math.min(1, emotional.hope       + 0.12);
    emotional.solidarity = Math.min(1, emotional.solidarity + 0.10);
    traits.openness = safeClamp((traits.openness || 0.5) + 0.02);
    traits.skepticism = safeClamp((traits.skepticism || 0.5) + 0.01);
    memoryEvent = memoryEvent || 'resistance_boost';
  }
  if (Math.random() < echo * 0.03) {
    emotional.fear    = Math.min(1, emotional.fear    + 0.05);
    emotional.despair = Math.min(1, emotional.despair + 0.04);
    traits.ideological_rigidity = safeClamp((traits.ideological_rigidity || 0.4) + 0.02);
    traits.conformity           = safeClamp((traits.conformity           || 0.5) + 0.01);
    memoryEvent = memoryEvent || 'echo_reinforcement';
  }

  return { traits, emotional, memoryEvent };
}

export function evolveAgent(
  agent: DynamicAgent,
  metrics: Record<string, number>,
  tick: number,
  theories?: TheoryApplication[],
): DynamicAgent {
  const newAgeProfile = advanceAge(agent.ageProfile, 1, TICK_YEARS);
  const age = newAgeProfile.age;
  const baseline = ageBaselineTraits(age);
  let traits = { ...agent.traits };
  for (const key of Object.keys(baseline)) {
    const current = (traits as any)[key] || 0.5;
    const target = (baseline as any)[key];
    (traits as any)[key] = safeClamp(current + (target - current) * 0.02);
  }

  // تطبيق تأثيرات البيئة الأساسية
  traits = applyEnvironment(traits, metrics, age);
  traits = emotionToTraits(traits, agent.emotionalState);

  let newEmotional = decayEmotions(agent.emotionalState, 1);
  // لا توجد زيادة تلقائية عمياء لأي مشاعر بدون أحداث! المشاعر تنبع من الصدمات الخارجية والتفاعلات الشبكية فقط.
  const life = lifeEvent(agent, metrics);
  traits = { ...traits, ...life.traits };
  newEmotional = { ...newEmotional, ...life.emotional };

  let memory = { ...agent.memory };
  if (life.memoryEvent) {
    memory.recentEvents = [life.memoryEvent, ...memory.recentEvents].slice(0, 10);
  }

  // تطبيق تأثيرات النظريات على المقاييس البيئية (إذا مُرِّرت)
  // هذا يُعدِّل metrics للدورة القادمة عبر App.tsx
  // (التأثير يُمرَّر للخارج عبر القيمة المُعادة)
  const evolvedMetrics = theories && theories.length > 0
    ? applyTheoriesToMetrics(theories, metrics, 1, tick)
    : undefined;

  return {
    ...agent,
    ageProfile: newAgeProfile,
    traits,
    emotionalState: newEmotional,
    memory,
    // نُضيف evolvedMetrics كحقل مؤقت (تُستهلك في App.tsx)
    ...(evolvedMetrics ? { _evolvedMetrics: evolvedMetrics } : {}),
  };
}
