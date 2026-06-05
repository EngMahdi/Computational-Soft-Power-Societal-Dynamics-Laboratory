import { InterventionRecord } from '../../types/intervention';

export class InterventionLedger {
  private interventions: InterventionRecord[] = [];

  public addIntervention(record: InterventionRecord) {
    this.interventions.push(record);
  }

  public updateIntervention(id: string, updates: Partial<InterventionRecord>) {
    const idx = this.interventions.findIndex(i => i.interventionId === id);
    if (idx !== -1) {
      this.interventions[idx] = { ...this.interventions[idx], ...updates };
    }
  }

  public getActiveInterventions(tick: number): InterventionRecord[] {
    return this.interventions.filter(i => i.isActive && tick >= i.tick && tick <= i.tick + i.duration);
  }

  public getHistory(startTick?: number, endTick?: number): InterventionRecord[] {
    let filtered = this.interventions;
    if (startTick !== undefined) {
      filtered = filtered.filter(i => i.tick >= startTick);
    }
    if (endTick !== undefined) {
      filtered = filtered.filter(i => i.tick <= endTick);
    }
    return filtered;
  }
}
