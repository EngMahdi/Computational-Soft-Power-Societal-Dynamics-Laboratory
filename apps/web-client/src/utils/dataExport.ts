/**
 * dataExport.ts
 * ─────────────────────────────────────────────────────────────
 * Data export system for academic analysis.
 *
 * Supports:
 * - CSV time-series (every 50 ticks) — compatible with R/Python/SPSS/Excel
 * - JSON full snapshots
 * - Text summary for events and injections
 * - metadata reproducibility (seed, version, parameters)
 * ─────────────────────────────────────────────────────────────
 */

import type { AgentStateKey, Translations } from '../i18n/types';

// ─────────────────────────────────────────────────────────────
// Data Types
// ─────────────────────────────────────────────────────────────

export interface MetricsSnapshot {
  tick:                    number;
  wallTime:                string;   // ISO timestamp
  // 11 Core Metrics
  polarization:            number;
  cohesion:                number;
  identity_fragmentation:  number;
  memetic_velocity:        number;
  elite_dominance:         number;
  resistance_strength:     number;
  echo_density:            number;
  narrative_volatility:    number;
  algorithmic_capture:     number;
  ideological_entropy:     number;
  belief_adoption:         number;
  // State Distribution
  state_extremist:         number;
  state_conservative:      number;
  state_moderate:          number;
  state_liberal:           number;
  state_positiveInfluencer:number;
  state_negativeInfluencer:number;
  state_resistant:         number;
  state_gullible:          number;
  state_activist:          number;
  state_isolated:          number;
  // Emotional Distribution
  emotion_fear:            number;
  emotion_anger:           number;
  emotion_hope:            number;
  emotion_pride:           number;
  emotion_despair:         number;
  emotion_solidarity:      number;
  // Derived Indicators (للبحث)
  health_score:            number;   // (cohesion + (1-pol) + (1-echo)) / 3
  gini_coefficient:        number;   // قياس التفاوت في State Distribution
  shannon_entropy:         number;   // State diversity
  active_events_count:     number;
  // معلومات reproducibility
  seed:                    number;
  agent_count:             number;
  province?:               string;
}

export interface SimulationMetadata {
  version:       string;
  seed:          number;
  agentCount:    number;
  province?:     string;
  startTime:     string;
  theories:      string[];
  description?:  string;
}

// ─────────────────────────────────────────────────────────────
// Time-Series Recorder
// ─────────────────────────────────────────────────────────────

export class TimeSeriesRecorder {
  private snapshots: MetricsSnapshot[] = [];
  private metadata: SimulationMetadata;
  readonly snapshotInterval: number;

  constructor(metadata: SimulationMetadata, snapshotInterval = 50) {
    this.metadata = metadata;
    this.snapshotInterval = snapshotInterval;
  }

  /** Adds a snapshot if it is time */
  maybeRecord(
    tick: number,
    metrics: Record<string, number>,
    stateCounts: Record<AgentStateKey, number>,
    emotionalCounts: Record<string, number>,
    activeEventsCount: number,
    agentCount: number,
    province?: string
  ): void {
    if (tick % this.snapshotInterval !== 0 && tick !== 1) return;
    this.snapshots.push(
      buildSnapshot(tick, metrics, stateCounts, emotionalCounts, activeEventsCount, this.metadata.seed, agentCount, province)
    );
  }

  /** Immediate recording regardless of interval (for important events) */
  forceRecord(
    tick: number,
    metrics: Record<string, number>,
    stateCounts: Record<AgentStateKey, number>,
    emotionalCounts: Record<string, number>,
    activeEventsCount: number,
    agentCount: number,
    label?: string
  ): void {
    const snap = buildSnapshot(tick, metrics, stateCounts, emotionalCounts, activeEventsCount, this.metadata.seed, agentCount);
    if (label) (snap as any)._label = label;
    this.snapshots.push(snap);
  }

  getSnapshots(): MetricsSnapshot[] { return [...this.snapshots]; }
  getCount(): number                { return this.snapshots.length; }
  clear(): void                     { this.snapshots = []; }

  /** Export as CSV */
  toCSV(): string {
    if (this.snapshots.length === 0) return '';
    const headers = Object.keys(this.snapshots[0]);
    const rows = this.snapshots.map(s =>
      headers.map(h => {
        const v = (s as any)[h];
        return typeof v === 'number' ? v.toFixed(6) : String(v ?? '');
      }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  /** Export as JSON with metadata */
  toJSON(): string {
    return JSON.stringify({
      metadata: this.metadata,
      snapshotInterval: this.snapshotInterval,
      totalSnapshots: this.snapshots.length,
      snapshots: this.snapshots,
    }, null, 2);
  }
}

// ─────────────────────────────────────────────────────────────
// Build Snapshot
// ─────────────────────────────────────────────────────────────

function buildSnapshot(
  tick: number,
  metrics: Record<string, number>,
  stateCounts: Record<AgentStateKey, number>,
  emotionalCounts: Record<string, number>,
  activeEventsCount: number,
  seed: number,
  agentCount: number,
  province?: string
): MetricsSnapshot {
  const total = agentCount || 1;

  const stateValues = {
    state_extremist:          (stateCounts.extremist         || 0),
    state_conservative:       (stateCounts.conservative      || 0),
    state_moderate:           (stateCounts.moderate          || 0),
    state_liberal:            (stateCounts.liberal           || 0),
    state_positiveInfluencer: (stateCounts.positiveInfluencer|| 0),
    state_negativeInfluencer: (stateCounts.negativeInfluencer|| 0),
    state_resistant:          (stateCounts.resistant         || 0),
    state_gullible:           (stateCounts.gullible          || 0),
    state_activist:           (stateCounts.activist          || 0),
    state_isolated:           (stateCounts.isolated          || 0),
  };

  const pol  = metrics.polarization  || 0;
  const coh  = metrics.cohesion      || 0;
  const echo = metrics.echo_density  || 0;

  return {
    tick,
    wallTime: new Date().toISOString(),
    polarization:           pol,
    cohesion:               coh,
    identity_fragmentation: metrics.identity_fragmentation || 0,
    memetic_velocity:       metrics.memetic_velocity       || 0,
    elite_dominance:        metrics.elite_dominance        || 0,
    resistance_strength:    metrics.resistance_strength    || 0,
    echo_density:           echo,
    narrative_volatility:   metrics.narrative_volatility   || 0,
    algorithmic_capture:    metrics.algorithmic_capture    || 0,
    ideological_entropy:    metrics.ideological_entropy    || 0,
    belief_adoption:        metrics.belief_adoption        || 0,
    ...stateValues,
    emotion_fear:      (emotionalCounts.fear      || emotionalCounts.fearful  || 0) / total,
    emotion_anger:     (emotionalCounts.anger     || emotionalCounts.angry    || 0) / total,
    emotion_hope:      (emotionalCounts.hope      || emotionalCounts.hopeful  || 0) / total,
    emotion_pride:     (emotionalCounts.pride     || 0) / total,
    emotion_despair:   (emotionalCounts.despair   || 0) / total,
    emotion_solidarity:(emotionalCounts.solidarity|| emotionalCounts.calm     || 0) / total,
    // Derived Indicators
    health_score:       (coh + (1 - pol) + (1 - echo)) / 3,
    gini_coefficient:   computeGini(Object.values(stateValues)),
    shannon_entropy:    computeShannonEntropy(Object.values(stateValues), total),
    active_events_count: activeEventsCount,
    seed,
    agent_count:        agentCount,
    province,
  };
}

// ─────────────────────────────────────────────────────────────
// Statistical Functions
// ─────────────────────────────────────────────────────────────

/** Gini coefficient لقياس التفاوت في State Distribution */
export function computeGini(counts: number[]): number {
  const sorted = [...counts].sort((a, b) => a - b);
  const n = sorted.length;
  const total = sorted.reduce((s, v) => s + v, 0);
  if (total === 0 || n === 0) return 0;
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += sorted[i] * (2 * (i + 1) - n - 1);
  }
  return Math.abs(numerator / (n * total));
}

/** Shannon Entropy لقياس التنوع الأيديولوجي */
export function computeShannonEntropy(counts: number[], total: number): number {
  if (total === 0) return 0;
  let entropy = 0;
  for (const count of counts) {
    if (count <= 0) continue;
    const p = count / total;
    entropy -= p * Math.log2(p);
  }
  // تطبيع إلى [0,1] بقسمة على log2(N)
  const maxEntropy = Math.log2(counts.filter(c => c > 0).length || 1);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

// ─────────────────────────────────────────────────────────────
// Direct Browser Export Functions
// ─────────────────────────────────────────────────────────────

export function downloadCSV(recorder: TimeSeriesRecorder, filename?: string): void {
  const csv = recorder.toCSV();
  if (!csv) return;
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename ?? `simulation_timeseries_${Date.now()}.csv`);
}

export function downloadJSON(recorder: TimeSeriesRecorder, filename?: string): void {
  const json = recorder.toJSON();
  const blob = new Blob([json], { type: 'application/json' });
  triggerDownload(blob, filename ?? `simulation_data_${Date.now()}.json`);
}

export function downloadAgentsCSV(
  agents: any[],
  tick: number,
  filename?: string
): void {
  if (!agents.length) return;

  const headers = [
    'id', 'state', 'age', 'ageGroup', 'province', 'district',
    'openness', 'skepticism', 'conformity', 'tribalism', 'aggression',
    'prestige_seeking', 'fear_sensitivity', 'emotionality',
    'cognitive_flexibility', 'ideological_rigidity', 'attention_span', 'trust_in_institutions',
    'emotion_fear', 'emotion_anger', 'emotion_hope', 'emotion_pride', 'emotion_despair', 'emotion_solidarity',
    'dominant_emotion', 'injection_count',
  ];

  const rows = agents.map(a => [
    a.id ?? '',
    a.state ?? '',
    a.ageProfile?.age ?? '',
    a.ageProfile?.group ?? '',
    a.location?.province ?? a.province ?? '',
    a.location?.district ?? a.district ?? '',
    ...[
      'openness','skepticism','conformity','tribalism','aggression',
      'prestige_seeking','fear_sensitivity','emotionality',
      'cognitive_flexibility','ideological_rigidity','attention_span','trust_in_institutions',
    ].map(k => (a.traits?.[k] ?? '').toString()),
    ...[
      'fear','anger','hope','pride','despair','solidarity',
    ].map(k => (a.emotionalState?.[k] ?? '').toString()),
    dominantEmotionKey(a.emotionalState),
    (a.injectionHistory?.length ?? 0).toString(),
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename ?? `agents_tick_${tick}.csv`);
}

export class PanelDataRecorder {
  private rows: string[] = [];
  readonly snapshotInterval: number;
  private headers: string[];

  constructor(snapshotInterval = 1) {
    this.snapshotInterval = snapshotInterval;
    this.headers = [
      'tick', 'id', 'state', 'age', 'ageGroup', 'province', 'district',
      'openness', 'skepticism', 'conformity', 'tribalism', 'aggression',
      'prestige_seeking', 'fear_sensitivity', 'emotionality',
      'cognitive_flexibility', 'ideological_rigidity', 'attention_span', 'trust_in_institutions',
      'emotion_fear', 'emotion_anger', 'emotion_hope', 'emotion_pride', 'emotion_despair', 'emotion_solidarity',
      'dominant_emotion', 'injection_count'
    ];
    this.rows.push(this.headers.join(','));
  }

  maybeRecord(tick: number, agents: any[]): void {
    if (tick % this.snapshotInterval !== 0 && tick !== 1) return;
    
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      const agentId = a.id ?? i;
      const row = [
        tick,
        agentId,
        a.state ?? '',
        a.ageProfile?.age ?? '',
        a.ageProfile?.group ?? '',
        a.location?.province ?? a.province ?? '',
        a.location?.district ?? a.district ?? '',
        ...[
          'openness','skepticism','conformity','tribalism','aggression',
          'prestige_seeking','fear_sensitivity','emotionality',
          'cognitive_flexibility','ideological_rigidity','attention_span','trust_in_institutions',
        ].map(k => typeof a.traits?.[k] === 'number' ? a.traits[k].toFixed(4) : ''),
        ...[
          'fear','anger','hope','pride','despair','solidarity',
        ].map(k => typeof a.emotionalState?.[k] === 'number' ? a.emotionalState[k].toFixed(4) : ''),
        dominantEmotionKey(a.emotionalState),
        (a.injectionHistory?.length ?? 0).toString(),
      ];
      this.rows.push(row.join(','));
    }
  }

  clear(): void {
    this.rows = [this.headers.join(',')];
  }

  toCSV(): string {
    return this.rows.join('\n');
  }
}

export function downloadPanelCSV(recorder: PanelDataRecorder, filename?: string): void {
  const csv = recorder.toCSV();
  if (!csv || recorder.toCSV().split('\n').length <= 1) return;
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename ?? `panel_agents_full_${Date.now()}.csv`);
}

/** Export Codebook for Researchers */
export function downloadCodebook(seed: number, agentCount: number, theories: string[], t: Translations): void {
  const text = `
${t.dataExport.codebookTitle}
${t.dataExport.versionLabel} 3.0.0
${t.dataExport.generatedLabel} ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${t.dataExport.simParamsLabel}
  ${t.dataExport.seed}         ${seed}
  ${t.dataExport.agents}       ${agentCount}
  ${t.dataExport.theoriesLabel}     ${theories.join(', ')}

${t.dataExport.varDescLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

tick                     Integer    Simulation step number
wallTime                 String     ISO 8601 timestamp
polarization             Float[0,1] Polarization index (extremist+activist+negInf ratio)
cohesion                 Float[0,1] Social cohesion score (inverse of disruptors)
identity_fragmentation   Float[0,1] Variety of active belief states
memetic_velocity         Float[0,1] Speed of belief diffusion through network
elite_dominance          Float[0,1] Influencer presence ratio
resistance_strength      Float[0,1] Cultural immunity level
echo_density             Float[0,1] Information bubble intensity
narrative_volatility     Float[0,1] Narrative instability index
algorithmic_capture      Float[0,1] Susceptibility to algorithmic manipulation
ideological_entropy      Float[0,1] Shannon entropy of ideological distribution
belief_adoption          Float[0,1] Rate of non-moderate agents (belief change)

state_extremist          Integer    Count of agents in Extremist state
state_conservative       Integer    Count of agents in Conservative state
state_moderate           Integer    Count of agents in Moderate state
state_liberal            Integer    Count of agents in Liberal state
state_positiveInfluencer Integer    Count of agents in Positive Influencer state
state_negativeInfluencer Integer    Count of agents in Negative Influencer state
state_resistant          Integer    Count of agents in Resistant state
state_gullible           Integer    Count of agents in Gullible state
state_activist           Integer    Count of agents in Activist state
state_isolated           Integer    Count of agents in Isolated state

emotion_fear             Float[0,1] Proportion of agents with fear as dominant emotion
emotion_anger            Float[0,1] Proportion of agents with anger as dominant emotion
emotion_hope             Float[0,1] Proportion of agents with hope as dominant emotion
emotion_pride            Float[0,1] Proportion of agents with pride as dominant emotion
emotion_despair          Float[0,1] Proportion of agents with despair as dominant emotion
emotion_solidarity       Float[0,1] Proportion of agents with solidarity as dominant emotion

health_score             Float[0,1] Composite health: (cohesion+(1-pol)+(1-echo))/3
gini_coefficient         Float[0,1] State distribution inequality (0=equal, 1=max_unequal)
shannon_entropy          Float[0,1] Normalized ideological diversity index
active_events_count      Integer    Number of active external events this tick
seed                     Integer    RNG seed for reproducibility
agent_count              Integer    Total agent population

${t.dataExport.agentStateDefs}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
extremist         High aggression + tribalism + fear. Aggressive stance.
conservative      High tribalism + rigidity + conformity. Low openness.
moderate          Baseline state. Centrist, adaptable.
liberal           High openness + cognitive flexibility + hope.
positiveInfluencer High prestige_seeking + trust. Positive social influence.
negativeInfluencer High aggression + low trust. Destructive influence.
resistant         High skepticism + rigidity + solidarity. Cultural immunity.
gullible          Low skepticism + high conformity. Easily influenced.
activist          Moderate aggression + openness + solidarity + anger.
isolated          Low trust + despair + low attention span.

${t.dataExport.theoreticalFramework}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${t.dataExport.frameworkDesc}
${t.dataExport.citation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${t.dataExport.citationText}
${t.dataExport.seed} ${seed} | Start: ${new Date().toISOString()}
`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  triggerDownload(blob, 'research_codebook.txt');
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dominantEmotionKey(emotionalState: any): string {
  if (!emotionalState || typeof emotionalState !== 'object') return 'neutral';
  const entries = Object.entries(emotionalState) as [string, number][];
  if (!entries.length) return 'neutral';
  return entries.reduce((a, b) => b[1] > a[1] ? b : a)[0];
}
