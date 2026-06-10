/**
 * ReportModal.tsx
 * Full academic report component with: | تقرير أكاديمي متكامل مع:
 * - AI-powered academic summary    | ملخص ذكاء اصطناعي
 * - Real SVG charts                | رسومات بيانية SVG حقيقية
 * - JSON / CSV / PDF export        | تصدير JSON / CSV / PDF
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { callAIText } from '../simulation/aiRouter';
import type { MetricsSnapshot } from '../utils/dataExport';
import type { AIConfig } from '../simulation/aiRouter';

// ── Incoming Data Interface | واجهة البيانات الواردة ────────

interface ReportData {
  snapshots:   MetricsSnapshot[];
  seed:        number;
  agentCount:  number;
  province?:   string;
  theories:    string[];
  totalTicks:  number;
  aiCallCount: number;
  eventHistory?: { type: string; startTick: number; name?: string; duration: number }[];
}

interface ReportModalProps {
  data:       ReportData;
  aiConfig:   AIConfig;
  onClose:    () => void;
}

// ── Metric Colors | ألوان المقاييس ─────────────────────────

const METRIC_COLORS: Record<string, string> = {
  polarization:           '#ef4444',
  cohesion:               '#4ade80',
  identity_fragmentation: '#f97316',
  memetic_velocity:       '#a855f7',
  elite_dominance:        '#06b6d4',
  resistance_strength:    '#84cc16',
  echo_density:           '#f59e0b',
  narrative_volatility:   '#ec4899',
  algorithmic_capture:    '#8b5cf6',
  health_score:           '#10b981',
};

const getMetricLabels = (t: any): Record<string, string> => ({
  polarization:           t.metrics.names.polarization,
  cohesion:               t.metrics.names.cohesion,
  identity_fragmentation: t.metrics.names.identityFragmentation,
  memetic_velocity:       t.metrics.names.memeticVelocity,
  elite_dominance:        t.metrics.names.eliteDominance,
  resistance_strength:    t.metrics.names.resistanceStrength,
  echo_density:           t.metrics.names.echoDensity,
  narrative_volatility:   t.metrics.names.narrativeVolatility,
  algorithmic_capture:    t.metrics.names.algorithmicCapture,
  health_score:           t.dataExport.healthScore,
});


// ── Loading Spinner | مؤشر التحميل ─────────────────────────

function Spinner() {
  return (
    <div style={{
      display: 'inline-block', width: 14, height: 14, borderRadius: '50%',
      border: '2px solid #1e3a5f', borderTopColor: '#60a5fa',
      animation: 'spin 0.8s linear infinite',
    }} />
  );
}

// ── SVG Line Chart | رسم خط بياني SVG ──────────────────────

function LineChart({
  snapshots, metrics, width = 680, height = 160,
}: {
  snapshots: MetricsSnapshot[];
  metrics:   string[];
  width?:    number;
  height?:   number;
}) {
  const { t } = useTranslation();
  
  const METRIC_LABELS: Record<string, string> = {
    polarization:           t.metrics.names.polarization,
    cohesion:               t.metrics.names.cohesion,
    identity_fragmentation: t.metrics.names.identityFragmentation,
    memetic_velocity:       t.metrics.names.memeticVelocity,
    elite_dominance:        t.metrics.names.eliteDominance,
    resistance_strength:    t.metrics.names.resistanceStrength,
    echo_density:           t.metrics.names.echoDensity,
    narrative_volatility:   t.metrics.names.narrativeVolatility,
    algorithmic_capture:    t.metrics.names.algorithmicCapture,
    health_score:           t.dataExport.healthScore,
  };

  if (snapshots.length < 2) {
    return (
      <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: 20 }}>
        بيانات غير كافية للرسم (نقطتان على الأقل)
      </div>
    );
  }

  const PAD = { top: 12, right: 16, bottom: 28, left: 38 };
  const W   = width  - PAD.left - PAD.right;
  const H   = height - PAD.top  - PAD.bottom;
  const n   = snapshots.length;

  const x = (i: number) => PAD.left + (i / (n - 1)) * W;
  const y = (v: number) => PAD.top + (1 - v) * H;

  // Y-axis guide lines | خطوط Y المساعدة
  const yGridLines = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* Background | خلفية */}
      <rect x={PAD.left} y={PAD.top} width={W} height={H}
        fill="#060f1e" rx={4} />

      {/* Guide lines | خطوط مساعدة */}
      {yGridLines.map(v => (
        <g key={v}>
          <line
            x1={PAD.left} y1={y(v)} x2={PAD.left + W} y2={y(v)}
            stroke="#1e3a5f" strokeWidth={1} strokeDasharray={v === 0 || v === 1 ? '' : '3,3'}
          />
          <text x={PAD.left - 4} y={y(v) + 4}
            fill="#475569" fontSize={8} textAnchor="end">
            {(v * 100).toFixed(0)}%
          </text>
        </g>
      ))}

      {/* X-axis ticks | خطوط X */}
      {[0, 0.25, 0.5, 0.75, 1.0].map(t => {
        const i = Math.round(t * (n - 1));
        return (
          <text key={t} x={x(i)} y={PAD.top + H + 14}
            fill="#475569" fontSize={8} textAnchor="middle">
            T{snapshots[i]?.tick ?? 0}
          </text>
        );
      })}

      {/* Data curves | منحنيات البيانات */}
      {metrics.map(metric => {
        const color = METRIC_COLORS[metric] ?? '#60a5fa';
        const points = snapshots.map((s, i) =>
          `${x(i).toFixed(1)},${y((s as any)[metric] ?? 0).toFixed(1)}`
        ).join(' ');
        return (
          <polyline
            key={metric}
            points={points}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinejoin="round"
            opacity={0.85}
          />
        );
      })}

      {/* Border frame | إطار */}
      <rect x={PAD.left} y={PAD.top} width={W} height={H}
        fill="none" stroke="#1e3a5f" strokeWidth={1} rx={4} />
    </svg>
  );
}

// ── Bar Chart for State Distribution | رسم Bar Chart لتوزيع الحالات ──

function StateBarChart({
  snapshot, width = 680, height = 100,
}: {
  snapshot: MetricsSnapshot;
  width?:   number;
  height?:  number;
}) {
  const { t } = useTranslation();
  const states = [
    { key: 'state_moderate',          label: t.reportModal.shortStates.moderate,          color: '#4ade80' },
    { key: 'state_extremist',         label: t.reportModal.shortStates.extremist,          color: '#ef4444' },
    { key: 'state_conservative',      label: t.reportModal.shortStates.conservative,          color: '#f59e0b' },
    { key: 'state_liberal',           label: t.reportModal.shortStates.liberal,        color: '#60a5fa' },
    { key: 'state_positiveInfluencer',label: t.reportModal.shortStates.positiveInfluencer,   color: '#10b981' },
    { key: 'state_negativeInfluencer',label: t.reportModal.shortStates.negativeInfluencer,     color: '#f97316' },
    { key: 'state_resistant',         label: t.reportModal.shortStates.resistant,          color: '#84cc16' },
    { key: 'state_gullible',          label: t.reportModal.shortStates.gullible,    color: '#a855f7' },
    { key: 'state_activist',          label: t.reportModal.shortStates.activist,           color: '#06b6d4' },
    { key: 'state_isolated',          label: t.reportModal.shortStates.isolated,          color: '#475569' },
  ];

  const PAD = { top: 8, right: 8, bottom: 30, left: 8 };
  const W   = width  - PAD.left - PAD.right;
  const H   = height - PAD.top  - PAD.bottom;
  const barW = W / states.length;

  return (
    <svg width={width} height={height}>
      <rect x={PAD.left} y={PAD.top} width={W} height={H}
        fill="#060f1e" rx={4} />
      {states.map((s, i) => {
        const val = (snapshot as any)[s.key] ?? 0;
        const bH  = val * H;
        const bX  = PAD.left + i * barW + 2;
        const bY  = PAD.top + H - bH;
        return (
          <g key={s.key}>
            <rect x={bX} y={bY} width={barW - 4} height={bH}
              fill={s.color} opacity={0.75} rx={2} />
            <text x={bX + (barW - 4) / 2} y={PAD.top + H + 14}
              fill="#64748b" fontSize={7} textAnchor="middle">
              {s.label.slice(0, 4)}
            </text>
            {val > 0.05 && (
              <text x={bX + (barW - 4) / 2} y={bY - 2}
                fill={s.color} fontSize={7} textAnchor="middle">
                {(val * 100).toFixed(0)}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Main Component | المكون الرئيسي ────────────────────────

export default function ReportModal({ data, aiConfig, onClose }: ReportModalProps) {
  const { t, locale } = useTranslation();
  const [aiSummary,    setAiSummary]    = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError,     setGenError]     = useState('');
  const [activeChart,  setActiveChart]  = useState<'overview' | 'stability' | 'influence' | 'states'>('overview');
  const [localProvider, setLocalProvider] = useState<AIConfig['provider']>(aiConfig.provider);
  
  // Time Range Selection
  const [startTick, setStartTick] = useState<number>(data.snapshots[0]?.tick || 0);
  const [endTick, setEndTick] = useState<number>(data.totalTicks);

  const printRef = useRef<HTMLDivElement>(null);

  const snapshots = data.snapshots.filter(s => s.tick >= startTick && s.tick <= endTick);
  const first = snapshots[0];
  const last  = snapshots[snapshots.length - 1];

  // ── Chart Groups | مجموعات الرسومات ──
  const CHART_GROUPS: Record<string, string[]> = {
    overview:  ['polarization', 'cohesion', 'health_score'],
    stability: ['echo_density', 'narrative_volatility', 'memetic_velocity'],
    influence: ['elite_dominance', 'algorithmic_capture', 'resistance_strength'],
  };

  // ── Generate AI Summary | توليد ملخص AI ──
  const generateSummary = async () => {
    if (!last) return;
    setIsGenerating(true);
    setGenError('');
    setAiSummary('');

    // Fetch deep inspection data dynamically using the ledger system
    let deepInspectionLog = '';
    try {
        const { DeepInspection } = await import('../simulation/research/DeepInspection');
        const anomalies = DeepInspection.inspectAnomalies(startTick, endTick);
        deepInspectionLog = `\nDEEP INSPECTION LOG:\n${anomalies}\n`;
    } catch(e) {
        console.error(e);
    }

    const LOCALE_NAMES: Record<string, string> = {
      ar: 'Arabic', en: 'English', pt: 'Portuguese', de: 'German', fa: 'Persian',
      ru: 'Russian', tr: 'Turkish', zh: 'Chinese', hi: 'Hindi'
    };
    const aiLanguage = LOCALE_NAMES[locale] || 'English';

    const prompt = `You are a political sociologist and expert academic researcher in the dynamics of societies and complex systems.
Please write a rigorous and eloquent academic report (3-4 paragraphs) in ${aiLanguage} analyzing the results of a virtual society simulation.
Your response must not contain any poor literal translation; use precise academic terminology. Do not use JSON formatting.

Simulation parameters (from tick ${startTick} to ${endTick}):
- Number of agents: ${data.agentCount} | Random seed: ${data.seed}
- Province: ${data.province ?? 'Not specified'} | AI invocations: ${data.aiCallCount}
- Active theories: ${data.theories.length > 0 ? data.theories.join(', ') : 'None'}
- External events: ${data.eventHistory && data.eventHistory.length > 0 ? data.eventHistory.filter(e => e.startTick >= startTick && e.startTick <= endTick).map(e => `${e.type} (tick ${e.startTick})`).join(', ') : 'None'}

Final metrics (ranges from 0.0 stability up to 1.0 extreme risk/collapse):
- Polarization: ${last.polarization.toFixed(3)}
- Social Cohesion: ${last.cohesion.toFixed(3)}
- Echo Chamber Density: ${last.echo_density.toFixed(3)}
- Narrative Volatility: ${last.narrative_volatility.toFixed(3)}
- Elite Dominance: ${last.elite_dominance.toFixed(3)}
- Resistance Strength: ${last.resistance_strength.toFixed(3)}
- Algorithmic Capture: ${last.algorithmic_capture.toFixed(3)}
- Health Score: ${last.health_score.toFixed(3)}

Agent Distribution:
- Moderate: ${(last.state_moderate * 100).toFixed(1)}% | Extremist: ${(last.state_extremist * 100).toFixed(1)}%
- Conservative: ${(last.state_conservative * 100).toFixed(1)}% | Liberal: ${(last.state_liberal * 100).toFixed(1)}%

Temporal patterns (from ${startTick} to ${endTick}):
- Polarization: ${first?.polarization.toFixed(3) ?? '?'} -> ${last.polarization.toFixed(3)}
- Cohesion: ${first?.cohesion.toFixed(3) ?? '?'} -> ${last.cohesion.toFixed(3)}
- Health Score: ${first?.health_score.toFixed(3) ?? '?'} -> ${last.health_score.toFixed(3)}

Write the report including:
1. A comprehensive evaluation of the society's trajectory based on the numbers.
2. A sociological interpretation of how external events or changes impacted society's stability.
3. A risk assessment for societal collapse based on polarization and echo chambers.
4. Academic recommendations for public policies (Policy Implications).`;

    try {
      const configOverride: AIConfig = { ...aiConfig, provider: localProvider };
      const systemInst = `You are a political sociologist and expert academic researcher. Respond strictly in ${aiLanguage} without JSON formatting.`;
      const result = await callAIText(prompt, configOverride, systemInst);
      setAiSummary(result);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : t.reportModal.genError);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate if the model is available | توليد تلقائي إذا توفر النموذج
  useEffect(() => {
    if (snapshots.length >= 2 && aiConfig.provider === 'ollama') {
      generateSummary();
    }
  }, []);

  // ── Export PDF via browser print | تصدير PDF عبر الطباعة ──
  const handlePrint = () => window.print();

  // ── Export JSON | تصدير JSON ──
  const handleExportJSON = () => {
    const payload = {
      metadata: {
        seed: data.seed, agentCount: data.agentCount,
        province: data.province, theories: data.theories,
        totalTicks: data.totalTicks, exportedAt: new Date().toISOString(),
      },
      summary: aiSummary,
      finalMetrics: last,
      snapshots,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `report_seed${data.seed}_t${data.totalTicks}.json`;
    a.click();
  };

  // ── Export CSV | تصدير CSV ──
  const handleExportCSV = () => {
    if (!snapshots.length) return;
    const headers = Object.keys(snapshots[0]).join(',');
    const rows = snapshots.map(s =>
      Object.values(s).map(v => (typeof v === 'number' ? v.toFixed(6) : v ?? '')).join(',')
    ).join('\n');
    const blob = new Blob([headers + '\n' + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `timeseries_seed${data.seed}_t${data.totalTicks}.csv`;
    a.click();
  };

  if (!last) return null;

  const healthColor = last.health_score > 0.6 ? '#4ade80' : last.health_score > 0.35 ? '#f59e0b' : '#ef4444';
  const delta = (key: keyof MetricsSnapshot) => {
    if (!first) return 0;
    return ((last[key] as number) - (first[key] as number));
  };
  const arrow = (d: number) => d > 0.01 ? '↑' : d < -0.01 ? '↓' : '→';
  const arrowColor = (d: number, inverted = false) =>
    (inverted ? d < 0 : d > 0) ? '#4ade80' : (inverted ? d > 0 : d < 0) ? '#ef4444' : '#64748b';

  return (
    <>
      {/* Separate print layer | طبقة طباعة منفصلة */}
      <style>{`
        @media print {
          body, html, #root, .app-container {
            background: white !important;
            height: auto !important;
            min-height: auto !important;
          }
          .app-header, .app-layout { 
            display: none !important; 
          }
          .report-print-root { 
            position: relative !important; 
            top: 0 !important;
            left: 0 !important;
            transform: none !important;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Background Overlay | طبقة خلفية */}
      <div className="no-print" style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        zIndex: 999,
      }} onClick={onClose} />

      {/* Modal Container | حاوية المودال */}
      <div className="report-print-root" style={{
        position: 'fixed', top: '2vh', left: '50%', transform: 'translateX(-50%)',
        width: 'min(96vw, 800px)', maxHeight: '96vh',
        background: '#070d1a',
        border: '1px solid #1e3a5f', borderRadius: 12,
        zIndex: 1000, overflowY: 'auto',
        animation: 'fadeIn 0.25s ease',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>

        {/* ── Report Header | رأس التقرير ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0a1628, #0f2847)',
          borderBottom: '1px solid #1e3a5f', padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#64748b', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
                {t.reportModal.subTitle}
              </div>
              <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: 18, fontWeight: 700 }}>
                {t.reportModal.mainTitle}
              </h2>
              <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>
                {t.reportModal.seed} {data.seed} · {data.agentCount} {t.reportModal.agentsCount} ·{data.province ? ` ${data.province} ·` : ''}
                <span style={{marginRight: 8}}>{t.reportModal.periodSelected}</span>
                <input 
                  type="number" 
                  value={startTick} 
                  onChange={e => setStartTick(Math.max(0, parseInt(e.target.value) || 0))} 
                  style={{ width: 50, background: '#1e293b', border: '1px solid #475569', color: '#fff', textAlign: 'center', borderRadius: 4, margin: '0 4px', fontSize: 10 }}
                />
                {t.reportModal.to}
                <input 
                  type="number" 
                  value={endTick} 
                  onChange={e => setEndTick(Math.max(startTick, Math.min(data.totalTicks, parseInt(e.target.value) || data.totalTicks)))} 
                  style={{ width: 50, background: '#1e293b', border: '1px solid #475569', color: '#fff', textAlign: 'center', borderRadius: 4, margin: '0 4px', fontSize: 10 }}
                />
              </div>
              {data.eventHistory && data.eventHistory.length > 0 && (
                <div style={{ color: '#f59e0b', fontSize: 10, marginTop: 4 }}>
                  أحداث محقونة في هذه الفترة: {data.eventHistory.filter(e => e.startTick >= startTick && e.startTick <= endTick).map(e => `${e.type} (دورة ${e.startTick})`).join('، ') || 'لا يوجد'}
                </div>
              )}
            </div>
            {/* Health Score circle | دائرة درجة الصحة */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                border: `3px solid ${healthColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                background: healthColor + '15',
                boxShadow: `0 0 20px ${healthColor}40`,
              }}>
                <div style={{ color: healthColor, fontSize: 16, fontWeight: 800 }}>
                  {(last.health_score * 100).toFixed(0)}
                </div>
                <div style={{ color: healthColor, fontSize: 8 }}>{t.reportModal.health}</div>
              </div>
            </div>
            {/* Close button | زر الإغلاق */}
            <button className="no-print" onClick={onClose} style={{
              background: 'none', border: 'none', color: '#475569',
              fontSize: 20, cursor: 'pointer', padding: '2px 6px', marginTop: -4,
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>

          {/* ── Key Metrics | مقاييس رئيسية ── */}
          <div style={{ marginBottom: 16 }}>
            <SectionTitle>📊 {t.reportModal.keyMetrics}</SectionTitle>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8,
            }}>
              {([
                { key: 'polarization',        label: t.metrics.names.polarization,          inv: false },
                { key: 'cohesion',            label: t.metrics.names.cohesion,            inv: true  },
                { key: 'echo_density',        label: 'غرف الصدى',          inv: false },
                { key: 'narrative_volatility',label: t.metrics.names.narrativeVolatility,      inv: false },
                { key: 'elite_dominance',     label: t.metrics.names.eliteDominance,       inv: false },
                { key: 'resistance_strength', label: t.metrics.names.resistanceStrength,           inv: true  },
                { key: 'gini_coefficient',    label: 'معامل جيني',         inv: false },
                { key: 'shannon_entropy',     label: 'إنتروبيا شانون',     inv: true  },
              ] as { key: keyof MetricsSnapshot; label: string; inv: boolean }[]).map(({ key, label, inv }) => {
                const val = last[key] as number;
                const d   = delta(key);
                const col = METRIC_COLORS[key as string] ?? '#60a5fa';
                return (
                  <div key={key} style={{
                    background: '#0a1628', border: '1px solid #1e3a5f',
                    borderRadius: 8, padding: '8px 10px',
                  }}>
                    <div style={{ color: '#64748b', fontSize: 9, marginBottom: 4 }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ color: col, fontSize: 18, fontWeight: 800, fontFamily: 'monospace' }}>
                        {(val * 100).toFixed(1)}%
                      </span>
                      <span style={{ color: arrowColor(d, inv), fontSize: 10 }}>
                        {arrow(d)} {Math.abs(d * 100).toFixed(1)}
                      </span>
                    </div>
                    {/* Progress bar | شريط التقدم */}
                    <div style={{ height: 3, background: '#1e3a5f', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${val * 100}%`, background: col, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Charts Section | قسم الرسوم البيانية ── */}
          {snapshots.length >= 2 && (
            <div style={{ marginBottom: 16 }}>
              <SectionTitle>📈 {t.reportModal.timeline}</SectionTitle>

              {/* Chart tabs | تبويبات الرسوم */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }} className="no-print">
                {(['overview', 'stability', 'influence', 'states'] as const).map(g => (
                  <button key={g} onClick={() => setActiveChart(g)} style={{
                    padding: '4px 10px', borderRadius: 5, fontSize: 10,
                    background: activeChart === g ? '#1e3a5f' : 'none',
                    color: activeChart === g ? '#93c5fd' : '#475569',
                    border: `1px solid ${activeChart === g ? '#60a5fa' : '#1e3a5f'}`,
                    cursor: 'pointer',
                  }}>
                    {g === 'overview'  ? '🌐 عام' :
                     g === 'stability' ? '🌀 استقرار' :
                     g === 'influence' ? '⚡ تأثير' : '👥 حالات'}
                  </button>
                ))}
              </div>

              {/* Chart canvas | منطقة الرسم */}
              <div style={{
                background: '#060f1e', border: '1px solid #1e3a5f',
                borderRadius: 8, padding: '8px', overflowX: 'auto',
              }}>
                {activeChart === 'states' ? (
                  <>
                    <div style={{ color: '#475569', fontSize: 9, marginBottom: 4 }}>{t.reportModal.stateDistribution}</div>
                    <StateBarChart snapshot={last} width={700} height={110} />
                  </>
                ) : (
                  <>
                    <LineChart
                      snapshots={snapshots}
                      metrics={CHART_GROUPS[activeChart]}
                      width={700} height={160}
                    />
                    {/* Color legend | مفتاح الألوان */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', paddingRight: 38 }}>
                      {CHART_GROUPS[activeChart].map(m => (
                        <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 16, height: 2, background: METRIC_COLORS[m] }} />
                          <span style={{ color: '#64748b', fontSize: 9 }}>{getMetricLabels(t)[m]}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── State Distribution ── */}
          <div style={{ marginBottom: 16 }}>
            <SectionTitle>👥 {t.reportModal.stateDistribution}</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {([
                ['state_moderate', t.reportModal.shortStates.moderate, '#4ade80'],
                ['state_extremist', t.reportModal.shortStates.extremist, '#ef4444'],
                ['state_conservative', t.reportModal.shortStates.conservative, '#f59e0b'],
                ['state_liberal', t.reportModal.shortStates.liberal, '#60a5fa'],
                ['state_positiveInfluencer', t.reportModal.shortStates.positiveInfluencer, '#10b981'],
                ['state_negativeInfluencer', t.reportModal.shortStates.negativeInfluencer, '#f97316'],
                ['state_resistant', t.reportModal.shortStates.resistant, '#84cc16'],
                ['state_gullible', t.reportModal.shortStates.gullible, '#a855f7'],
                ['state_activist', t.reportModal.shortStates.activist, '#06b6d4'],
                ['state_isolated', t.reportModal.shortStates.isolated, '#475569'],
              ] as [string, string, string][]).map(([key, label, color]) => {
                const val = (last as any)[key] as number;
                return (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: '#0a1628', border: '1px solid #1e3a5f',
                    borderRadius: 6, padding: '4px 8px', minWidth: 100,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ color: '#94a3b8', fontSize: 10 }}>{label}</span>
                    <span style={{ color, fontSize: 11, fontWeight: 700, marginLeft: 'auto' }}>
                      {(val * 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── AI Academic Summary | ملخص الذكاء الاصطناعي ── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <SectionTitle>🤖 {t.reportModal.aiSummaryTitle}</SectionTitle>
              <select 
                value={localProvider} 
                onChange={e => setLocalProvider(e.target.value as AIConfig['provider'])}
                style={{
                  background: '#0a1628', color: '#f8fafc', border: '1px solid #1e3a5f',
                  borderRadius: 4, padding: '2px 6px', fontSize: 11, outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="none">بدون ذكاء اصطناعي</option>
                <option value="gemini">Gemini</option>
                <option value="openrouter">OpenRouter</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI</option>
                <option value="groq">Groq</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="custom">Custom Endpoint</option>
              </select>
              {(aiSummary || genError) && (
                <button className="no-print" onClick={generateSummary} disabled={isGenerating}
                  style={{
                    fontSize: 9, padding: '2px 8px', borderRadius: 4, marginRight: 'auto',
                    background: '#0a1628', color: '#60a5fa', border: '1px solid #1e3a5f', cursor: 'pointer',
                  }}>
                  {isGenerating ? '⏳' : '🔄 {t.reportModal.regenerate}'}
                </button>
              )}
            </div>

            <div style={{
              background: '#0a1628', border: '1px solid #1e3a5f',
              borderRadius: 8, padding: 12, minHeight: 80,
            }}>
              {isGenerating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa', fontSize: 12 }}>
                  <Spinner />
                  <span>{t.reportModal.generatingAI} ({aiConfig.ollamaModel})</span>
                </div>
              ) : genError ? (
                <div>
                  <div style={{ color: '#f87171', fontSize: 11, marginBottom: 6 }}>✗ {genError}</div>
                  <button onClick={generateSummary} style={{
                    fontSize: 10, padding: '3px 10px', borderRadius: 4,
                    background: '#14532d', color: '#4ade80', border: '1px solid #4ade80', cursor: 'pointer',
                  }}>إعادة المحاولة</button>
                </div>
              ) : aiSummary ? (
                <div style={{
                  color: '#cbd5e1', fontSize: 12, lineHeight: 1.9,
                  direction: 'rtl', textAlign: 'right',
                  whiteSpace: 'pre-wrap',
                }}>
                  {aiSummary}
                </div>
              ) : (
                <div style={{ color: '#334155', fontSize: 11, textAlign: 'center', padding: '12px 0' }}>
                  <div>لم يتم توليد الملخص بعد</div>
                  <button onClick={generateSummary} style={{
                    marginTop: 8, fontSize: 10, padding: '4px 12px', borderRadius: 5,
                    background: '#14532d', color: '#4ade80', border: '1px solid #4ade80', cursor: 'pointer',
                  }}>توليد الملخص الآن</button>
                </div>
              )}
            </div>

            {aiSummary && (
              <div style={{ color: '#334155', fontSize: 9, marginTop: 4 }}>
                نُوِّلد بواسطة {aiConfig.ollamaModel} · {new Date().toLocaleString('ar-IQ')}
              </div>
            )}
          </div>

          {/* ── Export Buttons | أزرار التصدير ── */}
          <div className="no-print" style={{
            display: 'flex', gap: 8, paddingTop: 12,
            borderTop: '1px solid #1e3a5f', flexWrap: 'wrap',
          }}>
            <ExportBtn
              label="📄 PDF (طباعة)"
              color="#60a5fa"
              onClick={handlePrint}
            />
            <ExportBtn
              label="📦 JSON"
              color="#4ade80"
              onClick={handleExportJSON}
            />
            <ExportBtn
              label="📊 CSV"
              color="#f59e0b"
              onClick={handleExportCSV}
            />
          </div>

        </div>
      </div>
    </>
  );
}

// ── Helper Components | مكونات مساعدة ─────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div style={{
      color: '#93c5fd', fontSize: 11, fontWeight: 700,
      marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {children}
    </div>
  );
}

function ExportBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 7, border: `1px solid ${color}`,
      background: color + '15', color, fontSize: 11, fontWeight: 600,
      cursor: 'pointer', transition: 'all 0.2s',
    }}
    onMouseEnter={e => { (e.target as HTMLElement).style.background = color + '30'; }}
    onMouseLeave={e => { (e.target as HTMLElement).style.background = color + '15'; }}>
      {label}
    </button>
  );
}
