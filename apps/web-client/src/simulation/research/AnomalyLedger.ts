import { AnomalyRecord } from '../../types/anomaly';

export class AnomalyLedger {
  private anomalies: AnomalyRecord[] = [];

  public addAnomaly(record: AnomalyRecord) {
    this.anomalies.push(record);
  }

  public getAnomalies(startTick?: number, endTick?: number): AnomalyRecord[] {
    let filtered = this.anomalies;
    if (startTick !== undefined) {
      filtered = filtered.filter(a => a.tick >= startTick);
    }
    if (endTick !== undefined) {
      filtered = filtered.filter(a => a.tick <= endTick);
    }
    return filtered;
  }
}
