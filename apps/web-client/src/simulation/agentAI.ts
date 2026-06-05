/**
 * agentAI.ts
 * ─────────────────────────────────────────────────────────────
 * طبقة الذكاء الاصطناعي الانتقائية للمحاكاة.
 *
 * المبادئ:
 *  - لا تستبدل المحرك الأساسي.
 *  - لا تُسوّي الوكلاء — كل وكيل فرد له ملف ذكاء منفصل.
 *  - لا تستدعي AI لكل وكيل في كل Tick.
 *  - تعمل الذاكرة بشكل مضغوط لتجنب إبطاء المحاكاة.
 * ─────────────────────────────────────────────────────────────
 */

import type { AgentStateKey } from '../i18n/types';
import type { EmotionalState } from '../types/agent';

// ─────────────────────────────────────────────────────────────
// أنواع الملفات الذكية للوكلاء
// ─────────────────────────────────────────────────────────────

export type IntelligenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'expert';

export type SocialRole =
  | 'reformer'       // مُصلح: يدفع نحو التغيير الإيجابي
  | 'disruptor'      // مُقاطع: يزعزع الاستقرار
  | 'stabilizer'     // مُثبِّت: يحافظ على الوضع القائم
  | 'manipulator'    // مُتلاعب: يستغل الآخرين
  | 'bridge_builder' // بانٍ للجسور: يُقرّب وجهات النظر
  | 'opinion_leader' // قائد رأي: يؤثر على الكثيرين
  | 'follower'       // تابع: يقتدي بالأغلبية
  | 'gatekeeper';    // حارس المعلومات: يتحكم بالتدفق

/** وحدة ذاكرة مضغوطة لحدث واحد */
export interface MemoryEntry {
  tick:       number;
  event:      string;        // وصف مضغوط: "received angry signal from neighbor"
  stateBefore: AgentStateKey;
  stateAfter:  AgentStateKey;
  emotionDelta: Partial<EmotionalState>;
  learned:    boolean;       // هل تحول هذا الحدث إلى معتقد دائم؟
}

/** الذاكرة الغنية للوكيل (تستبدل AgentMemory البسيطة) */
export interface EnrichedMemory {
  shortTerm:        MemoryEntry[];   // آخر 5 أحداث
  episodeMemory:    MemoryEntry[];   // أهم 10 أحداث موسعة
  longTermBeliefs:  string[];        // معتقدات مُستقرة (نصية مضغوطة)
  stateHistory:     AgentStateKey[]; // تاريخ الحالة (آخر 20 tick)
  exposureCount:    Record<string, number>; // عدد مرات التعرض لكل نوع
  unresolvedTensions: string[];      // توترات لم تُحل بعد
  influenceTraces:  { fromId: number; strength: number; tick: number }[]; // آثار التأثير
}

export function defaultEnrichedMemory(): EnrichedMemory {
  return {
    shortTerm: [],
    episodeMemory: [],
    longTermBeliefs: [],
    stateHistory: ['moderate'],
    exposureCount: {},
    unresolvedTensions: [],
    influenceTraces: [],
  };
}

/** ملف الوكيل الكامل */
export interface AgentAIProfile {
  intelligenceLevel: IntelligenceLevel;
  socialRole:        SocialRole;
  memory:            EnrichedMemory;
  aiCallCooldown:    number; // Ticks remaining before this agent can trigger AI again
  lastAnomalyTick:   number;
  cognitiveDepth:    number; // 0.0–1.0 — مرتبط بـ intelligenceLevel
  influenceStrength: number; // 0.0–1.0 — مرتبط بـ socialRole
  susceptibility:    number; // 0.0–1.0 — عكس مقاومة التأثير
}

// ─────────────────────────────────────────────────────────────
// منشئ ملف AI للوكيل (عشوائي لكن منطقي)
// ─────────────────────────────────────────────────────────────

const ROLE_WEIGHTS: Record<SocialRole, number> = {
  follower: 40, stabilizer: 18, opinion_leader: 12, gatekeeper: 10,
  reformer: 7, disruptor: 6, bridge_builder: 4, manipulator: 3,
};

const INTELLIGENCE_WEIGHTS: Record<IntelligenceLevel, number> = {
  very_low: 15, low: 30, medium: 35, high: 15, expert: 5,
};

function weightedRandom<T extends string>(weights: Record<T, number>, rng: () => number): T {
  const vals = Object.values(weights) as number[];
  const total = vals.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (const [key, w] of Object.entries(weights) as [T, number][]) {
    r -= w;
    if (r <= 0) return key;
  }
  return Object.keys(weights)[0] as T;
}

const INTEL_DEPTH: Record<IntelligenceLevel, number> = {
  very_low: 0.1, low: 0.3, medium: 0.55, high: 0.78, expert: 0.95,
};

const ROLE_INFLUENCE: Record<SocialRole, number> = {
  opinion_leader: 0.85, manipulator: 0.75, reformer: 0.65, disruptor: 0.60,
  bridge_builder: 0.55, gatekeeper: 0.50, stabilizer: 0.40, follower: 0.20,
};

const ROLE_SUSCEPTIBILITY: Record<SocialRole, number> = {
  follower: 0.85, gatekeeper: 0.45, stabilizer: 0.50, bridge_builder: 0.55,
  reformer: 0.40, disruptor: 0.35, manipulator: 0.25, opinion_leader: 0.30,
};

export function createAgentAIProfile(rng: () => number): AgentAIProfile {
  const intelligenceLevel = weightedRandom(INTELLIGENCE_WEIGHTS, rng);
  const socialRole = weightedRandom(ROLE_WEIGHTS, rng);
  return {
    intelligenceLevel,
    socialRole,
    memory: defaultEnrichedMemory(),
    aiCallCooldown: 0,
    lastAnomalyTick: -999,
    cognitiveDepth: INTEL_DEPTH[intelligenceLevel] + (rng() - 0.5) * 0.1,
    influenceStrength: ROLE_INFLUENCE[socialRole] + (rng() - 0.5) * 0.1,
    susceptibility: ROLE_SUSCEPTIBILITY[socialRole] + (rng() - 0.5) * 0.1,
  };
}

// ─────────────────────────────────────────────────────────────
// أنواع التشوهات
// ─────────────────────────────────────────────────────────────

export type AnomalyType =
  | 'natural_emergence'    // ظهور طبيعي للخصائص الكامنة
  | 'suspicious_artifact'  // قيمة مشبوهة غير واقعية
  | 'numerical_drift'      // انجراف رياضي تراكمي
  | 'memory_inconsistency' // تناقض في ذاكرة الوكيل
  | 'identity_rupture'     // تغير مفاجئ في الحالة بدون سبب
  | 'correction_needed';   // يحتاج تصحيح فعلي

export interface Anomaly {
  agentIndex: number;
  type:       AnomalyType;
  severity:   number;    // 0.0–1.0
  description: string;
  requiresOnlineAI: boolean; // هل يتجاوز قدرة النموذج المحلي؟
  tick:       number;
}

// ─────────────────────────────────────────────────────────────
// كاشف التشوهات — يعمل بالكامل محلياً بدون AI
// ─────────────────────────────────────────────────────────────

interface AgentSnapshot {
  index: number;
  state: AgentStateKey;
  emotionalState: EmotionalState;
  aiProfile?: AgentAIProfile;
  traits: Record<string, number>;
}

export function detectAnomalies(
  agents: AgentSnapshot[],
  globalMetrics: Record<string, number>,
  tick: number,
  sampleRate: number = 0.05, // نفحص 5% فقط لكل Tick
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const total = agents.length;

  for (let i = 0; i < total; i++) {
    // عيّنة عشوائية
    if (Math.random() > sampleRate) continue;

    const agent = agents[i];
    if (!agent) continue;

    const mem = agent.aiProfile?.memory;
    const history = mem?.stateHistory ?? [];

    // ── 1. كشف الانكسار الهوياتي (Identity Rupture) ──
    // الوكيل تغير 3+ مرات في آخر 5 Ticks بدون أحداث
    if (history.length >= 5) {
      const last5 = history.slice(-5);
      const changes = last5.filter((s, i) => i > 0 && s !== last5[i - 1]).length;
      if (changes >= 3) {
        anomalies.push({
          agentIndex: i, tick,
          type: 'identity_rupture',
          severity: changes / 5,
          description: `تغيرات حالة متسارعة: ${changes} في 5 دورات`,
          requiresOnlineAI: changes >= 4,
        });
      }
    }

    // ── 2. كشف التطرف المزيف (Suspicious Artifact) ──
    // وكيل في حالة extremist لكن traits لا تدعمها
    if (agent.state === 'extremist') {
      const ideological = agent.traits.ideological_rigidity ?? 0.5;
      const anger = agent.emotionalState.anger;
      const conformity = agent.traits.conformity ?? 0.5;
      const plausibility = ideological * 0.5 + anger * 0.3 + conformity * 0.2;
      if (plausibility < 0.25) {
        anomalies.push({
          agentIndex: i, tick,
          type: 'suspicious_artifact',
          severity: 0.25 - plausibility,
          description: `تطرف غير مدعوم: plausibility=${plausibility.toFixed(2)}`,
          requiresOnlineAI: plausibility < 0.10,
        });
      }
    }

    // ── 3. الانجراف الرياضي (Numerical Drift) ──
    // قيمة عاطفية ثابتة عند حدها الأقصى 1.0 لأكثر من 10 ticks
    const emotions = agent.emotionalState;
    for (const [k, v] of Object.entries(emotions)) {
      if (v >= 0.98) {
        anomalies.push({
          agentIndex: i, tick,
          type: 'numerical_drift',
          severity: 0.6,
          description: `عاطفة ${k} مُجمَّدة عند 1.0 — احتمال drift رياضي`,
          requiresOnlineAI: false,
        });
        break;
      }
    }

    // ── 4. تناقض الذاكرة (Memory Inconsistency) ──
    // الوكيل يصنف positive influencer لكن آثار تأثيره سلبية
    if (agent.state === 'positiveInfluencer' && mem) {
      const negativePressure = mem.unresolvedTensions.length;
      if (negativePressure > 3) {
        anomalies.push({
          agentIndex: i, tick,
          type: 'memory_inconsistency',
          severity: Math.min(1, negativePressure / 6),
          description: `positive influencer مع ${negativePressure} توترات معلقة`,
          requiresOnlineAI: negativePressure > 5,
        });
      }
    }
  }

  // ── 5. البروز الطارئ (Natural Emergence) — على مستوى النظام ──
  const extremistPct = (globalMetrics.polarization ?? 0);
  if (extremistPct > 0.75 && tick > 20) {
    anomalies.push({
      agentIndex: -1, tick, // -1 = مستوى النظام
      type: 'natural_emergence',
      severity: extremistPct - 0.75,
      description: `استقطاب حرج: ${(extremistPct * 100).toFixed(1)}% — قد يكون ظهوراً طبيعياً`,
      requiresOnlineAI: extremistPct > 0.88,
    });
  }

  return anomalies;
}

// ─────────────────────────────────────────────────────────────
// التصحيح المحلي الذكي (بدون API)
// ─────────────────────────────────────────────────────────────

export interface LocalAICorrection {
  agentIndex: number;
  emotionAdjustment?: Partial<EmotionalState>;
  traitNudge?: Partial<Record<string, number>>;
  memoryNote: string;
}

/**
 * يُطبق تصحيحات منطقية بسيطة محلياً للتشوهات الخفيفة.
 * لا يُدمّر السلوك الطارئ — يُعالج فقط الأخطاء الرياضية.
 */
export function applyLocalAIReasoning(
  anomaly: Anomaly,
  agent: AgentSnapshot,
): LocalAICorrection | null {
  if (anomaly.requiresOnlineAI) return null; // انتظر API
  if (anomaly.severity < 0.1) return null;   // تافه — تجاهله

  switch (anomaly.type) {
    case 'numerical_drift': {
      // إعادة الضبط التدريجي للعواطف المتجمدة
      const adj: Partial<EmotionalState> = {};
      const emo = agent.emotionalState;
      if (emo.anger >= 0.98)   adj.anger   = 0.85;
      if (emo.fear  >= 0.98)   adj.fear    = 0.80;
      if (emo.despair >= 0.98) adj.despair = 0.82;
      return {
        agentIndex: anomaly.agentIndex,
        emotionAdjustment: adj,
        memoryNote: `تصحيح drift رياضي @ tick ${anomaly.tick}`,
      };
    }

    case 'suspicious_artifact': {
      // تخفيف خفيف للتطرف غير المدعوم
      return {
        agentIndex: anomaly.agentIndex,
        emotionAdjustment: { anger: Math.max(0, (agent.emotionalState.anger ?? 0) - 0.12) },
        memoryNote: `تصحيح تطرف مزيف @ tick ${anomaly.tick}`,
      };
    }

    case 'identity_rupture': {
      // تثبيت العواطف للحد من التذبذب
      const hope = Math.min(1, (agent.emotionalState.hope ?? 0) + 0.08);
      return {
        agentIndex: anomaly.agentIndex,
        emotionAdjustment: { hope },
        memoryNote: `تثبيت هوية بعد انكسار @ tick ${anomaly.tick}`,
      };
    }

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
// تحديث الذاكرة المضغوطة
// ─────────────────────────────────────────────────────────────

export function updateAgentMemory(
  memory: EnrichedMemory,
  event: Omit<MemoryEntry, 'learned'>,
  maxShortTerm: number = 5,
  maxEpisode: number = 10,
): EnrichedMemory {
  const entry: MemoryEntry = {
    ...event,
    learned: event.stateBefore !== event.stateAfter, // تحول الحالة = تعلّم
  };

  const newShort = [entry, ...memory.shortTerm].slice(0, maxShortTerm);
  const stateHistory = [...memory.stateHistory, event.stateAfter].slice(-20);

  // الأحداث المهمة (تغيير الحالة) تنتقل للذاكرة التفصيلية
  const newEpisode = entry.learned
    ? [entry, ...memory.episodeMemory].slice(0, maxEpisode)
    : memory.episodeMemory;

  // معتقد دائم إذا ظهر نفس الحدث 3+ مرات
  const count = (memory.exposureCount[event.event] ?? 0) + 1;
  const newBeliefs = [...memory.longTermBeliefs];
  if (count === 3 && !newBeliefs.includes(event.event)) {
    newBeliefs.push(event.event);
    if (newBeliefs.length > 8) newBeliefs.shift(); // احتفظ بآخر 8
  }

  return {
    ...memory,
    shortTerm: newShort,
    episodeMemory: newEpisode,
    longTermBeliefs: newBeliefs,
    stateHistory,
    exposureCount: { ...memory.exposureCount, [event.event]: count },
  };
}

// ─────────────────────────────────────────────────────────────
// قرار الاستدعاء
// ─────────────────────────────────────────────────────────────

export function shouldCallAI(
  profile: AgentAIProfile,
  anomaly: Anomaly | null,
  tick: number,
): boolean {
  if (profile.aiCallCooldown > 0) return false;
  if (!anomaly) return false;
  if (anomaly.severity < 0.2) return false;
  if (tick - profile.lastAnomalyTick < 10) return false; // هدوء 10 ticks بين كل استدعاء
  // الوكلاء ذوو الذكاء العالي فقط يستحقون AI calls متكررة
  if (profile.intelligenceLevel === 'very_low' && anomaly.severity < 0.6) return false;
  return true;
}
