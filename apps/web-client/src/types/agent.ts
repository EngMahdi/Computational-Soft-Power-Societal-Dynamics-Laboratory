import { AgeProfile } from "./age";
import type { IntelligenceLevel, SocialRole, EnrichedMemory } from '../simulation/agentAI';
export type { IntelligenceLevel, SocialRole, EnrichedMemory };

export interface EmotionalState {
  fear:       number; // 0.0 – 1.0
  anger:      number;
  hope:       number;
  pride:      number;
  despair:    number;
  solidarity: number;
}

export function defaultEmotionalState(): EmotionalState {
  return { fear: 0.1, anger: 0.05, hope: 0.3, pride: 0.2, despair: 0.1, solidarity: 0.25 };
}

export function dominantEmotion(e: EmotionalState): string {
  const entries = Object.entries(e) as [string, number][];
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

// decay every tick — without it emotion stays frozen
export function decayEmotions(e: EmotionalState, dt: number = 1): EmotionalState {
  const DECAY = { fear: 0.015, anger: 0.012, hope: 0.005, pride: 0.004, despair: 0.007, solidarity: 0.006 };
  return {
    fear:       Math.max(0, e.fear       - DECAY.fear       * dt),
    anger:      Math.max(0, e.anger      - DECAY.anger      * dt),
    hope:       Math.max(0, e.hope       - DECAY.hope       * dt),
    pride:      Math.max(0, e.pride      - DECAY.pride      * dt),
    despair:    Math.max(0, e.despair    - DECAY.despair    * dt),
    solidarity: Math.max(0, e.solidarity - DECAY.solidarity * dt),
  };
}

export interface InjectionRecord {
  tick: number;
  type: string;
  narrative: string;
  spreadToNetwork: boolean;
  spreadRadius: number;
  durationTicks: number;
  // Snapshot of agent state before injection
  preInjectionState: {
    state: string;
    emotionalState: EmotionalState;
    beliefs: Record<string, number>;
  };
  // Post-injection effect data (captured each cycle)
  effectHistory: {
    tick: number;
    state: string;
    emotionalState: EmotionalState;
    adoption: number;
  }[];
}

export interface Agent {
  id: number;
  state: string;
  ageProfile: AgeProfile;
  emotionalState: EmotionalState;
  mind?: Record<string, number>;
  memory: {
    shortTerm:     number[];  // last 10 interacted IDs
    traumaEvents:  string[];  // Traumatic events
  };
  // ── New AI fields ──
  intelligenceProfile?: IntelligenceLevel;
  socialRole?: SocialRole;
  enrichedMemory?: EnrichedMemory;
  location?: { province: string; district: string };
  connections?: number[];
  activeInjection?: { type: string; remainingTicks: number };
  injectionHistory: InjectionRecord[];
}

export function createAgent(id: number): Agent {
  return {
    id,
    state: 'moderate',
    ageProfile: { group: 'youth', age: 25 },
    emotionalState: defaultEmotionalState(),
    memory: { shortTerm: [], traumaEvents: [] },
    connections: [],
    injectionHistory: [],
  };
}

export function applyInjection(
  agents: Agent[],
  targetId: number,
  injection: {
    type: string;
    emotionDeltas?: Partial<EmotionalState>;
    beliefDeltas?: Partial<Record<string, number>>;
    durationTicks: number;
    spreadToNetwork: boolean;
    spreadRadius: number;
    narrative?: string;
  }
): Agent[] {
  const targets = new Set<number>([targetId]);

  if (injection.spreadToNetwork) {
    const target = agents.find(a => a.id === targetId);
    if (target?.connections) {
      let frontier = [...(target.connections ?? [])];
      for (let r = 1; r < injection.spreadRadius; r++) {
        const next = frontier.flatMap(id =>
          agents.find(a => a.id === id)?.connections ?? []
        );
        frontier = next;
        next.forEach(id => targets.add(id));
      }
    }
  }

  return agents.map(agent => {
    if (!targets.has(agent.id)) return agent;

    const newEmotions = { ...agent.emotionalState };
    if (injection.emotionDeltas) {
      for (const [key, delta] of Object.entries(injection.emotionDeltas)) {
        const k = key as keyof EmotionalState;
        newEmotions[k] = Math.max(0, Math.min(1, (newEmotions[k] ?? 0) + (delta ?? 0)));
      }
    }

    const newMind = agent.mind ? { ...agent.mind } : undefined;
    if (injection.beliefDeltas && newMind) {
      for (const [key, delta] of Object.entries(injection.beliefDeltas)) {
        if (key in newMind) {
          (newMind as any)[key] = Math.max(0, Math.min(1,
            ((newMind as any)[key] ?? 0.5) + (delta ?? 0)));
        }
      }
    }

    const shortTerm = [targetId, ...(agent.memory?.shortTerm ?? [])].slice(0, 10);

    return {
      ...agent,
      emotionalState: newEmotions,
      mind: newMind,
      memory: { ...agent.memory, shortTerm },
      activeInjection: { type: injection.type, remainingTicks: injection.durationTicks },
    };
  });
}