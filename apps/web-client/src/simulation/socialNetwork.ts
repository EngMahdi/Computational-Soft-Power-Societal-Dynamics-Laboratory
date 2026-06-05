/**
 * socialNetwork.ts
 * ─────────────────────────────────────────────────────────────
 * الشبكة الاجتماعية الحقيقية — Network Message Passing
 *
 * يُحوّل النظام من:
 *   tick → global metrics → agent migration (spreadsheet)
 * إلى:
 *   tick → agent-to-agent signals → aggregate metrics (ABM)
 *
 * كل وكيل يؤثر في جيرانه مباشرة بناءً على سماته وحالته العاطفية.
 * ─────────────────────────────────────────────────────────────
 */

import { rand, randInt } from './seedRNG';
import type { EmotionalState } from '../types/agent';
import type { AgeGroup } from '../types/age';
import type { TheoryApplication } from '../i18n/types';
import { applyTheoriesToSignal, type TheorySignalContext } from './theoryEffects';

/** إشارة تُرسل من وكيل إلى جاره */
export interface Signal {
  sourceId:       number;
  targetId:       number;
  beliefDelta:    number; // تأثير على openness/ideological_rigidity
  emotionalCharge: Partial<EmotionalState>;
  strength:       number; // 0–1
  credibility:    number; // 0–1
  theoryTag?:     string; // أي نظرية أطلقت هذه الإشارة
}

/** رابط شبكي بين وكيلين */
export interface NetworkEdge {
  targetId:       number;
  weight:         number; // قوة العلاقة 0–1
  type:           'family' | 'friend' | 'tribe' | 'media';
}

/** بنية الوكيل الاجتماعي (مبسطة) */
export interface SocialAgent {
  id:          number;
  state:       string;
  traits:      Record<string, number>;
  emotional:   EmotionalState;
  ageGroup:    AgeGroup;
  connections: NetworkEdge[];
}

// ─────────────────────────────────────────────────────────────
// بناء الشبكة الاجتماعية
// ─────────────────────────────────────────────────────────────

/**
 * ينشئ شبكة اجتماعية واقعية:
 * - مجموعات عائلية (3-6 أفراد، روابط قوية)
 * - صداقات (متوسطة القوة)
 * - روابط قبلية/دينية (للكبار)
 * - يتبع Small-World topology
 */
export function buildSocialNetwork(agentCount: number): NetworkEdge[][] {
  const connections: NetworkEdge[][] = Array.from({ length: agentCount }, () => []);

  // ── العائلة (روابط قوية) ──
  const familyGroupSize = () => randInt(3, 6);
  let idx = 0;
  while (idx < agentCount) {
    const size = Math.min(familyGroupSize(), agentCount - idx);
    const members = Array.from({ length: size }, (_, i) => idx + i);
    for (const a of members) {
      for (const b of members) {
        if (a !== b) {
          connections[a].push({ targetId: b, weight: 0.7 + rand() * 0.3, type: 'family' });
        }
      }
    }
    idx += size;
  }

  // ── الصداقات (Watts-Strogatz inspired) ──
  const friendCount = Math.floor(agentCount * 0.5); // 50% منهم لديهم أصدقاء
  for (let i = 0; i < friendCount; i++) {
    const a = randInt(0, agentCount - 1);
    const b = randInt(0, agentCount - 1);
    if (a !== b && !connections[a].find(e => e.targetId === b)) {
      const weight = 0.3 + rand() * 0.4;
      connections[a].push({ targetId: b, weight, type: 'friend' });
      connections[b].push({ targetId: a, weight, type: 'friend' });
    }
  }

  // ── الروابط القبلية (Preferential Attachment للكبار) ──
  const tribeHubs = Array.from({ length: Math.floor(agentCount / 20) }, () => randInt(0, agentCount - 1));
  for (const hub of tribeHubs) {
    const memberCount = randInt(5, 15);
    for (let i = 0; i < memberCount; i++) {
      const member = randInt(0, agentCount - 1);
      if (member !== hub && !connections[hub].find(e => e.targetId === member)) {
        connections[hub].push({ targetId: member, weight: 0.4 + rand() * 0.3, type: 'tribe' });
        connections[member].push({ targetId: hub, weight: 0.4 + rand() * 0.3, type: 'tribe' });
      }
    }
  }

  return connections;
}

// ─────────────────────────────────────────────────────────────
// توليد الإشارات وانتشارها
// ─────────────────────────────────────────────────────────────

/**
 * توليد الإشارات التي يرسلها الوكيل لجيرانه.
 * يستخدم TheoryApplication[] بدلاً من Set<string> لاستيعاب الـ intensity.
 */
export function generateSignals(
  agent: SocialAgent,
  allAgents: SocialAgent[],
  theories: TheoryApplication[] | Set<string>  // backward-compat
): Signal[] {
  const signals: Signal[] = [];
  const agentMap = new Map(allAgents.map(a => [a.id, a]));

  // تطبيع الإدخال — دعم النوع القديم Set<string> للتوافق
  const theoryApps: TheoryApplication[] = Array.isArray(theories)
    ? (theories as TheoryApplication[])
    : [...(theories as Set<string>)].map(k => ({
        key: k as any, enabled: true, intensity: 0.50,
        subtactics: [true, true, true],
      }));

  for (const edge of agent.connections) {
    const influenceProbability = getOutgoingInfluence(agent) * edge.weight;
    if (rand() > influenceProbability) continue;

    const target = agentMap.get(edge.targetId);
    if (!target) continue;

    const signal = buildSignal(agent, target, edge, theoryApps);
    signals.push(signal);
  }

  return signals;
}

function buildSignal(
  source: SocialAgent,
  target: SocialAgent,
  edge: NetworkEdge,
  theories: TheoryApplication[]
): Signal {
  const t = source.traits;
  const e = source.emotional;
  const authority = getOutgoingInfluence(source);

  // ── الشحنة العاطفية الأساسية (قبل تعديل النظريات) ──
  // Christakis & Fowler: fear β≈0.30, anger β≈0.25, hope β≈0.08
  const emotionalCharge: Partial<EmotionalState> = {};
  if (e.fear      > 0.3 && rand() < 0.65) emotionalCharge.fear      = e.fear      * 0.15;
  if (e.anger     > 0.3 && rand() < 0.60) emotionalCharge.anger     = e.anger     * 0.12;
  if (e.hope      > 0.4 && rand() < 0.35) emotionalCharge.hope      = e.hope      * 0.07;
  if (e.solidarity > 0.4 && rand() < 0.45) emotionalCharge.solidarity = e.solidarity * 0.09;
  if (e.despair   > 0.3 && rand() < 0.50) emotionalCharge.despair   = e.despair   * 0.11;

  // beliefDelta أساسي — سيُعدَّل من applyTheoriesToSignal
  const beliefDelta = (t.openness ?? 0.5) * 0.02 * authority;

  const baseSignal: Signal = {
    sourceId:       source.id,
    targetId:       edge.targetId,
    beliefDelta,
    emotionalCharge,
    strength:       authority * edge.weight,
    credibility:    getCredibility(source, edge),
    theoryTag:      undefined,
  };

  // ── تطبيق تعديلات النظريات المُعايَرة تجريبياً ──
  const ctx: TheorySignalContext = {
    source, target,
    edgeType: edge.type,
    allTheories: theories,
  };

  const modified = applyTheoriesToSignal(baseSignal, ctx);

  // تحديد theoryTag من أول نظرية مُفعَّلة
  const firstEnabled = theories.find(th => th.enabled);
  modified.theoryTag = firstEnabled?.key;

  return modified;
}

/**
 * تطبيق الإشارات الواردة على الوكيل.
 * السمات الشخصية تحدد كيف يستجيب الوكيل.
 */
export function applySignals(
  agent: SocialAgent,
  incomingSignals: Signal[]
): { newTraits: Record<string, number>; newEmotional: EmotionalState } {
  if (incomingSignals.length === 0) {
    return { newTraits: { ...agent.traits }, newEmotional: { ...agent.emotional } };
  }

  const t = { ...agent.traits };
  const e = { ...agent.emotional };

  for (const signal of incomingSignals) {
    // عامل القبول: يعتمد على skepticism والعمر والمصداقية
    const acceptance = calculateAcceptance(agent, signal);
    if (acceptance <= 0) continue;

    // تأثير المعتقد على openness/rigidity
    const beliefChange = signal.beliefDelta * acceptance;
    t.openness             = clamp((t.openness ?? 0.5) + beliefChange * 0.5);
    t.ideological_rigidity = clamp((t.ideological_rigidity ?? 0.4) - beliefChange * 0.3);

    // تأثير الإشارة على الثقة بالمؤسسات (مع الوقت)
    if (signal.strength > 0.6) {
      t.trust_in_institutions = clamp(
        (t.trust_in_institutions ?? 0.5) + signal.beliefDelta * 0.1 * acceptance
      );
    }

    // انتشار العواطف
    for (const [emotion, delta] of Object.entries(signal.emotionalCharge)) {
      if (delta === undefined) continue;
      const key = emotion as keyof EmotionalState;
      // الخوف يُعدي بشكل غير متناسب
      const contagionMultiplier = key === 'fear' ? 1.3 : key === 'anger' ? 1.1 : 0.8;
      (e as any)[key] = clamp(((e as any)[key] ?? 0) + (delta as number) * acceptance * contagionMultiplier);
    }
  }

  return { newTraits: t, newEmotional: e };
}

// ─────────────────────────────────────────────────────────────
// دوال مساعدة
// ─────────────────────────────────────────────────────────────

/** قوة التأثير الصادر من الوكيل */
function getOutgoingInfluence(agent: SocialAgent): number {
  const ageAuthorityMap: Record<AgeGroup, number> = {
    teen: 0.60, youth: 0.95, adult: 1.10, elder: 1.25,
  };
  const ageAuth = ageAuthorityMap[agent.ageGroup] ?? 1.0;
  const stateBoost = agent.state === 'positiveInfluencer' ? 1.4
    : agent.state === 'negativeInfluencer' ? 1.3
    : agent.state === 'activist' ? 1.2
    : 1.0;
  return clamp((agent.traits.prestige_seeking ?? 0.5) * 0.3 + ageAuth * 0.4 + stateBoost * 0.3 - 0.2);
}

/** مصداقية المصدر */
function getCredibility(source: SocialAgent, edge: NetworkEdge): number {
  const typeWeight: Record<string, number> = {
    family: 0.85, tribe: 0.75, friend: 0.65, media: 0.40,
  };
  return clamp((typeWeight[edge.type] ?? 0.5) * (source.traits.trust_in_institutions ?? 0.5));
}

/** عامل القبول — قلب النموذج */
function calculateAcceptance(agent: SocialAgent, signal: Signal): number {
  const t = agent.traits;
  const e = agent.emotional;

  const base = signal.strength;
  const skepticismPenalty = (t.skepticism ?? 0.5) * (1 - signal.credibility) * 0.5;
  const conformityBonus = (t.conformity ?? 0.5) * 0.2;

  // الخوف يزيد القابلية للتأثير
  const fearAmplifier = e.fear > 0.7 ? 1.4 : e.fear > 0.5 ? 1.2 : 1.0;

  // التصلب الأيديولوجي يقلل القبول
  const rigidityPenalty = (t.ideological_rigidity ?? 0.4) * 0.3;

  // عامل العمر
  const ageFactorMap: Record<AgeGroup, number> = {
    teen: 1.35, youth: 1.10, adult: 0.85, elder: 0.70,
  };
  const ageFactor = ageFactorMap[agent.ageGroup] ?? 1.0;

  return clamp((base + conformityBonus - skepticismPenalty - rigidityPenalty) * fearAmplifier * ageFactor);
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, isNaN(v) ? 0.5 : v));
}

// ─────────────────────────────────────────────────────────────
// إحصاءات الشبكة (للتصدير البحثي)
// ─────────────────────────────────────────────────────────────

export interface NetworkStats {
  avgDegree:        number;   // متوسط عدد الروابط
  density:          number;   // كثافة الشبكة 0–1
  familyEdgeCount:  number;
  friendEdgeCount:  number;
  tribeEdgeCount:   number;
}

export function computeNetworkStats(connections: NetworkEdge[][]): NetworkStats {
  let totalEdges = 0;
  let familyEdgeCount = 0;
  let friendEdgeCount = 0;
  let tribeEdgeCount = 0;
  const n = connections.length;

  for (const edges of connections) {
    totalEdges += edges.length;
    for (const e of edges) {
      if (e.type === 'family')  familyEdgeCount++;
      else if (e.type === 'friend') friendEdgeCount++;
      else if (e.type === 'tribe')  tribeEdgeCount++;
    }
  }

  const avgDegree = n > 0 ? totalEdges / n : 0;
  const maxPossibleEdges = n * (n - 1);
  const density = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;

  return { avgDegree, density, familyEdgeCount, friendEdgeCount, tribeEdgeCount };
}
