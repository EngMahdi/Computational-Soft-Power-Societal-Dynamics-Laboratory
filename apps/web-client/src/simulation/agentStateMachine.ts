/**
 * agentStateMachine.ts
 * ─────────────────────────────────────────────────────────────
 * يحدد حالة كل وكيل بناءً على سماته النفسية وحالته العاطفية.
 * هذا هو الإصلاح الجوهري لمشكلة "الجميع يعود moderate كل tick".
 *
 * Principle: الحالة تنبع من الداخل (traits) لا من العتبة العالمية.
 * ─────────────────────────────────────────────────────────────
 */

import type { EmotionalState } from '../types/agent';
import type { AgentStateKey } from '../i18n/types';
import type { AgeGroup } from '../types/age';

export interface TraitVector {
  openness:               number; // 0–1
  skepticism:             number;
  conformity:             number;
  tribalism:              number;
  aggression:             number;
  prestige_seeking:       number;
  fear_sensitivity:       number;
  emotionality:           number;
  cognitive_flexibility:  number;
  ideological_rigidity:   number;
  attention_span:         number;
  trust_in_institutions:  number;
}

export interface GlobalContext {
  polarization:          number;
  cohesion:              number;
  echo_density:          number;
  narrative_volatility:  number;
  memetic_velocity:      number;
  resistance_strength:   number;
  algorithmic_capture:   number;
  elite_dominance:       number;
}

/**
 * الدالة الرئيسية: تشتق حالة الوكيل من سماته
 *
 * خوارزمية:
 * 1. احسب نقاط لكل حالة مرشحة
 * 2. أضف عاملاً من الحالة العاطفية
 * 3. أضف عاملاً من السياق العالمي
 * 4. الحالة الفائزة هي التي لها أعلى نقاط
 * 5. إذا لم تتجاوز أي حالة العتبة → moderate
 */
export function deriveAgentState(
  traits: Record<string, number>,
  emotional: EmotionalState,
  global: GlobalContext,
  currentState: AgentStateKey,
  ageGroup: AgeGroup
): AgentStateKey {
  const t = {
    openness:              clamp(traits.openness              ?? 0.5),
    skepticism:            clamp(traits.skepticism            ?? 0.5),
    conformity:            clamp(traits.conformity            ?? 0.5),
    tribalism:             clamp(traits.tribalism             ?? 0.5),
    aggression:            clamp(traits.aggression            ?? 0.3),
    prestige_seeking:      clamp(traits.prestige_seeking      ?? 0.5),
    fear_sensitivity:      clamp(traits.fear_sensitivity      ?? 0.5),
    emotionality:          clamp(traits.emotionality          ?? 0.5),
    cognitive_flexibility: clamp(traits.cognitive_flexibility ?? 0.5),
    ideological_rigidity:  clamp(traits.ideological_rigidity  ?? 0.4),
    attention_span:        clamp(traits.attention_span        ?? 0.5),
    trust_in_institutions: clamp(traits.trust_in_institutions ?? 0.6),
  };

  const e = emotional;
  const g = global;

  // ── الإصلاح: عتبة منخفضة + inertia معقول + أوزان مُعايَرة ──
  // INERTIA يمنع التذبذب لكن يسمح بالتغيير
  const INERTIA = 0.08;

  // baseline لـ moderate (يجب أن يُنافَس)
  const scores: Record<AgentStateKey, number> = {
    moderate:           0.15,
    extremist:          0,
    conservative:       0,
    liberal:            0,
    positiveInfluencer: 0,
    negativeInfluencer: 0,
    resistant:          0,
    gullible:           0,
    activist:           0,
    isolated:           0,
  };

  // ── Extremist ─────────────────────────────────────────────────────────────
  // الوكيل عدائي + قبلي + خائف في بيئة مستقطبة
  // aggression وحدها تكفي — لا يحتاج بيئة مستقطبة عالية
  scores.extremist =
    t.aggression * 0.45 +
    e.anger      * 0.30 +
    t.tribalism  * 0.15 +
    e.fear       * 0.05 +
    g.polarization * 0.05 -
    t.openness   * 0.20 -
    t.trust_in_institutions * 0.05;

  // ── Conservative ──────────────────────────────────────────────────────────
  // صارم أيديولوجياً + متبع للتقاليد + خائف من التغيير
  // ملاحظة: في السياق العراقي، tribalism عالية لدى الجميع تقريباً
  // لذا نخفف وزنها قليلاً لمنع التحيز الكبير نحو conservative
  scores.conservative =
    t.ideological_rigidity * 0.40 +
    t.conformity           * 0.30 +
    e.fear                 * 0.10 +
    t.tribalism            * 0.10 +
    (1 - t.openness)       * 0.10;

  // ── Liberal ───────────────────────────────────────────────────────────────
  // منفتح + مرن + متفائل
  scores.liberal =
    t.openness               * 0.40 +
    t.cognitive_flexibility  * 0.25 +
    e.hope                   * 0.20 +
    (1 - t.ideological_rigidity) * 0.10 +
    (1 - t.tribalism)        * 0.05;

  // ── Positive Influencer ───────────────────────────────────────────────────
  // طموح اجتماعياً + يثق + متضامن + متفائل
  scores.positiveInfluencer =
    t.prestige_seeking       * 0.30 +
    t.trust_in_institutions  * 0.25 +
    e.solidarity             * 0.25 +
    e.hope                   * 0.15 +
    t.openness               * 0.10 -
    t.aggression             * 0.15;

  // ── Negative Influencer ───────────────────────────────────────────────────
  // عدائي + انعدام ثقة + عاطفي + في بيئة متقلبة
  scores.negativeInfluencer =
    t.aggression               * 0.35 +
    (1 - t.trust_in_institutions) * 0.25 +
    e.anger                    * 0.25 +
    t.emotionality             * 0.10 +
    g.narrative_volatility     * 0.10 -
    e.solidarity               * 0.15;

  // ── Resistant ─────────────────────────────────────────────────────────────
  // شكّاك + صلب أيديولوجياً + متضامن مع مجموعته
  // في السياق العراقي: skepticism عالية → مناعة من التأثير الخارجي
  scores.resistant =
    t.skepticism             * 0.40 +
    e.solidarity             * 0.20 +
    e.pride                  * 0.20 +
    t.ideological_rigidity   * 0.10 +
    (1 - t.openness)         * 0.10 -
    t.conformity             * 0.05;

  // ── Gullible ──────────────────────────────────────────────────────────────
  // سهل التأثر + مُتبِع + ضعيف الشك + عاطفي
  scores.gullible =
    (1 - t.skepticism)         * 0.35 +
    t.conformity               * 0.30 +
    t.emotionality             * 0.15 +
    g.algorithmic_capture      * 0.15 +
    (1 - t.cognitive_flexibility) * 0.10;

  // ── Activist ──────────────────────────────────────────────────────────────
  // غاضب + متضامن + منفتح لكن موجَّه
  scores.activist =
    e.anger              * 0.30 +
    e.solidarity         * 0.30 +
    t.aggression         * 0.15 +
    t.openness           * 0.15 +
    g.memetic_velocity   * 0.15 -
    t.ideological_rigidity * 0.15;

  // ── Isolated ──────────────────────────────────────────────────────────────
  // يائس + لا يثق + منسحب + في فقاعة معلوماتية
  // ملاحظة: trust_in_institutions منخفضة في العراق عموماً لذا نخفف وزنها هنا
  // لأن "انعدام الثقة" وحده لا يجعل الفرد منعزلاً — يحتاج يأساً فعلياً
  scores.isolated =
    e.despair                     * 0.40 +
    e.fear                        * 0.25 +
    (1 - t.attention_span)        * 0.20 +
    g.echo_density                * 0.10 +
    (1 - t.trust_in_institutions) * 0.05;  // خُفِّض من 0.25 → 0.05

  // ── تعديل العمر ───────────────────────────────────────────────────────────
  if (ageGroup === 'teen') {
    scores.gullible     *= 1.40;  // المراهقون أكثر قابلية للتأثر
    scores.liberal      *= 1.25;
    scores.activist     *= 1.20;
    scores.isolated     *= 1.15;
    scores.conservative *= 0.60;
    scores.resistant    *= 0.70;
  } else if (ageGroup === 'youth') {
    scores.activist     *= 1.15;
    scores.liberal      *= 1.10;
    scores.gullible     *= 1.10;
  } else if (ageGroup === 'adult') {
    scores.conservative *= 1.15;
    scores.resistant    *= 1.10;
    scores.negativeInfluencer *= 1.10;
  } else if (ageGroup === 'elder') {
    scores.conservative *= 1.40;
    scores.resistant    *= 1.30;
    scores.isolated     *= 1.20;
    scores.gullible     *= 0.50;
    scores.liberal      *= 0.70;
    scores.activist     *= 0.60;
  }

  // ── تعزيز الحالة الحالية (inertia) ───────────────────────────────────────
  if (currentState !== 'moderate' && currentState in scores) {
    scores[currentState] += INERTIA;
  }

  // ── العتبة الدنيا للخروج من moderate ────────────────────────────────────
  // 0.18 = تقريباً نقطة توازن الوكيل المتوسط السمات
  // الوكلاء ذوو السمات القوية يتجاوزونها بسهولة
  const THRESHOLD = 0.18;

  let bestState: AgentStateKey = 'moderate';
  let bestScore = THRESHOLD;

  for (const [state, score] of Object.entries(scores)) {
    if (state === 'moderate') continue;
    if (score > bestScore) {
      bestScore = score;
      bestState = state as AgentStateKey;
    }
  }

  return bestState;
}

/** حساب احتمال الانتقال للحالة الجديدة (0-1) */
export function transitionProbability(
  traits: Record<string, number>,
  emotional: EmotionalState,
  _global: GlobalContext,
  targetState: AgentStateKey
): number {
  const susceptibilityFactor = 1 - clamp(traits.ideological_rigidity ?? 0.4);
  const emotionalBoost = (emotional.fear + emotional.anger) * 0.1;
  return clamp(susceptibilityFactor * 0.05 + emotionalBoost);
}

/** تحويل عدد الوكلاء من AgentStateKey[] إلى Record */
export function countByState(
  states: AgentStateKey[]
): Record<AgentStateKey, number> {
  const counts: Record<string, number> = {};
  for (const s of states) {
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return counts as Record<AgentStateKey, number>;
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, isNaN(v) ? 0.5 : v));
}
