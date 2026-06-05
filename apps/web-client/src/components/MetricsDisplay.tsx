import { useTranslation } from '../i18n';
import type { MetricKey, AgentStateKey } from '../i18n/types';
import { AGENT_STATE_ORDER } from '../i18n/types';

interface Metrics {
  polarization: number; cohesion: number;
  identity_fragmentation: number; memetic_velocity: number;
  elite_dominance: number; resistance_strength: number;
  echo_density: number; narrative_volatility: number;
  algorithmic_capture: number; ideological_entropy: number;
  belief_adoption: number;
}

interface AgentStateStats {
  state: AgentStateKey;
  count: number;
  percentage: number;
}

interface MetricsDisplayProps {
  tick: number;
  metrics: Metrics;
  agentStateStats: AgentStateStats[];
  // مؤشرات بحثية جديدة (اختيارية للتوافق مع الإصدار القديم)
  seed?: number;
  snapshotCount?: number;
  gini?: number;
  shannonEntropy?: number;
}

/**
 * Internal metric descriptors that use snake_case to match the metrics object
 */
interface MetricDescriptor {
  snakeKey: keyof Metrics;
  camelKey: MetricKey;
  category: 'social' | 'cultural' | 'media';
}

const METRIC_DESCRIPTORS: MetricDescriptor[] = [
  // Social Structure
  { snakeKey: 'polarization', camelKey: 'polarization', category: 'social' },
  { snakeKey: 'cohesion', camelKey: 'cohesion', category: 'social' },
  { snakeKey: 'identity_fragmentation', camelKey: 'identityFragmentation', category: 'social' },
  { snakeKey: 'resistance_strength', camelKey: 'resistanceStrength', category: 'social' },
  // Cultural Dynamics
  { snakeKey: 'memetic_velocity', camelKey: 'memeticVelocity', category: 'cultural' },
  { snakeKey: 'narrative_volatility', camelKey: 'narrativeVolatility', category: 'cultural' },
  { snakeKey: 'belief_adoption', camelKey: 'beliefAdoption', category: 'cultural' },
  { snakeKey: 'ideological_entropy', camelKey: 'ideologicalEntropy', category: 'cultural' },
  // Media & Algorithms
  { snakeKey: 'echo_density', camelKey: 'echoDensity', category: 'media' },
  { snakeKey: 'elite_dominance', camelKey: 'eliteDominance', category: 'media' },
  { snakeKey: 'algorithmic_capture', camelKey: 'algorithmicCapture', category: 'media' },
];

const AGENT_BAR_COLORS: Record<AgentStateKey, string> = {
  extremist: '#ff4444', conservative: '#e17055', moderate: '#74b9ff',
  liberal: '#55efc4', positiveInfluencer: '#ffeaa7', negativeInfluencer: '#6c5ce7',
  resistant: '#00b894', gullible: '#fdcb6e', activist: '#fd79a8', isolated: '#636e72',
};

/** Safe getter: returns value or 0 if NaN/undefined */
function v(val: number | undefined): number {
  return val !== undefined && !isNaN(val) ? val : 0;
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  const safeValue = v(value);
  const percent = (safeValue * 100).toFixed(1);
  const barColor = safeValue > 0.7 ? '#ff6b6b' : safeValue > 0.4 ? '#ffd93d' : '#4ecdc4';
  return (
    <div className="metric-bar">
      <div className="metric-label">
        <span>{label}</span>
        <span className="metric-value" style={{ color: barColor }}>{percent}%</span>
      </div>
      <div className="metric-track">
        <div className="metric-fill" style={{ width: `${percent}%`, backgroundColor: color || barColor }} />
      </div>
    </div>
  );
}

export default function MetricsDisplay({ tick, metrics, agentStateStats, seed, snapshotCount, gini, shannonEntropy }: MetricsDisplayProps) {
  const { t } = useTranslation();

  const polarization = v(metrics.polarization);
  const cohesion = v(metrics.cohesion);
  const echoDensity = v(metrics.echo_density);

  const healthScore = (cohesion + (1 - polarization) + (1 - echoDensity)) / 3;
  const healthKey = healthScore > 0.7 ? 'healthy' : healthScore > 0.4 ? 'warning' : 'critical';
  const getLevel = (value: number) => {
    const safe = v(value);
    return safe > 0.7 ? 'high' : safe > 0.4 ? 'medium' : 'low';
  };

  return (
    <div className="metrics-display">
      <h2>{t.metrics.title}</h2>

      {tick === 0 ? (
        <div className="metrics-placeholder"><p>{t.metrics.placeholder}</p></div>
      ) : (
        <>
          <div className="metrics-header">
            <span className="health-indicator">{t.metrics.health[healthKey]}</span>
            <span className="tick-info">{t.metrics.status}: {tick.toLocaleString()}</span>
          </div>

          <div className="metrics-grid">
            <div className="metrics-category">
              <h4>{t.metrics.categories.socialStructure}</h4>
              {METRIC_DESCRIPTORS.filter(m => m.category === 'social').map(m => (
                <MetricBar key={m.snakeKey} label={t.metrics.names[m.camelKey]} value={v(metrics[m.snakeKey] as any)}
                  color={m.snakeKey === 'polarization' ? '#ff6b6b' : m.snakeKey === 'cohesion' ? '#4ecdc4' : m.snakeKey === 'identity_fragmentation' ? '#a29bfe' : '#fd79a8'} />
              ))}
            </div>
            <div className="metrics-category">
              <h4>{t.metrics.categories.culturalDynamics}</h4>
              {METRIC_DESCRIPTORS.filter(m => m.category === 'cultural').map(m => (
                <MetricBar key={m.snakeKey} label={t.metrics.names[m.camelKey]} value={v(metrics[m.snakeKey] as any)}
                  color={m.snakeKey === 'memetic_velocity' ? '#ffeaa7' : m.snakeKey === 'narrative_volatility' ? '#fab1a0' : m.snakeKey === 'belief_adoption' ? '#55efc4' : '#dfe6e9'} />
              ))}
            </div>
            <div className="metrics-category">
              <h4>{t.metrics.categories.mediaAlgorithms}</h4>
              {METRIC_DESCRIPTORS.filter(m => m.category === 'media').map(m => (
                <MetricBar key={m.snakeKey} label={t.metrics.names[m.camelKey]} value={v(metrics[m.snakeKey] as any)}
                  color={m.snakeKey === 'echo_density' ? '#6c5ce7' : m.snakeKey === 'elite_dominance' ? '#fdcb6e' : '#e17055'} />
              ))}
            </div>
          </div>

          {/* Agent State Statistics */}
          <div className="agent-stats-section">
            <h4>👥 Agent State Distribution</h4>
            <div className="agent-stats-grid">
              {agentStateStats.map(s => (
                <div key={s.state} className="agent-stat-bar">
                  <div className="agent-stat-label">
                    <span className="agent-stat-dot" style={{ background: AGENT_BAR_COLORS[s.state] }}></span>
                    <span>{t.legend.agentStates[s.state].split('–')[0].trim()}</span>
                    <span className="agent-stat-count">{s.count}</span>
                  </div>
                  <div className="metric-track">
                    <div className="metric-fill" style={{
                      width: `${Math.min(s.percentage, 100)}%`,
                      backgroundColor: AGENT_BAR_COLORS[s.state],
                    }} />
                  </div>
                  <span className="agent-stat-pct">{s.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="metrics-summary">
            <h4>{t.metrics.summary}</h4>
            <table>
              <thead><tr><th>{t.metrics.metric}</th><th>{t.metrics.value}</th><th>{t.metrics.statusCol}</th></tr></thead>
              <tbody>
                {METRIC_DESCRIPTORS.map(m => {
                  const safeVal = v(metrics[m.snakeKey] as any);
                  const level = getLevel(safeVal);
                  return (
                    <tr key={m.snakeKey}>
                      <td>{t.metrics.names[m.camelKey]}</td>
                      <td>{(safeVal * 100).toFixed(1)}%</td>
                      <td>{t.metrics.levels[level]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ─── Research-Grade Statistics Panel ─── */}
          {(gini !== undefined || seed !== undefined) && (
            <div style={{
              marginTop: 16, padding: 14,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
              borderRadius: 8, border: '1px solid #312e81',
            }}>
              <h4 style={{ color: '#818cf8', marginBottom: 10, fontSize: 13 }}>
                🔬 مؤشرات بحثية
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {seed !== undefined && (
                  <StatCard label="🌱 Seed" value={seed.toString()} color="#60a5fa"
                    tooltip="رقم الاستنساخ — نفسه = نفس النتائج" />
                )}
                {snapshotCount !== undefined && (
                  <StatCard label="📸 Snapshots" value={snapshotCount.toString()} color="#34d399"
                    tooltip={`تسجيل كل ${50} tick`} />
                )}
                {gini !== undefined && (
                  <StatCard
                    label="Gini Coefficient"
                    value={gini.toFixed(4)}
                    color={gini > 0.6 ? '#f87171' : gini > 0.3 ? '#fbbf24' : '#34d399'}
                    tooltip="0=توزيع متساوٍ / 1=تركّز شديد"
                  />
                )}
                {shannonEntropy !== undefined && (
                  <StatCard
                    label="Shannon Entropy"
                    value={shannonEntropy.toFixed(4)}
                    color={shannonEntropy > 0.7 ? '#a78bfa' : shannonEntropy > 0.4 ? '#60a5fa' : '#f87171'}
                    tooltip="0=تجانس تام / 1=تنوع أيديولوجي أقصى"
                  />
                )}
              </div>
              <p style={{ color: '#4b5563', fontSize: 10, marginTop: 8, textAlign: 'center' }}>
                Gini + Shannon Entropy قابلان للمقارنة مع الدراسات الإمبريقية
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color, tooltip }: {
  label: string; value: string; color: string; tooltip?: string;
}) {
  return (
    <div title={tooltip} style={{
      background: '#1e293b', borderRadius: 6, padding: '8px 10px',
      border: `1px solid ${color}30`, cursor: tooltip ? 'help' : 'default',
    }}>
      <div style={{ color: '#64748b', fontSize: 9, marginBottom: 3 }}>{label}</div>
      <div style={{ color, fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}