/**
 * agentArchetypes.ts
 * ─────────────────────────────────────────────────────────────
 * Universal Agent Archetype System — نظام تصنيف الوكلاء الشامل
 *
 * كل archetype هو مجرد مجموعة قيم رياضية لصفات نفسية-اجتماعية.
 * لا يحمل أي حكم قيمي. الباحث هو من يحدد التسميات والنسب
 * حسب منطقته ودراسته.
 * ─────────────────────────────────────────────────────────────
 */

import type { AgeGroup } from '../types/age';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ArchetypeCategory {
  id: string;
  icon: string;
  color: string;
}

export interface ArchetypeTraitPreset {
  openness: number;
  skepticism: number;
  conformity: number;
  tribalism: number;
  aggression: number;
  prestige_seeking: number;
  fear_sensitivity: number;
  emotionality: number;
  cognitive_flexibility: number;
  ideological_rigidity: number;
  attention_span: number;
  trust_in_institutions: number;
  critical_thinking: number;
}

export interface ArchetypeEmotionPreset {
  fear: number;
  anger: number;
  hope: number;
  pride: number;
  despair: number;
  solidarity: number;
}

export interface AgentArchetype {
  id: string;
  categoryId: string;
  icon: string;
  traits: ArchetypeTraitPreset;
  emotions: ArchetypeEmotionPreset;
  typicalAgeGroup: AgeGroup;
}

// ─────────────────────────────────────────────────────────────
// Categories — 6 فئات شاملة
// ─────────────────────────────────────────────────────────────

export const ARCHETYPE_CATEGORIES: ArchetypeCategory[] = [
  {
    id: 'academic',
    icon: '📚',
    color: '#3b82f6',
    },
  {
    id: 'religious',
    icon: '⛪',
    color: '#10b981',
    },
  {
    id: 'economic',
    icon: '💼',
    color: '#f59e0b',
    },
  {
    id: 'political',
    icon: '🏛',
    color: '#8b5cf6',
    },
  {
    id: 'media',
    icon: '📱',
    color: '#06b6d4',
    },
  {
    id: 'ideological',
    icon: '🌍',
    color: '#ef4444',
    },
];

// ─────────────────────────────────────────────────────────────
// Archetypes — 31 نمطاً شاملاً
// ─────────────────────────────────────────────────────────────

export const AGENT_ARCHETYPES: AgentArchetype[] = [

  // ── 📚 أكاديمي / تعليمي ──────────────────────────────────

  {
    id: 'student',
    categoryId: 'academic',
    icon: '🎒',
    traits: {
      openness: 0.72, skepticism: 0.55, conformity: 0.45, tribalism: 0.38,
      aggression: 0.35, prestige_seeking: 0.50, fear_sensitivity: 0.42,
      emotionality: 0.68, cognitive_flexibility: 0.70, ideological_rigidity: 0.25,
      attention_span: 0.55, trust_in_institutions: 0.30, critical_thinking: 0.60,
    },
    emotions: { fear: 0.25, anger: 0.42, hope: 0.60, pride: 0.38, despair: 0.28, solidarity: 0.55 },
    typicalAgeGroup: 'youth',
    },

  {
    id: 'academic_professor',
    categoryId: 'academic',
    icon: '🎓',
    traits: {
      openness: 0.78, skepticism: 0.80, conformity: 0.30, tribalism: 0.25,
      aggression: 0.22, prestige_seeking: 0.60, fear_sensitivity: 0.28,
      emotionality: 0.38, cognitive_flexibility: 0.75, ideological_rigidity: 0.20,
      attention_span: 0.85, trust_in_institutions: 0.35, critical_thinking: 0.90,
    },
    emotions: { fear: 0.18, anger: 0.35, hope: 0.55, pride: 0.55, despair: 0.20, solidarity: 0.40 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'intellectual',
    categoryId: 'academic',
    icon: '✍️',
    traits: {
      openness: 0.85, skepticism: 0.82, conformity: 0.20, tribalism: 0.18,
      aggression: 0.28, prestige_seeking: 0.45, fear_sensitivity: 0.32,
      emotionality: 0.55, cognitive_flexibility: 0.88, ideological_rigidity: 0.15,
      attention_span: 0.78, trust_in_institutions: 0.12, critical_thinking: 0.92,
    },
    emotions: { fear: 0.22, anger: 0.50, hope: 0.48, pride: 0.45, despair: 0.35, solidarity: 0.38 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'dropout_youth',
    categoryId: 'academic',
    icon: '😤',
    traits: {
      openness: 0.58, skepticism: 0.72, conformity: 0.32, tribalism: 0.48,
      aggression: 0.75, prestige_seeking: 0.55, fear_sensitivity: 0.52,
      emotionality: 0.82, cognitive_flexibility: 0.48, ideological_rigidity: 0.32,
      attention_span: 0.38, trust_in_institutions: 0.08, critical_thinking: 0.35,
    },
    emotions: { fear: 0.32, anger: 0.68, hope: 0.22, pride: 0.35, despair: 0.48, solidarity: 0.42 },
    typicalAgeGroup: 'youth',
    },

  // ── ⛪ ديني / روحاني ──────────────────────────────────────

  {
    id: 'clergy',
    categoryId: 'religious',
    icon: '🕌',
    traits: {
      openness: 0.22, skepticism: 0.45, conformity: 0.72, tribalism: 0.65,
      aggression: 0.30, prestige_seeking: 0.70, fear_sensitivity: 0.60,
      emotionality: 0.55, cognitive_flexibility: 0.22, ideological_rigidity: 0.88,
      attention_span: 0.72, trust_in_institutions: 0.25, critical_thinking: 0.28,
    },
    emotions: { fear: 0.38, anger: 0.42, hope: 0.50, pride: 0.72, despair: 0.18, solidarity: 0.75 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'devout_moderate',
    categoryId: 'religious',
    icon: '🤲',
    traits: {
      openness: 0.48, skepticism: 0.50, conformity: 0.62, tribalism: 0.52,
      aggression: 0.22, prestige_seeking: 0.38, fear_sensitivity: 0.55,
      emotionality: 0.55, cognitive_flexibility: 0.42, ideological_rigidity: 0.58,
      attention_span: 0.62, trust_in_institutions: 0.32, critical_thinking: 0.40,
    },
    emotions: { fear: 0.38, anger: 0.28, hope: 0.50, pride: 0.50, despair: 0.22, solidarity: 0.62 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'religious_extremist',
    categoryId: 'religious',
    icon: '🔱',
    traits: {
      openness: 0.10, skepticism: 0.40, conformity: 0.78, tribalism: 0.82,
      aggression: 0.65, prestige_seeking: 0.55, fear_sensitivity: 0.72,
      emotionality: 0.78, cognitive_flexibility: 0.08, ideological_rigidity: 0.95,
      attention_span: 0.68, trust_in_institutions: 0.12, critical_thinking: 0.12,
    },
    emotions: { fear: 0.55, anger: 0.65, hope: 0.38, pride: 0.75, despair: 0.28, solidarity: 0.80 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'spiritual_seeker',
    categoryId: 'religious',
    icon: '🌙',
    traits: {
      openness: 0.75, skepticism: 0.55, conformity: 0.35, tribalism: 0.30,
      aggression: 0.15, prestige_seeking: 0.28, fear_sensitivity: 0.45,
      emotionality: 0.72, cognitive_flexibility: 0.68, ideological_rigidity: 0.28,
      attention_span: 0.62, trust_in_institutions: 0.22, critical_thinking: 0.58,
    },
    emotions: { fear: 0.28, anger: 0.20, hope: 0.68, pride: 0.38, despair: 0.22, solidarity: 0.55 },
    typicalAgeGroup: 'adult',
    },

  // ── 💼 اقتصادي / مهني ────────────────────────────────────

  {
    id: 'elite_wealthy',
    categoryId: 'economic',
    icon: '🏦',
    traits: {
      openness: 0.40, skepticism: 0.65, conformity: 0.45, tribalism: 0.58,
      aggression: 0.35, prestige_seeking: 0.88, fear_sensitivity: 0.48,
      emotionality: 0.32, cognitive_flexibility: 0.48, ideological_rigidity: 0.52,
      attention_span: 0.75, trust_in_institutions: 0.55, critical_thinking: 0.60,
    },
    emotions: { fear: 0.42, anger: 0.28, hope: 0.48, pride: 0.80, despair: 0.12, solidarity: 0.28 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'businessman',
    categoryId: 'economic',
    icon: '💼',
    traits: {
      openness: 0.55, skepticism: 0.60, conformity: 0.48, tribalism: 0.45,
      aggression: 0.38, prestige_seeking: 0.72, fear_sensitivity: 0.45,
      emotionality: 0.38, cognitive_flexibility: 0.58, ideological_rigidity: 0.38,
      attention_span: 0.70, trust_in_institutions: 0.35, critical_thinking: 0.58,
    },
    emotions: { fear: 0.38, anger: 0.32, hope: 0.52, pride: 0.58, despair: 0.22, solidarity: 0.32 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'worker_craftsman',
    categoryId: 'economic',
    icon: '🔧',
    traits: {
      openness: 0.38, skepticism: 0.50, conformity: 0.60, tribalism: 0.55,
      aggression: 0.45, prestige_seeking: 0.28, fear_sensitivity: 0.62,
      emotionality: 0.58, cognitive_flexibility: 0.38, ideological_rigidity: 0.48,
      attention_span: 0.42, trust_in_institutions: 0.22, critical_thinking: 0.32,
    },
    emotions: { fear: 0.48, anger: 0.52, hope: 0.30, pride: 0.40, despair: 0.40, solidarity: 0.58 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'civil_servant',
    categoryId: 'economic',
    icon: '🗂️',
    traits: {
      openness: 0.45, skepticism: 0.52, conformity: 0.62, tribalism: 0.48,
      aggression: 0.22, prestige_seeking: 0.42, fear_sensitivity: 0.55,
      emotionality: 0.42, cognitive_flexibility: 0.45, ideological_rigidity: 0.42,
      attention_span: 0.60, trust_in_institutions: 0.45, critical_thinking: 0.42,
    },
    emotions: { fear: 0.40, anger: 0.28, hope: 0.38, pride: 0.38, despair: 0.28, solidarity: 0.42 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'unemployed_poor',
    categoryId: 'economic',
    icon: '😔',
    traits: {
      openness: 0.30, skepticism: 0.48, conformity: 0.58, tribalism: 0.55,
      aggression: 0.42, prestige_seeking: 0.18, fear_sensitivity: 0.78,
      emotionality: 0.68, cognitive_flexibility: 0.28, ideological_rigidity: 0.50,
      attention_span: 0.25, trust_in_institutions: 0.06, critical_thinking: 0.22,
    },
    emotions: { fear: 0.62, anger: 0.55, hope: 0.10, pride: 0.18, despair: 0.72, solidarity: 0.28 },
    typicalAgeGroup: 'adult',
    },

  // ── 🏛 سياسي / مدني ──────────────────────────────────────

  {
    id: 'community_leader',
    categoryId: 'political',
    icon: '🏴',
    traits: {
      openness: 0.32, skepticism: 0.58, conformity: 0.48, tribalism: 0.90,
      aggression: 0.42, prestige_seeking: 0.88, fear_sensitivity: 0.52,
      emotionality: 0.42, cognitive_flexibility: 0.35, ideological_rigidity: 0.68,
      attention_span: 0.68, trust_in_institutions: 0.22, critical_thinking: 0.38,
    },
    emotions: { fear: 0.35, anger: 0.42, hope: 0.42, pride: 0.78, despair: 0.18, solidarity: 0.72 },
    typicalAgeGroup: 'elder',
    },

  {
    id: 'rights_activist',
    categoryId: 'political',
    icon: '📢',
    traits: {
      openness: 0.78, skepticism: 0.75, conformity: 0.18, tribalism: 0.28,
      aggression: 0.55, prestige_seeking: 0.45, fear_sensitivity: 0.38,
      emotionality: 0.72, cognitive_flexibility: 0.72, ideological_rigidity: 0.35,
      attention_span: 0.62, trust_in_institutions: 0.08, critical_thinking: 0.78,
    },
    emotions: { fear: 0.28, anger: 0.62, hope: 0.58, pride: 0.55, despair: 0.32, solidarity: 0.80 },
    typicalAgeGroup: 'youth',
    },

  {
    id: 'politician',
    categoryId: 'political',
    icon: '🎩',
    traits: {
      openness: 0.45, skepticism: 0.68, conformity: 0.52, tribalism: 0.62,
      aggression: 0.38, prestige_seeking: 0.85, fear_sensitivity: 0.50,
      emotionality: 0.35, cognitive_flexibility: 0.55, ideological_rigidity: 0.45,
      attention_span: 0.72, trust_in_institutions: 0.50, critical_thinking: 0.62,
    },
    emotions: { fear: 0.42, anger: 0.30, hope: 0.45, pride: 0.72, despair: 0.18, solidarity: 0.38 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'dissident',
    categoryId: 'political',
    icon: '⚡',
    traits: {
      openness: 0.72, skepticism: 0.88, conformity: 0.12, tribalism: 0.20,
      aggression: 0.55, prestige_seeking: 0.38, fear_sensitivity: 0.35,
      emotionality: 0.65, cognitive_flexibility: 0.78, ideological_rigidity: 0.32,
      attention_span: 0.70, trust_in_institutions: 0.04, critical_thinking: 0.85,
    },
    emotions: { fear: 0.35, anger: 0.72, hope: 0.48, pride: 0.60, despair: 0.38, solidarity: 0.65 },
    typicalAgeGroup: 'adult',
    },

  // ── 📱 إعلامي / رقمي ──────────────────────────────────────

  {
    id: 'journalist',
    categoryId: 'media',
    icon: '📰',
    traits: {
      openness: 0.80, skepticism: 0.85, conformity: 0.22, tribalism: 0.20,
      aggression: 0.38, prestige_seeking: 0.50, fear_sensitivity: 0.32,
      emotionality: 0.48, cognitive_flexibility: 0.80, ideological_rigidity: 0.18,
      attention_span: 0.80, trust_in_institutions: 0.18, critical_thinking: 0.88,
    },
    emotions: { fear: 0.25, anger: 0.48, hope: 0.48, pride: 0.45, despair: 0.28, solidarity: 0.42 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'digital_influencer',
    categoryId: 'media',
    icon: '⭐',
    traits: {
      openness: 0.68, skepticism: 0.42, conformity: 0.38, tribalism: 0.35,
      aggression: 0.35, prestige_seeking: 0.92, fear_sensitivity: 0.40,
      emotionality: 0.70, cognitive_flexibility: 0.62, ideological_rigidity: 0.28,
      attention_span: 0.50, trust_in_institutions: 0.28, critical_thinking: 0.40,
    },
    emotions: { fear: 0.28, anger: 0.38, hope: 0.60, pride: 0.72, despair: 0.18, solidarity: 0.38 },
    typicalAgeGroup: 'youth',
    },

  {
    id: 'state_media',
    categoryId: 'media',
    icon: '📡',
    traits: {
      openness: 0.35, skepticism: 0.38, conformity: 0.72, tribalism: 0.55,
      aggression: 0.28, prestige_seeking: 0.58, fear_sensitivity: 0.52,
      emotionality: 0.38, cognitive_flexibility: 0.35, ideological_rigidity: 0.60,
      attention_span: 0.70, trust_in_institutions: 0.65, critical_thinking: 0.32,
    },
    emotions: { fear: 0.38, anger: 0.28, hope: 0.45, pride: 0.52, despair: 0.20, solidarity: 0.48 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'content_creator',
    categoryId: 'media',
    icon: '🎬',
    traits: {
      openness: 0.75, skepticism: 0.48, conformity: 0.40, tribalism: 0.30,
      aggression: 0.28, prestige_seeking: 0.78, fear_sensitivity: 0.35,
      emotionality: 0.65, cognitive_flexibility: 0.70, ideological_rigidity: 0.22,
      attention_span: 0.45, trust_in_institutions: 0.25, critical_thinking: 0.48,
    },
    emotions: { fear: 0.22, anger: 0.32, hope: 0.65, pride: 0.65, despair: 0.15, solidarity: 0.50 },
    typicalAgeGroup: 'youth',
    },

  // ── 🌍 أيديولوجي / فكري ──────────────────────────────────

  {
    id: 'liberal_progressive',
    categoryId: 'ideological',
    icon: '🌿',
    traits: {
      openness: 0.88, skepticism: 0.72, conformity: 0.22, tribalism: 0.20,
      aggression: 0.22, prestige_seeking: 0.42, fear_sensitivity: 0.30,
      emotionality: 0.52, cognitive_flexibility: 0.88, ideological_rigidity: 0.20,
      attention_span: 0.70, trust_in_institutions: 0.22, critical_thinking: 0.82,
    },
    emotions: { fear: 0.22, anger: 0.45, hope: 0.62, pride: 0.42, despair: 0.28, solidarity: 0.50 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'conservative_traditional',
    categoryId: 'ideological',
    icon: '🔒',
    traits: {
      openness: 0.22, skepticism: 0.60, conformity: 0.78, tribalism: 0.82,
      aggression: 0.28, prestige_seeking: 0.55, fear_sensitivity: 0.80,
      emotionality: 0.48, cognitive_flexibility: 0.20, ideological_rigidity: 0.85,
      attention_span: 0.68, trust_in_institutions: 0.38, critical_thinking: 0.28,
    },
    emotions: { fear: 0.55, anger: 0.38, hope: 0.30, pride: 0.62, despair: 0.28, solidarity: 0.58 },
    typicalAgeGroup: 'elder',
    },

  {
    id: 'nationalist',
    categoryId: 'ideological',
    icon: '🏳️',
    traits: {
      openness: 0.28, skepticism: 0.55, conformity: 0.65, tribalism: 0.88,
      aggression: 0.55, prestige_seeking: 0.60, fear_sensitivity: 0.65,
      emotionality: 0.68, cognitive_flexibility: 0.22, ideological_rigidity: 0.80,
      attention_span: 0.58, trust_in_institutions: 0.32, critical_thinking: 0.28,
    },
    emotions: { fear: 0.50, anger: 0.62, hope: 0.38, pride: 0.80, despair: 0.28, solidarity: 0.78 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'leftist_socialist',
    categoryId: 'ideological',
    icon: '✊',
    traits: {
      openness: 0.75, skepticism: 0.78, conformity: 0.25, tribalism: 0.25,
      aggression: 0.48, prestige_seeking: 0.35, fear_sensitivity: 0.38,
      emotionality: 0.65, cognitive_flexibility: 0.70, ideological_rigidity: 0.40,
      attention_span: 0.65, trust_in_institutions: 0.08, critical_thinking: 0.80,
    },
    emotions: { fear: 0.28, anger: 0.65, hope: 0.52, pride: 0.45, despair: 0.35, solidarity: 0.82 },
    typicalAgeGroup: 'youth',
    },

  {
    id: 'atheist_skeptic',
    categoryId: 'ideological',
    icon: '🔬',
    traits: {
      openness: 0.85, skepticism: 0.90, conformity: 0.15, tribalism: 0.15,
      aggression: 0.28, prestige_seeking: 0.38, fear_sensitivity: 0.28,
      emotionality: 0.42, cognitive_flexibility: 0.90, ideological_rigidity: 0.12,
      attention_span: 0.78, trust_in_institutions: 0.20, critical_thinking: 0.95,
    },
    emotions: { fear: 0.18, anger: 0.42, hope: 0.50, pride: 0.40, despair: 0.25, solidarity: 0.35 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'centrist_pragmatist',
    categoryId: 'ideological',
    icon: '⚖️',
    traits: {
      openness: 0.60, skepticism: 0.60, conformity: 0.50, tribalism: 0.40,
      aggression: 0.25, prestige_seeking: 0.42, fear_sensitivity: 0.45,
      emotionality: 0.45, cognitive_flexibility: 0.62, ideological_rigidity: 0.30,
      attention_span: 0.62, trust_in_institutions: 0.38, critical_thinking: 0.62,
    },
    emotions: { fear: 0.32, anger: 0.28, hope: 0.45, pride: 0.40, despair: 0.25, solidarity: 0.40 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'conspiracy_theorist',
    categoryId: 'ideological',
    icon: '🕵️',
    traits: {
      openness: 0.48, skepticism: 0.92, conformity: 0.28, tribalism: 0.60,
      aggression: 0.52, prestige_seeking: 0.45, fear_sensitivity: 0.80,
      emotionality: 0.75, cognitive_flexibility: 0.20, ideological_rigidity: 0.78,
      attention_span: 0.55, trust_in_institutions: 0.02, critical_thinking: 0.30,
    },
    emotions: { fear: 0.72, anger: 0.68, hope: 0.20, pride: 0.50, despair: 0.45, solidarity: 0.55 },
    typicalAgeGroup: 'adult',
    },

  {
    id: 'radical_anarchist',
    categoryId: 'ideological',
    icon: '🔥',
    traits: {
      openness: 0.55, skepticism: 0.85, conformity: 0.05, tribalism: 0.35,
      aggression: 0.85, prestige_seeking: 0.40, fear_sensitivity: 0.30,
      emotionality: 0.80, cognitive_flexibility: 0.38, ideological_rigidity: 0.75,
      attention_span: 0.42, trust_in_institutions: 0.02, critical_thinking: 0.48,
    },
    emotions: { fear: 0.25, anger: 0.85, hope: 0.35, pride: 0.62, despair: 0.40, solidarity: 0.65 },
    typicalAgeGroup: 'youth',
    },

];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** جلب جميع الأنماط في فئة معينة */
export function getArchetypesByCategory(categoryId: string): AgentArchetype[] {
  return AGENT_ARCHETYPES.filter(a => a.categoryId === categoryId);
}

/** جلب نمط بالـ id */
export function getArchetypeById(id: string): AgentArchetype | undefined {
  return AGENT_ARCHETYPES.find(a => a.id === id);
}

/** تحويل القيم إلى Record للتوافق مع النظام القديم */
export function archetypeToTraitRecord(archetype: AgentArchetype): Record<string, number> {
  return { ...archetype.traits };
}

export function archetypeToEmotionRecord(archetype: AgentArchetype): Record<string, number> {
  return { ...archetype.emotions };
}
