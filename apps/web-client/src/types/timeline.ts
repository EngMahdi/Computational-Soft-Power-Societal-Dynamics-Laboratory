import type { EmotionalState } from './agent';
import type { AgentStateKey } from '../i18n/types';

export interface AgentTimelineEntry {
  tick: number;
  agentId: number;
  age: number;
  state: AgentStateKey;
  traitsSnapshot: Record<string, number>;
  emotionsSnapshot: EmotionalState;
  beliefSnapshot: Record<string, number>; // Maps to traits in our impl
  memorySnapshot: string[];
  role: string;
  cognitiveDepth: 'low' | 'medium' | 'high' | 'expert';
  influenceStrength: number;
  susceptibility: number;
  incomingSignals: number; // Count of incoming
  outgoingSignals: number; // Count of outgoing
  theoryEffects: string[];
  eventsApplied: string[];
  interventionsApplied: string[];
  anomalyFlags: string[];
  notes?: string;
  isKeyframe: boolean; // Custom: true if this is a full state snapshot, false if just a delta/event log
}

export interface AgentTimeline {
  agentId: number;
  entries: AgentTimelineEntry[];
  startTick: number;
  endTick: number;
  summary?: string;
  dominantTrends?: string[];
  identityStabilityScore?: number;
  memoryContinuityScore?: number;
  influenceTrajectory?: string;
  interventionImpactScore?: number;
}
