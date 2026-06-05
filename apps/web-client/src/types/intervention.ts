export type InterventionType = 'restorative' | 'corruptive' | 'neutral' | 'corrective' | 'stabilizing' | 'experimental';

export interface InterventionRecord {
  interventionId: string;
  tick: number;
  targetType: 'agent' | 'group' | 'cluster' | 'system';
  targetIds: number[];
  interventionType: InterventionType;
  intensity: number;
  duration: number;
  reason: string;
  expectedOutcome?: string;
  actualOutcome?: string;
  preState?: Record<string, number>; // Metrics or agent stats before
  postState?: Record<string, number>; // Metrics or agent stats after
  networkRipple?: number;
  recoveryScore?: number;
  notes?: string;
  isActive: boolean;
}
