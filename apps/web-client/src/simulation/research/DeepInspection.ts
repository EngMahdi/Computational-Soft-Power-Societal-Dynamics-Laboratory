import { Ledger } from './LedgerSystem';

export class DeepInspection {
  
  /**
   * Generates a compressed narrative of an agent's life between startTick and endTick.
   */
  public static inspectAgent(agentId: number, startTick: number, endTick: number): string {
    const entries = Ledger.agentLedger.getTimeline(agentId, startTick, endTick);
    
    if (entries.length === 0) {
      return `Agent ${agentId}: No records found in range ${startTick}-${endTick}.`;
    }

    let summary = `[Agent ${agentId} Life Ledger | Tick ${startTick} to ${endTick}]\n`;
    
    // Get baseline
    const first = entries[0];
    summary += `BASELINE (Tick ${first.tick}): Age ${first.age.toFixed(1)}, State: ${first.state}, Emotion: ${Object.entries(first.emotionsSnapshot).sort((a,b)=>b[1]-a[1])[0][0]}\n`;

    // Extract significant events
    const events = entries.filter(e => !e.isKeyframe || e.notes);
    if (events.length > 0) {
      summary += `SIGNIFICANT EVENTS:\n`;
      events.forEach(e => {
        summary += `- Tick ${e.tick}: State=${e.state}${e.notes ? ` (${e.notes})` : ''}\n`;
      });
    }

    const last = entries[entries.length - 1];
    summary += `END STATE (Tick ${last.tick}): Age ${last.age.toFixed(1)}, State: ${last.state}, Emotion: ${Object.entries(last.emotionsSnapshot).sort((a,b)=>b[1]-a[1])[0][0]}\n`;
    
    return summary;
  }

  /**
   * Generates a system-wide or group-wide intervention report.
   */
  public static inspectIntervention(startTick: number, endTick: number): string {
    const interventions = Ledger.interventionLedger.getHistory(startTick, endTick);
    if (interventions.length === 0) return 'No targeted interventions occurred in this timeframe.';
    
    let summary = `[Targeted Interventions | Tick ${startTick} to ${endTick}]\n`;
    interventions.forEach(i => {
      summary += `- [${i.tick}] Type: ${i.interventionType}, Target: ${i.targetType} (${i.targetIds.length} entities), Duration: ${i.duration}\n`;
      if (i.reason) summary += `  Reason: ${i.reason}\n`;
    });
    return summary;
  }

  /**
   * Inspects anomalies in the given timeframe.
   */
  public static inspectAnomalies(startTick: number, endTick: number): string {
    const anomalies = Ledger.anomalyLedger.getAnomalies(startTick, endTick);
    if (anomalies.length === 0) return 'No anomalies detected in this timeframe.';
    
    let summary = `[Anomalies Detected | Tick ${startTick} to ${endTick}]\n`;
    anomalies.forEach(a => {
      summary += `- [${a.tick}] ${a.anomalyType} (Severity: ${a.severity.toFixed(2)}, Real: ${a.isRealEmergence})\n`;
      if (a.notes) summary += `  Notes: ${a.notes}\n`;
    });
    return summary;
  }
}
