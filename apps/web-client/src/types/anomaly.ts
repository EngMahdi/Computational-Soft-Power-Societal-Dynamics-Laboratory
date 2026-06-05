export interface AnomalyRecord {
  tick: number;
  agentId?: number; // Optional: if null, it's a society-level anomaly
  anomalyType: string;
  severity: number; // 0.0 to 1.0
  classification: 'behavioral' | 'emotional' | 'network' | 'system';
  isRealEmergence: boolean;
  isSimulationError: boolean;
  correctiveAction?: string;
  confidence: number;
  notes?: string;
}
