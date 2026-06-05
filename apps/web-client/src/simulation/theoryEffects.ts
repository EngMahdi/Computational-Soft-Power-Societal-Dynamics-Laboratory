/**
 * theoryEffects.ts
 * ─────────────────────────────────────────────────────────────
 * Empirically calibrated effects engine for each theory and tactic.
 *
 * Each theory has:
 *   1. signalModifier  — Modifies agent-to-agent signals (network)
 *   2. metricsModifier — Modifies global environmental metrics
 *
 * Principle: intensity = 0.5 is what studies measured in natural conditions.
 * ─────────────────────────────────────────────────────────────
 *
 * المراجع الأساسية:
 *  - Christakis & Fowler (2009) — Connected
 *  - Vosoughi, Roy & Aral (2018) — Science 359(6380)
 *  - Bail et al. (2018) — Science 363(6431) [Echo Chamber]
 *  - Noelle-Neumann (1974, 1993) — Spiral of Silence
 *  - McCauley & Moskalenko (2008) — Two Pyramid Model
 *  - Henrich & Gil-White (2001) — Evolution of Prestige
 *  - Rogers (2003) — Diffusion of Innovations 5th ed.
 *  - Tajfel & Turner (1979) — Social Identity Theory
 * ─────────────────────────────────────────────────────────────
 */

import type { TheoryKey, TheoryApplication } from '../i18n/types';
import { THEORY_TACTIC_COUNT } from '../i18n/types';
import type { Signal, SocialAgent } from './socialNetwork';
import type { EmotionalState } from '../types/agent';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface TheorySignalContext {
  source: SocialAgent;
  target: SocialAgent;
  edgeType: 'family' | 'friend' | 'tribe' | 'media';
  allTheories: TheoryApplication[];
}

export interface MetricsModification {
  polarization?:          number;
  cohesion?:              number;
  echo_density?:          number;
  narrative_volatility?:  number;
  memetic_velocity?:      number;
  resistance_strength?:   number;
  algorithmic_capture?:   number;
  elite_dominance?:       number;
  identity_fragmentation?: number;
  ideological_entropy?:   number;
  belief_adoption?:       number;
}

// ─────────────────────────────────────────────────────────────
// دوال التطبيق
// ─────────────────────────────────────────────────────────────

/**
 * تُعدِّل إشارة شبكية بناءً على النظريات النشطة وحِدَّتها.
 * يُستدعى من buildSignal في socialNetwork.ts
 */
export function applyTheoriesToSignal(
  baseSignal: Signal,
  ctx: TheorySignalContext,
): Signal {
  let sig = { ...baseSignal };
  const { source, target, edgeType, allTheories } = ctx;

  for (const theory of allTheories) {
    if (!theory.enabled) continue;
    const ix = theory.intensity;       // 0–1
    const sub = theory.subtactics;    // boolean[]

    switch (theory.key) {

      // ── 1. العدوى الشبكية ───────────────────────────────────
      // Christakis & Fowler: fear β≈0.30, anger β≈0.25, hope β≈0.08
      case 'networkContagion': {
        // التكتيك 0: تضخيم الروابط القوية (Granovetter 1973)
        const strongTiesBoost = (sub[0] && (edgeType === 'family' || edgeType === 'tribe'))
          ? 1.0 + ix * 0.80  // +80% عند intensity=1 (الدراسة: ×1.8–2.2 للعائلة)
          : 1.0;

        // التكتيك 1: جسور الروابط الضعيفة — تزيد cross-group
        // Granovetter: الروابط الضعيفة تنقل المعلومات بين مجموعات
        const weakTiesBridge = (sub[1] && (edgeType === 'friend' || edgeType === 'media'))
          ? 1.0 + ix * 0.40  // +40% على الإشارات عبر المجموعات
          : 1.0;

        // التكتيك 2: تضخيم العواطف السلبية — Vosoughi 2018: anger ×3, fear ×2.5
        const emotionBoost = sub[2] ? ix : 0;

        sig.strength = clamp(sig.strength * strongTiesBoost * weakTiesBridge);

        const emo = sig.emotionalCharge as Record<string, number>;
        if (emo.fear   !== undefined) emo.fear   = clamp(emo.fear   * (1 + emotionBoost * 1.50)); // fear   ×2.5 max
        if (emo.anger  !== undefined) emo.anger  = clamp(emo.anger  * (1 + emotionBoost * 2.00)); // anger  ×3.0 max
        if (emo.hope   !== undefined) emo.hope   = clamp(emo.hope   * (1 + emotionBoost * 0.20)); // hope   ×1.2 max (بطيء)

        // beliefDelta مُعايَر: 0.03 × authority × ix
        sig.beliefDelta = clamp(
          (source.traits.openness ?? 0.5) * 0.03 * ix *
          getAuthorityFactor(source)
        , -0.5, 0.5);
        break;
      }

      // ── 2. غرفة الصدى ──────────────────────────────────────
      // Bail et al. 2018: عرض الآراء المعارضة يزيد التطرف (عكسي!)
      // تقليل cross-group بـ 40% (Facebook data)
      case 'echoChamber': {
        const isCrossGroup = source.state !== target.state; // مؤشر تقريبي للاختلاف

        // التكتيك 0: التقييم الخوارزمي — تقليل الإشارات المخالفة بـ 40%
        if (sub[0] && isCrossGroup) {
          const suppressionRate = ix * 0.40; // عند ix=1: تقليل 40% (Facebook 2021)
          if (Math.random() < suppressionRate) {
            sig.strength = 0; // تُحذف الإشارة
            break;
          }
        }

        // التكتيك 1: التفرز الاجتماعي — تضخيم الإشارات المتماثلة
        if (sub[1] && !isCrossGroup) {
          sig.strength = clamp(sig.strength * (1 + ix * 0.25)); // +25%
          // تأثير عكسي: رؤية الآراء المخالفة تُصلّب الموقف (Bail 2018)
          sig.beliefDelta = -Math.abs(sig.beliefDelta) * ix * 0.3;
        }
        break;
      }

      // ── 3. التطرف التدريجي ─────────────────────────────────
      // McCauley & Moskalenko: بطيء جداً، يحتاج شروطاً مسبقة
      // per-tick effect صغير جداً: 0.001–0.005
      case 'radicalization': {
        const hasFrustration = (source.emotional.despair ?? 0) > 0.5
                            && (source.emotional.anger   ?? 0) > 0.4;
        if (!hasFrustration) break; // الشرط الأساسي: إحباط فعلي

        // التكتيك 0: تضخيم الشكوى
        if (sub[0]) {
          const emo = sig.emotionalCharge as Record<string, number>;
          emo.anger   = (emo.anger   ?? 0) + ix * 0.008;  // تراكم بطيء
          emo.despair = (emo.despair ?? 0) + ix * 0.005;
        }
        // التكتيك 1: تأطير نحن/هم
        if (sub[1]) {
          sig.beliefDelta = ix * 0.004 * (1 - (target.traits.trust_in_institutions ?? 0.5));
        }
        break;
      }

      // ── 4. دوامة الصمت ─────────────────────────────────────
      // Noelle-Neumann: 60-70% كتم، أقوى في المجتمعات الجماعانية
      // تؤثر على التعبير الخارجي لا المعتقد الداخلي
      case 'spiralOfSilence': {
        const isMinority = source.state === 'liberal' || source.state === 'activist';
        if (!isMinority) break;

        const silenceProb = ix * 0.70; // 70% كتم عند ix=1 (العراق: جماعاني)

        // التكتيك 0: مناخ الرأي العام — يُخفق الإشارة من الأقلية
        if (sub[0] && Math.random() < silenceProb) {
          sig.strength    = sig.strength * (1 - ix * 0.60);
          sig.beliefDelta = sig.beliefDelta * (1 - ix * 0.60);
        }
        // التكتيك 1: الخوف من العزل — يرفع conformity عند الهدف
        if (sub[1]) {
          // تُضاف لـ beliefDelta كضغط نحو الرأي السائد
          sig.beliefDelta += -ix * 0.015 * (target.traits.conformity ?? 0.5);
        }
        break;
      }

      // ── 5. انتشار الميمات ───────────────────────────────────
      // Vosoughi 2018: كاذب ×6، غضب ×3، R₀ = 1.5–3.0
      case 'memetic': {
        const emo = sig.emotionalCharge as Record<string, number>;
        const sourceAngry = (source.emotional.anger ?? 0) > 0.5;

        // التكتيك 0: الغضب يضاعف الانتشار ×3
        if (sub[0] && sourceAngry) {
          sig.strength    = clamp(sig.strength    * (1 + ix * 2.0)); // ×3 max
          sig.beliefDelta = clamp(sig.beliefDelta * (1 + ix * 0.8), -0.5, 0.5);
          if (emo.anger !== undefined) emo.anger = clamp(emo.anger * (1 + ix * 2.0));
        }
        // التكتيك 1: الانتشار الفيروسي يتجاوز حدود المجموعات
        if (sub[1]) {
          sig.strength = clamp(sig.strength * (1 + ix * 0.50)); // +50% cross-group
        }
        // التكتيك 2: تعب المحتوى — عند كثرة الإشارات
        // (يُطبَّق على مستوى الوكيل في applyMetrics)
        break;
      }

      // ── 6. القوة الناعمة ────────────────────────────────────
      // Nye 2004: 0.001–0.003 per tick، الشباب أكثر استجابة
      case 'softPower': {
        const isYouth = source.ageGroup === 'youth' || source.ageGroup === 'teen';
        const targetTrusts = (target.traits.trust_in_institutions ?? 0.5) > 0.4;
        if (!targetTrusts) break; // يحتاج ثقة مسبقة بالمصدر

        // التكتيك 0: قنوات إعلامية خارجية
        if (sub[0] && edgeType === 'media') {
          const youthMultiplier = isYouth ? 1.5 : 1.0;
          sig.beliefDelta = ix * 0.002 * youthMultiplier; // صغير جداً — واقعي
          const emo = sig.emotionalCharge as Record<string, number>;
          emo.hope = (emo.hope ?? 0) + ix * 0.005 * youthMultiplier;
        }
        // التكتيك 1: التقارب الثقافي يضاعف التأثير
        if (sub[1] && (target.traits.openness ?? 0.5) > 0.6) {
          sig.beliefDelta = (sig.beliefDelta ?? 0) * (1 + ix * 0.5);
        }
        // التكتيك 2: تأثير الجاليات المهاجرة
        if (sub[2] && edgeType === 'family') {
          sig.credibility = clamp(sig.credibility * (1 + ix * 0.3));
        }
        break;
      }

      // ── 7. الهيمنة الثقافية ─────────────────────────────────
      // Gramsci: لا إشارات مباشرة، تعمل عبر التطبيع (normalization)
      // يؤثر على applyMetrics لا buildSignal مباشرة
      case 'culturalHegemony': {
        // التكتيك 0: المؤسسات الدينية/التعليمية تُطبّع الإذعان
        if (sub[0]) {
          sig.beliefDelta = (sig.beliefDelta ?? 0) * (1 - ix * 0.20); // يكبح التغيير
        }
        // التكتيك 1: الخطاب السائد يبدو "طبيعياً" — يقلل السؤال
        // (يُطبَّق في applyMetrics)
        // التكتيك 2: رواية مضادة — تقلل hegemony effect
        // (عكس التأثير عند sub[2])
        break;
      }

      // ── 8. انتشار الأفكار الجديدة ───────────────────────────
      // Rogers: S-curve، كتلة حرجة 15-25%
      case 'diffusionOfInnovations': {
        const isInnovator = (source.traits.openness ?? 0.5) > 0.75
                         && (source.traits.cognitive_flexibility ?? 0.5) > 0.65;
        if (!isInnovator) break; // فقط المبتكرون ينشرون

        // التكتيك 0: زرع المبتكرين
        if (sub[0]) {
          sig.beliefDelta = ix * 0.025 * (target.traits.openness ?? 0.5);
          sig.credibility = clamp(sig.credibility * 1.2);
        }
        // التكتيك 1: الإثبات الاجتماعي — يتسارع تلقائياً
        // يُطبَّق في applyMetrics عند تجاوز العتبة
        // التكتيك 2: التوافق مع القيم الحالية
        if (sub[2]) {
          const compat = 1 - Math.abs(
            (source.traits.ideological_rigidity ?? 0.4) -
            (target.traits.ideological_rigidity ?? 0.4)
          );
          sig.beliefDelta = (sig.beliefDelta ?? 0) * (0.5 + compat * 0.5);
        }
        break;
      }

      // ── 9. الهوية الاجتماعية ───────────────────────────────
      // Tajfel: in-group +15-25%، out-group -10-20%
      case 'socialIdentity': {
        const sameGroup = source.state === target.state;

        // التكتيك 0: تفضيل الجماعة الداخلية
        if (sub[0] && sameGroup) {
          sig.strength    = clamp(sig.strength    * (1 + ix * 0.25)); // +25%
          sig.credibility = clamp(sig.credibility * (1 + ix * 0.20));
        }
        // التكتيك 1: تحقير الخارج
        if (sub[1] && !sameGroup) {
          sig.strength    = clamp(sig.strength    * (1 - ix * 0.20)); // -20%
          sig.beliefDelta = (sig.beliefDelta ?? 0) * (1 - ix * 0.15);
        }
        // التكتيك 2: التهديد يُضاعف الاستقطاب
        if (sub[2] && (source.emotional.fear ?? 0) > 0.5) {
          const threatMultiplier = 1 + ix * 1.0; // ×2 عند التهديد العالي
          if (sameGroup)  sig.strength = clamp(sig.strength * threatMultiplier);
          if (!sameGroup) sig.strength = clamp(sig.strength / threatMultiplier);
        }
        break;
      }

      // ── 10. تصنيع الموافقة ──────────────────────────────────
      // Herman & Chomsky: النخب تُضخّم سرديتها 3-4×
      case 'manufacturingConsent': {
        const isEliteSource = (source.traits.prestige_seeking ?? 0.5) > 0.7
                           || source.state === 'positiveInfluencer';
        if (!isEliteSource) break;

        // التكتيك 0: تأطير النخبة
        if (sub[0]) {
          sig.strength    = clamp(sig.strength    * (1 + ix * 2.5)); // ×3.5 max
          sig.credibility = clamp(sig.credibility * (1 + ix * 0.5));
        }
        // التكتيك 1: تهميش البدائل
        if (sub[1]) {
          sig.beliefDelta = (sig.beliefDelta ?? 0) * (1 + ix * 1.5);
        }
        break;
      }

      // ── 11. تحديد الأجندة ───────────────────────────────────
      // McCombs & Shaw: r=0.97، يؤثر على ماذا لا كيف
      case 'agendaSetting': {
        // التكتيك 0: تكثيف التغطية — يرفع narrative_volatility
        // يُطبَّق في applyMetrics أساساً، لكن على الإشارة:
        if (sub[0]) {
          // الإشارات تحمل موضوعاً محدداً بشكل مكثف
          sig.strength = clamp(sig.strength * (1 + ix * 0.30));
        }
        // التكتيك 1: التأطير
        if (sub[1]) {
          sig.beliefDelta = (sig.beliefDelta ?? 0) * (1 + ix * 0.15);
        }
        break;
      }

      // ── 12. تأثير المكانة ───────────────────────────────────
      // Henrich & Gil-White: 2-4× أعلى من مصادر مرموقة
      case 'prestigeInfluence': {
        const sourcePrestige = source.traits.prestige_seeking ?? 0.5;
        const isHighPrestige = sourcePrestige > 0.65;
        if (!isHighPrestige) break;

        // التكتيك 0: تضخيم المرموقين
        if (sub[0]) {
          const prestigeMultiplier = 1 + ix * (2.0 * sourcePrestige); // ×2–4 max
          sig.strength    = clamp(sig.strength    * prestigeMultiplier);
          sig.beliefDelta = clamp((sig.beliefDelta ?? 0) * prestigeMultiplier, -0.5, 0.5);
        }
        // التكتيك 1: في اللاتيقن يتضاعف
        if (sub[1] && (target.traits.cognitive_flexibility ?? 0.5) < 0.4) {
          sig.strength = clamp(sig.strength * (1 + ix * 1.0)); // ×2 عند uncertainty
        }
        // التكتيك 2: نقل المصداقية
        if (sub[2]) {
          sig.credibility = clamp(sig.credibility * (1 + ix * 0.25));
        }
        break;
      }

      // ── 13. اقتصاد الانتباه ─────────────────────────────────
      // Simon 1971: إفراط معلوماتي يُنهك، -15-20% مشاركة
      case 'attentionEconomy': {
        const targetAttention = target.traits.attention_span ?? 0.5;

        // التكتيك 0: الإفراط يُنهك
        if (sub[0] && targetAttention < 0.4) {
          // وكلاء ذوو attention_span منخفض يقبلون أقل
          sig.strength = clamp(sig.strength * (1 - ix * 0.20)); // -20%
        }
        // التكتيك 1: تبسيط الرسالة — الرسائل البسيطة العاطفية تتجاوز التعب
        if (sub[1] && (source.emotional.anger ?? 0) > 0.5) {
          // الغضب يتجاوز التعب المعلوماتي
          sig.strength = clamp(sig.strength * (1 + ix * 0.30));
        }
        break;
      }

      // ── 14. التضخيم الخوارزمي ───────────────────────────────
      // FB research: ×1.5–2.5 للمحتوى العاطفي، تقليل cross-group 40-60%
      case 'algorithmicAmplification': {
        const emo = sig.emotionalCharge as Record<string, number>;
        const isEmotional = (source.emotional.anger  ?? 0) > 0.4
                         || (source.emotional.fear   ?? 0) > 0.4
                         || (source.emotional.despair ?? 0) > 0.4;
        const isYoung = source.ageGroup === 'teen' || source.ageGroup === 'youth';

        // التكتيك 0: تضخيم المحتوى العاطفي
        if (sub[0] && isEmotional) {
          const ampFactor = 1 + ix * 1.5; // ×2.5 max (FB research)
          sig.strength = clamp(sig.strength * ampFactor);
          if (emo.anger  !== undefined) emo.anger  = clamp(emo.anger  * ampFactor);
          if (emo.fear   !== undefined) emo.fear   = clamp(emo.fear   * ampFactor);
          if (emo.despair !== undefined) emo.despair = clamp(emo.despair * ampFactor);
        }
        // التكتيك 1: تعزيز الفقاعة — تقليل cross-group 50%
        if (sub[1] && source.state !== target.state) {
          const suppressRate = ix * 0.50; // 50% عند ix=1
          if (Math.random() < suppressRate) {
            sig.strength = 0;
            break;
          }
        }
        // التكتيك 2: حلقة التوصية — تراكمي للشباب
        if (sub[2] && isYoung) {
          sig.strength    = clamp(sig.strength    * (1 + ix * 0.40));
          sig.beliefDelta = clamp((sig.beliefDelta ?? 0) * (1 + ix * 0.30), -0.5, 0.5);
        }
        break;
      }
    }
  }

  return sig;
}

/**
 * Modifies global environmental metrics بناءً على النظريات النشطة.
 * يُستدعى مرة واحدة في نهاية كل tick من applyEnvironment.
 */
export function applyTheoriesToMetrics(
  theories: TheoryApplication[],
  currentMetrics: Record<string, number>,
  totalAgents: number,
  tick: number,
): Record<string, number> {
  const m = { ...currentMetrics };

  for (const theory of theories) {
    if (!theory.enabled) continue;
    const ix = theory.intensity;
    const sub = theory.subtactics;

    switch (theory.key) {

      case 'networkContagion':
        // يُسرّع memetic_velocity بحسب الحِدَّة
        m.memetic_velocity   = clamp((m.memetic_velocity   ?? 0.3) + ix * 0.002);
        m.belief_adoption    = clamp((m.belief_adoption    ?? 0.3) + ix * 0.001);
        break;

      case 'echoChamber':
        // Bail 2018: يزيد الاستقطاب (+5.8% per exposure)
        m.echo_density       = clamp((m.echo_density       ?? 0.2) + ix * 0.003);
        m.polarization       = clamp((m.polarization       ?? 0.2) + ix * 0.002);
        m.ideological_entropy = clamp((m.ideological_entropy ?? 0.3) - ix * 0.001);
        break;

      case 'radicalization':
        // بطيء جداً: يرفع الاستقطاب تدريجياً جداً
        m.polarization       = clamp((m.polarization       ?? 0.2) + ix * 0.001);
        m.narrative_volatility = clamp((m.narrative_volatility ?? 0.2) + ix * 0.001);
        m.resistance_strength = clamp((m.resistance_strength ?? 0.3) + ix * 0.0005);
        break;

      case 'spiralOfSilence':
        // يزيد الكثافة الصدوية ويُخفّض التنوع الأيديولوجي
        m.echo_density        = clamp((m.echo_density       ?? 0.2) + ix * 0.002);
        m.cohesion            = clamp((m.cohesion           ?? 0.6) + ix * 0.001); // وحدة ظاهرية
        m.identity_fragmentation = clamp((m.identity_fragmentation ?? 0.3) - ix * 0.001);
        break;

      case 'memetic':
        // يُسرّع انتشار الأفكار بشكل واضح
        m.memetic_velocity    = clamp((m.memetic_velocity   ?? 0.3) + ix * 0.004);
        m.belief_adoption     = clamp((m.belief_adoption    ?? 0.3) + ix * 0.003);
        m.narrative_volatility = clamp((m.narrative_volatility ?? 0.2) + ix * 0.002);
        break;

      case 'softPower':
        // بطيء جداً: تأثير تراكمي صغير جداً per tick
        m.belief_adoption     = clamp((m.belief_adoption    ?? 0.3) + ix * 0.001);
        m.cohesion            = clamp((m.cohesion           ?? 0.6) + ix * 0.0005);
        m.elite_dominance     = clamp((m.elite_dominance    ?? 0.2) + ix * 0.001);
        break;

      case 'culturalHegemony':
        // التطبيع يعمل دائماً لكن ببطء — يرسّخ الوضع القائم
        m.resistance_strength = clamp((m.resistance_strength ?? 0.3) - ix * 0.001); // يُضعف المقاومة
        m.echo_density        = clamp((m.echo_density        ?? 0.2) + ix * 0.001);
        m.ideological_entropy = clamp((m.ideological_entropy ?? 0.3) - ix * 0.002); // يُقلّل التنوع
        if (sub[2]) {
          // رواية مضادة تُعكس بعض التأثير
          m.ideological_entropy = clamp((m.ideological_entropy ?? 0.3) + ix * 0.003);
          m.resistance_strength = clamp((m.resistance_strength ?? 0.3) + ix * 0.002);
        }
        break;

      case 'diffusionOfInnovations': {
        // S-curve: بطيء ثم يتسارع عند الكتلة الحرجة (15-25%)
        const adoptionRate = m.belief_adoption ?? 0.3;
        const criticalMass = adoptionRate > 0.20; // Rogers: 15-25%
        const accelerator  = criticalMass ? 2.5 : 1.0;
        m.memetic_velocity  = clamp((m.memetic_velocity  ?? 0.3) + ix * 0.002 * accelerator);
        m.belief_adoption   = clamp((m.belief_adoption   ?? 0.3) + ix * 0.002 * accelerator);
        m.cohesion          = clamp((m.cohesion          ?? 0.6) + ix * 0.001);
        break;
      }

      case 'socialIdentity':
        // يزيد الاستقطاب والتجانس الداخلي بشكل ملحوظ
        m.polarization        = clamp((m.polarization       ?? 0.2) + ix * 0.003);
        m.cohesion            = clamp((m.cohesion           ?? 0.6) + ix * 0.002); // داخل المجموعة فقط
        m.identity_fragmentation = clamp((m.identity_fragmentation ?? 0.3) + ix * 0.002);
        // التهديد يُضاعف كل شيء
        if (sub[2]) {
          m.polarization      = clamp((m.polarization       ?? 0.2) + ix * 0.003);
        }
        break;

      case 'manufacturingConsent':
        // النخبة تُسيطر على الأجندة
        m.elite_dominance     = clamp((m.elite_dominance    ?? 0.2) + ix * 0.003);
        m.narrative_volatility = clamp((m.narrative_volatility ?? 0.2) + ix * 0.002);
        m.algorithmic_capture = clamp((m.algorithmic_capture ?? 0.1) + ix * 0.001);
        if (sub[1]) {
          m.echo_density      = clamp((m.echo_density       ?? 0.2) + ix * 0.002);
        }
        break;

      case 'agendaSetting':
        // ما يُغطيه الإعلام يصبح هاجساً
        m.narrative_volatility = clamp((m.narrative_volatility ?? 0.2) + ix * 0.003);
        m.belief_adoption     = clamp((m.belief_adoption    ?? 0.3) + ix * 0.002);
        m.memetic_velocity    = clamp((m.memetic_velocity   ?? 0.3) + ix * 0.002);
        break;

      case 'prestigeInfluence':
        // المرموقون يُعلّون نسبة التبني ويرفعون التجانس
        m.elite_dominance     = clamp((m.elite_dominance    ?? 0.2) + ix * 0.002);
        m.belief_adoption     = clamp((m.belief_adoption    ?? 0.3) + ix * 0.003);
        m.cohesion            = clamp((m.cohesion           ?? 0.6) + ix * 0.002);
        break;

      case 'attentionEconomy':
        // الإفراط المعلوماتي يرفع algorithmic_capture ويُخفّض المشاركة
        m.algorithmic_capture = clamp((m.algorithmic_capture ?? 0.1) + ix * 0.003);
        m.narrative_volatility = clamp((m.narrative_volatility ?? 0.2) + ix * 0.002);
        m.belief_adoption     = clamp((m.belief_adoption    ?? 0.3) - ix * 0.001); // إجهاد = أقل تبني
        break;

      case 'algorithmicAmplification':
        // الخوارزميات تُضخّم وتُصفّي — تقليل التنوع الأيديولوجي
        m.algorithmic_capture = clamp((m.algorithmic_capture ?? 0.1) + ix * 0.004);
        m.echo_density        = clamp((m.echo_density        ?? 0.2) + ix * 0.003);
        m.memetic_velocity    = clamp((m.memetic_velocity    ?? 0.3) + ix * 0.003);
        m.polarization        = clamp((m.polarization        ?? 0.2) + ix * 0.002);
        break;
    }
  }

  return m;
}

// ─────────────────────────────────────────────────────────────
// دوال مساعدة
// ─────────────────────────────────────────────────────────────

function getAuthorityFactor(agent: SocialAgent): number {
  const ageMap: Record<string, number> = { teen: 0.60, youth: 0.95, adult: 1.10, elder: 1.25 };
  const stateBoost = agent.state === 'positiveInfluencer' ? 1.4
    : agent.state === 'negativeInfluencer' ? 1.3
    : agent.state === 'activist' ? 1.2 : 1.0;
  return clamp((agent.traits.prestige_seeking ?? 0.5) * 0.3
    + (ageMap[agent.ageGroup] ?? 1.0) * 0.4
    + stateBoost * 0.3 - 0.2);
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, isNaN(v) ? min : v));
}

/**
 * بناء قائمة TheoryApplication من القيم الافتراضية.
 * تُستخدم في App.tsx لتهيئة الحالة.
 */
export function buildDefaultTheoryApplications(
  THEORY_KEY_ORDER: TheoryKey[],
  THEORY_DEFAULT_INTENSITY: Record<TheoryKey, number>,
  THEORY_TACTIC_COUNT: Record<TheoryKey, number>,
  enabledKeys: Set<TheoryKey> = new Set(['networkContagion']),
): import('../i18n/types').TheoryApplication[] {
  return THEORY_KEY_ORDER.map(key => ({
    key,
    enabled: enabledKeys.has(key),
    intensity: THEORY_DEFAULT_INTENSITY[key] ?? 0.50,
    subtactics: Array.from({ length: THEORY_TACTIC_COUNT[key] ?? 0 }, () => true),
  }));
}
