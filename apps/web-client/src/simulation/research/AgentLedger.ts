import { AgentTimelineEntry } from '../../types/timeline';
import { DynamicAgent } from '../agentEvolution';

export class AgentLedger {
  private ledgers: Map<number, AgentTimelineEntry[]> = new Map();
  private readonly keyframeInterval: number;

  constructor(keyframeInterval = 50) {
    this.keyframeInterval = keyframeInterval;
  }

  /**
   * Builds a timeline entry from current agent state.
   */
  private buildEntry(
    tick: number,
    agentId: number,
    agent: DynamicAgent,
    isKeyframe: boolean,
    notes?: string
  ): AgentTimelineEntry {
    return {
      tick,
      agentId,
      age: agent.ageProfile.age,
      state: agent.state as any,
      traitsSnapshot: { ...agent.traits } as Record<string, number>,
      emotionsSnapshot: { ...agent.emotionalState },
      beliefSnapshot: {}, // Can map specific rigidities if needed
      memorySnapshot: [...agent.memory.recentEvents],
      role: 'citizen', // Default, extendable
      cognitiveDepth: 'medium',
      influenceStrength: (agent.traits as any).social_authority || 0.5,
      susceptibility: (agent.traits as any).conformity || 0.5,
      incomingSignals: 0,
      outgoingSignals: 0,
      theoryEffects: [],
      eventsApplied: [],
      interventionsApplied: [],
      anomalyFlags: [],
      isKeyframe,
      notes,
    };
  }

  /**
   * Records the agent's state. Call this every tick.
   * Internally filters out redundant logs to save memory.
   */
  public record(tick: number, agentId: number, agent: DynamicAgent, isSignificantEvent: boolean, notes?: string) {
    const isKeyframe = tick % this.keyframeInterval === 0 || tick === 1;
    
    // Memory optimization: Only record if it's a keyframe or a significant event.
    if (!isKeyframe && !isSignificantEvent) return;

    if (!this.ledgers.has(agentId)) {
      this.ledgers.set(agentId, []);
    }

    const entry = this.buildEntry(tick, agentId, agent, isKeyframe, notes);
    this.ledgers.get(agentId)!.push(entry);
  }

  /**
   * Retrieves the timeline for an agent between startTick and endTick.
   */
  public getTimeline(agentId: number, startTick: number, endTick: number): AgentTimelineEntry[] {
    const entries = this.ledgers.get(agentId) || [];
    return entries.filter(e => e.tick >= startTick && e.tick <= endTick);
  }
}
