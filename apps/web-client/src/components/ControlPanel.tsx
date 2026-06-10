import { useTranslation } from '../i18n';
import type { TheoryKey, AgentStateKey } from '../i18n/types';
import { THEORY_TACTIC_COUNT, AGENT_STATE_ORDER, THEORY_DEFAULT_INTENSITY, intensityLabel, intensityColor } from '../i18n/types';
import { dominantEmotion } from '../types/agent';
import type { SimEvent } from '../simulation/eventSystem';
import { THEORY_DOCS } from '../i18n/theoryDocs';
import { useState as useLocalState } from 'react';

interface TheoryInfo { key: TheoryKey; name: string; enabled: boolean; intensity?: number; }
interface AgentStateStats { state: AgentStateKey; count: number; percentage: number; }
type EventCategory = 'political'|'economic'|'cultural'|'informational';

interface ControlPanelProps {
  isRunning: boolean; tick: number; agentCount: number;
  theories: TheoryInfo[]; subtactics: Record<TheoryKey, boolean[]>;
  agentStateStats: AgentStateStats[]; agentStateCounts?: Record<string, number>;
  simSpeed: number; events: SimEvent[]; activeEventIds: Set<string>;
  agentTraits: any[]; metrics?: Record<string, number>;
  onStart: () => void; onPause: () => void; onReset: () => void;
  onToggleTheory: (key: TheoryKey, enabled: boolean) => void;
  onToggleSubtactic: (theoryKey: TheoryKey, index: number, enabled: boolean) => void;
  onSetTheoryIntensity: (key: TheoryKey, intensity: number) => void;
  onSetAgentCount: (count: number) => void; onSetSpeed: (speed: number) => void;
  onTriggerEvent: (cat: EventCategory, duration?: number) => void;
  onExportAllAgents?: () => void;
  onExportInjectedAgents?: () => void;
  onExportAgentSummary?: () => void;
  province?: string;
  onSetProvince?: (p: string) => void;
}

const AGENT_STATE_COLORS: Record<AgentStateKey, string> = {
  extremist: '#ff4444', conservative: '#e17055', moderate: '#74b9ff',
  liberal: '#55efc4', positiveInfluencer: '#ffeaa7', negativeInfluencer: '#6c5ce7',
  resistant: '#00b894', gullible: '#fdcb6e', activist: '#fd79a8', isolated: '#636e72',
};

const EVENT_CATEGORY_LABELS: Record<EventCategory, 'triggerPolitical'|'triggerEconomic'|'triggerCultural'|'triggerInformational'> = {
  political: 'triggerPolitical', economic: 'triggerEconomic', cultural: 'triggerCultural', informational: 'triggerInformational',
};

const EMOTIONAL_ICONS: Record<string, string> = {
  calm: '😌', anxious: '😰', angry: '😡', hopeful: '🤩', fearful: '😨', neutral: '😐',
};

const EMOTIONAL_COLORS: Record<string, string> = {
  calm: '#55efc4', anxious: '#ffeaa7', angry: '#ff6b6b', hopeful: '#74b9ff', fearful: '#a29bfe', neutral: '#636e72',
};

function getStateAbbr(full: string): string {
  const i = full.indexOf('–');
  return i > 0 ? full.substring(0, i).trim() : full;
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ControlPanel({
  isRunning, tick, agentCount, theories, subtactics, agentStateStats, agentStateCounts, simSpeed,
  events, activeEventIds, agentTraits, metrics,
  onStart, onPause, onReset, onToggleTheory, onToggleSubtactic, onSetTheoryIntensity,
  onSetAgentCount, onSetSpeed, onTriggerEvent,
  onExportAllAgents, onExportInjectedAgents, onExportAgentSummary,
  province, onSetProvince
}: ControlPanelProps) {
  const { t, locale } = useTranslation();
  const enabledTheoryKeys = theories.filter(th => th.enabled).map(th => th.key);
  const [activeTheoryDoc, setActiveTheoryDoc] = useLocalState<TheoryKey | null>(null);
  const [eventDuration, setEventDuration] = useLocalState<number>(300);

  // ── تحذيرات التعارض ──
  interface ConflictWarning { newKey: TheoryKey; conflictsWith: TheoryKey[]; dismissed: boolean; }
  const [conflicts, setConflicts] = useLocalState<ConflictWarning[]>([]);

  // Handler يتحقق من التعارضات قبل التفعيل
  const handleToggleTheory = (key: TheoryKey, enabled: boolean) => {
    if (enabled) {
      const doc = THEORY_DOCS[key];
      const incompatible = doc?.incompatibleWith ?? [];
      // تحقق: هل هناك نظريات مُفعَّلة تتعارض مع الجديدة
      const activeConflicts: TheoryKey[] = [
        // 1. الجديدة في قائمة تعارض المفعَّلة
        ...enabledTheoryKeys.filter(k => (incompatible as string[]).includes(k)),
        // 2. المفعَّلة في قائمة تعارض غيرها
        ...enabledTheoryKeys.filter(k => (THEORY_DOCS[k]?.incompatibleWith ?? []).includes(key)),
      ].filter((v, i, a) => a.indexOf(v) === i); // unique

      if (activeConflicts.length > 0) {
        setConflicts(prev => [
          // أزل أي تحذير سابق لنفس النظرية ثم أضف الجديد
          ...prev.filter(c => c.newKey !== key),
          { newKey: key, conflictsWith: activeConflicts, dismissed: false },
        ]);
      } else {
        // لا تعارض: أزل أي تحذير سابق لها
        setConflicts(prev => prev.filter(c => c.newKey !== key));
      }
    } else {
      // عند التعطيل: أزل التحذير الخاص بها
      setConflicts(prev => prev.filter(c => c.newKey !== key && !c.conflictsWith.includes(key)));
    }
    onToggleTheory(key, enabled);
  };

  // التحذيرات غير المطرودة
  const activeConflictWarnings = conflicts.filter(c => !c.dismissed);

  // BUG #1 FIX: Use dominantEmotion() to convert EmotionalState object to string key
  const emotionalCounts: Record<string, number> = {};
  for (const a of agentTraits) {
    // FIX: Extract emotion string from the EmotionalState object using the imported dominantEmotion
    const key = dominantEmotion(a.emotionalState);
    emotionalCounts[key] = (emotionalCounts[key] || 0) + 1;
  }

  const handleExportJSON = () => {
    const data = {
      tick,
      agentCount,
      timestamp: new Date().toISOString(),
      agentStateDistribution: agentStateCounts,
      agentStateStats,
      metrics: metrics || {},
      emotionalDistribution: emotionalCounts,
      totalEmotionalCounts: Object.values(emotionalCounts).reduce((s, c) => s + c, 0),
      activeTheories: theories.filter(th => th.enabled).map(th => ({
        key: th.key,
        name: th.name,
        activeSubtactics: subtactics[th.key]?.filter(Boolean).length ?? 0,
      })),
      subtacticConfig: Object.fromEntries(
        Object.entries(subtactics).map(([k, v]) => [k, v.map(Boolean)])
      ),
      activeEvents: events.filter(ev => ev.remainingTicks > 0).map(ev => ({
        id: ev.id,
        name: ev.name,
        category: ev.type,
        remainingTicks: ev.remainingTicks,
      })),
      emotionalCounts,
    };
    downloadFile(`simulation_tick_${tick}.json`, JSON.stringify(data, null, 2), 'application/json');
  };

  const handleExportCSV = () => {
    let csv = '';
    csv += `"Simulation Export - Tick ${tick}"\n`;
    csv += `"Timestamp","${new Date().toISOString()}"\n`;
    csv += `"Agent Count",${agentCount}\n\n`;
    csv += `"--- METRICS ---"\n`;
    csv += `"Metric","Value"\n`;
    if (metrics) {
      for (const [key, val] of Object.entries(metrics)) {
        csv += `"${key}",${val}\n`;
      }
    }
    csv += `\n`;
    csv += `"--- AGENT STATES ---"\n`;
    csv += `"State","Count","Percentage"\n`;
    for (const s of agentStateStats) {
      csv += `"${s.state}",${s.count},${s.percentage.toFixed(1)}%\n`;
    }
    csv += `\n`;
    csv += `"--- EMOTIONAL DISTRIBUTION ---"\n`;
    csv += `"Emotion","Count"\n`;
    for (const [emotion, count] of Object.entries(emotionalCounts)) {
      csv += `"${emotion}",${count}\n`;
    }
    csv += `\n`;
    csv += `"--- ACTIVE THEORIES ---"\n`;
    csv += `"Theory","Active Subtactics"\n`;
    for (const th of theories.filter(th => th.enabled)) {
      const n = subtactics[th.key]?.filter(Boolean).length ?? 0;
      csv += `"${th.name}",${n}\n`;
    }
    downloadFile(`simulation_tick_${tick}.csv`, csv, 'text/csv');
  };

  const handleExportSummary = () => {
    const sep = '═══════════════════════════════════════════════\n';
    let txt = `🧪 SOFT POWER LAB - SIMULATION SUMMARY\n`;
    txt += `${sep}`;
    txt += `Tick:        ${tick}\n`;
    txt += `Agents:      ${agentCount}\n`;
    txt += `Timestamp:   ${new Date().toISOString()}\n\n`;

    txt += `📊 METRICS\n${sep}`;
    if (metrics) {
      for (const [key, val] of Object.entries(metrics)) {
        const bar = '█'.repeat(Math.round((val as number) * 20));
        const pct = ((val as number) * 100).toFixed(1);
        txt += `  ${key.padEnd(28)} ${pct}% ${bar}\n`;
      }
    }

    txt += `\n👥 AGENT STATES\n${sep}`;
    for (const s of agentStateStats) {
      const bar = '█'.repeat(Math.round(s.percentage / 5));
      txt += `  ${(s.state + ' ').padEnd(22)} ${String(s.count).padStart(4)} (${s.percentage.toFixed(1)}%) ${bar}\n`;
    }

    txt += `\n🎭 EMOTIONAL STATE\n${sep}`;
    const totalEmo = Object.values(emotionalCounts).reduce((s, c) => s + c, 0) || 1;
    for (const [emotion, count] of Object.entries(emotionalCounts)) {
      const pct = (count as number) / totalEmo * 100;
      const bar = '█'.repeat(Math.round(pct / 5));
      txt += `  ${(emotion + ' ').padEnd(22)} ${String(count).padStart(4)} (${pct.toFixed(1)}%) ${bar}\n`;
    }

    txt += `\n⚙️ ACTIVE THEORIES\n${sep}`;
    for (const th of theories.filter(th => th.enabled)) {
      txt += `  ✅ ${th.name}\n`;
    }

    txt += `\n📅 ACTIVE EVENTS\n${sep}`;
    const active = events.filter(ev => ev.remainingTicks > 0);
    if (active.length === 0) {
      txt += `  No active events\n`;
    } else {
      for (const ev of active) {
        txt += `  🟢 ${ev.name} (${ev.remainingTicks} ticks remaining)\n`;
      }
    }

    downloadFile(`simulation_summary_${tick}.txt`, txt, 'text/plain');
  };

  return (
    <div className="control-panel">
      <section className="control-section">
        <h3>{t.controls.simulationControl}</h3>
        <div className="control-buttons">
          <button onClick={onStart} disabled={isRunning} className="btn btn-primary">{t.controls.start}</button>
          <button onClick={onPause} disabled={!isRunning} className="btn btn-warning">{isRunning ? t.controls.pause : t.controls.paused}</button>
          <button onClick={onReset} className="btn btn-danger">{t.controls.reset}</button>
        </div>
        <div className="tick-display">
          <span>{t.controls.tick}: {tick.toLocaleString()}</span>
          <span>{t.controls.agents}: {agentCount}</span>
          <span>{t.controls.status}: {isRunning ? t.controls.running : t.controls.stopped}</span>
        </div>
      </section>

      {/* External Events */}
      <section className="control-section events-section">
        <h3>{t.events.title}</h3>
        <p className="section-hint">{t.events.hint}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>مدة التأثير (دورات):</span>
          <input 
            type="number" min={10} step={10}
            value={eventDuration}
            onChange={e => setEventDuration(Math.max(10, parseInt(e.target.value) || 300))}
            style={{
              width: 80, background: '#0a1628', color: '#e2e8f0',
              border: '1px solid #1e3a5f', borderRadius: 4, padding: '4px 8px', fontSize: 12,
            }}
          />
        </div>
        <div className="event-trigger-buttons">
          {(['political','economic','cultural','informational'] as EventCategory[]).map(cat => (
            <button key={cat} className="btn btn-event" disabled={!isRunning} onClick={() => onTriggerEvent(cat, eventDuration)}>
              {t.events[EVENT_CATEGORY_LABELS[cat]]}
            </button>
          ))}
        </div>
        {events.length > 0 && (
          <div className="active-events">
            {events.map(ev => {
              const isActive = ev.remainingTicks > 0;
              const remaining = ev.remainingTicks;
              const evName = (t.events.names as any)[ev.name] || ev.name;
              return (
                <div key={ev.id} className={`event-item ${isActive ? 'event-active' : 'event-pending'}`}>
                  <span>{evName}</span>
                  <span className="event-status">{isActive ? `🟢 ${t.events.activeLabel} (${remaining})` : `⏳ ${t.events.pendingLabel} ${remaining}`}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Emotional States */}
      {isRunning && agentTraits.length > 0 && (
        <section className="control-section emotional-section">
          <h3>{t.emotional.title}</h3>
          <div className="emotional-bars">
            {(['calm','anxious','angry','hopeful','fearful','neutral'] as const).map(es => {
              const c = emotionalCounts[es] || 0;
              const pct = agentTraits.length > 0 ? (c / agentTraits.length * 100).toFixed(1) : '0.0';
              const labelKey = es as keyof typeof t.emotional;
              return (
                <div key={es} className="emotional-row">
                  <span>{EMOTIONAL_ICONS[es]} {t.emotional[labelKey]}</span>
                  <div className="metric-track"><div className="metric-fill" style={{width:`${Math.min(parseFloat(pct),100)}%`,backgroundColor:EMOTIONAL_COLORS[es]}}/></div>
                  <span className="event-status">{c} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="control-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{t.theories.title}</h3>
          <button 
            onClick={() => {
              theories.forEach(th => {
                if (THEORY_DEFAULT_INTENSITY[th.key] !== undefined) {
                  onSetTheoryIntensity(th.key, THEORY_DEFAULT_INTENSITY[th.key]);
                }
              });
            }}
            style={{
              background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1',
              padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
            }}
            title="استعادة القيم التلقائية للشدة المعتمدة على المصادر"
          >
            استعادة الضبط التلقائي
          </button>
        </div>
        <p className="section-hint">{t.theories.hint}</p>

        {/* نافذة توثيق النظرية */}
        {activeTheoryDoc && (() => {
          const doc = THEORY_DOCS[activeTheoryDoc];
          return (
            <div style={{
              background: '#0f172a', border: '1px solid #1e3a5f',
              borderRadius: 8, padding: 10, marginBottom: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: '#60a5fa', fontSize: 12, fontWeight: 700 }}>{doc.name[locale] || doc.nameEn}</span>
                <button onClick={() => setActiveTheoryDoc(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, lineHeight: 1.5 }}>
                <strong style={{ color: '#38bdf8' }}>📌 {t.theories.whenToUse}</strong><br />{doc.whenToUse[locale] || doc.whenToUse['en']}
              </p>
              <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, lineHeight: 1.5 }}>
                <strong style={{ color: '#34d399' }}>🎯 {t.theories.affects}</strong> {doc.affects.join(' · ')}
              </p>
              <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, lineHeight: 1.5 }}>
                <strong style={{ color: '#fbbf24' }}>📍 {t.theories.example}</strong> {doc.scenario[locale] || doc.scenario['en']}
              </p>
              <p style={{ color: '#475569', fontSize: 10, fontStyle: 'italic' }}>📚 {doc.ref}</p>
              {doc.incompatibleWith && doc.incompatibleWith.length > 0 && (
                <p style={{ color: '#ef4444', fontSize: 10, marginTop: 4 }}>
                  ⚠️ {t.theories.incompatibleWith} {doc.incompatibleWith.map(k => THEORY_DOCS[k]?.name[locale] || THEORY_DOCS[k]?.nameEn || k).join(', ')}
                </p>
              )}
            </div>
          );
        })()}

        {/* ── تحذيرات التعارض (dismissible) ── */}
        {activeConflictWarnings.map(w => (
          <div key={w.newKey} style={{
            background: '#451a03', border: '1px solid #f59e0b',
            borderRadius: 7, padding: '8px 10px', marginBottom: 8,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 14, lineHeight: 1.3, flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
                {t.theories.conflictWarning}
              </div>
              <div style={{ color: '#fde68a', fontSize: 10, lineHeight: 1.5 }}>
                <strong style={{ color: '#fbbf24' }}>
                  {THEORY_DOCS[w.newKey]?.name[locale] ?? THEORY_DOCS[w.newKey]?.nameEn ?? w.newKey}
                </strong>
                {` ${t.theories.notRecommendedWith} `}
                {w.conflictsWith.map((k, i) => (
                  <span key={k}>
                    {i > 0 ? ` ${t.theories.and} ` : ''}
                    <strong style={{ color: '#fb923c' }}>
                      {THEORY_DOCS[k]?.name[locale] ?? THEORY_DOCS[k]?.nameEn ?? k}
                    </strong>
                  </span>
                ))}
                {` ${t.theories.conflictConsequence}`}
              </div>
              <div style={{ color: '#78350f', fontSize: 9, marginTop: 3, fontStyle: 'italic' }}>
                {t.theories.conflictDisclaimer}
              </div>
            </div>
            <button
              onClick={() => setConflicts(prev => prev.map(c =>
                c.newKey === w.newKey ? { ...c, dismissed: true } : c
              ))}
              title={t.theories.closeWarning}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#92400e', fontSize: 14, padding: '0 2px',
                lineHeight: 1, flexShrink: 0,
              }}
            >×</button>
          </div>
        ))}

        <div className="theory-list">
          {theories.map(theory => {
            const ix = theory.intensity ?? THEORY_DEFAULT_INTENSITY[theory.key] ?? 0.5;
            const iColor = intensityColor(ix);
            const iLabel = intensityLabel(ix);
            const localizedLabel = t.theories.intensityLevels[iLabel];
            const defaultIx = THEORY_DEFAULT_INTENSITY[theory.key] ?? 0.5;
            // هل هذه النظرية مذكورة في تحذير غير مطرود;
            const hasConflict = activeConflictWarnings.some(
              w => w.newKey === theory.key || w.conflictsWith.includes(theory.key)
            );
            return (
              <div key={theory.key} style={{ marginBottom: 6 }}>
                <label className="theory-item" style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  opacity: hasConflict ? 0.85 : 1,
                  outline: hasConflict && theory.enabled ? '1px solid #f59e0b44' : 'none',
                  borderRadius: 4,
                }}>
                  <input type="checkbox" checked={theory.enabled} onChange={(e) => handleToggleTheory(theory.key, e.target.checked)} />
                  <span className="theory-name">{theory.name}</span>
                  <span className="theory-tactic-count">({THEORY_TACTIC_COUNT[theory.key]})</span>
                  {hasConflict && theory.enabled && (
                    <span style={{
                      fontSize: 10, color: '#f59e0b',
                      lineHeight: 1, flexShrink: 0,
                    }} title={t.theories.conflictTooltip}>⚡</span>
                  )}
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: iColor,
                    background: iColor + '22', borderRadius: 4,
                    padding: '1px 5px', marginLeft: 2,
                  }}>{localizedLabel}</span>
                  <button
                    onClick={e => { e.preventDefault(); setActiveTheoryDoc(activeTheoryDoc === theory.key ? null : theory.key); }}
                    title={t.theories.infoTooltip}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: activeTheoryDoc === theory.key ? '#60a5fa' : '#475569',
                      fontSize: 13, padding: '0 2px', lineHeight: 1, marginLeft: 'auto',
                    }}
                  >ℹ</button>
                </label>
                {theory.enabled && (
                  <div style={{ padding: '4px 4px 0 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="range" min={0} max={1} step={0.01}
                        value={ix}
                        onChange={e => onSetTheoryIntensity(theory.key, parseFloat(e.target.value))}
                        style={{ flex: 1, accentColor: iColor, height: 3 }}
                        title={`${t.theories.intensityTooltip} ${(ix * 100).toFixed(0)}%`}
                      />
                      <span style={{ color: iColor, fontSize: 10, fontWeight: 700, width: 28, textAlign: 'right' }}>
                        {(ix * 100).toFixed(0)}%
                      </span>
                    </div>
                    {/* نقطة مرجعية: القيمة التجريبية */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <div style={{
                        width: `${defaultIx * 100}%`, height: 1,
                        background: '#334155', position: 'relative',
                      }}>
                        <div style={{
                          position: 'absolute', right: -1, top: -2,
                          width: 2, height: 5, background: '#64748b',
                          borderRadius: 1,
                        }} />
                      </div>
                      <span style={{ color: '#475569', fontSize: 9 }}>
                        {t.theories.empiricalRef.replace('{0}', (defaultIx * 100).toFixed(0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {enabledTheoryKeys.length > 0 && (
        <section className="control-section subtactics-section">
          <h3>{t.theories.headerSubtactics}</h3>
          <div className="subtactics-list">
            {enabledTheoryKeys.map(key => (
              <div key={key} className="subtactic-group">
                <div className="subtactic-theory-title">{t.theories.names[key]}</div>
                <div className="subtactic-checkboxes">
                  {t.theories.subtactics[key].map((tac, i) => {
                    const checked = subtactics[key]?.[i] ?? true;
                    return (
                      <label key={i} className="subtactic-toggle">
                        <input type="checkbox" checked={checked} onChange={(e) => onToggleSubtactic(key, i, e.target.checked)} />
                        <span>{tac}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="control-section">
        <h3>{t.params.title}</h3>
        <div className="parameter-control">
          {onSetProvince && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {t.params.region}: 
              <input 
                type="text" 
                value={province ?? ''} 
                onChange={(e) => onSetProvince(e.target.value)} 
                disabled={isRunning}
                style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}
                placeholder={t.params.regionPlaceholder}
              />
            </label>
          )}
          <label style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span>{t.params.agentCount}: <strong className="param-value">{agentCount.toLocaleString()}</strong></span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
              <input
                type="range"
                min="10"
                max="10000"
                step={agentCount < 500 ? 10 : agentCount < 2000 ? 50 : 100}
                value={agentCount}
                disabled={isRunning}
                onChange={(e) => onSetAgentCount(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <input
                type="number"
                min="10"
                max="10000"
                step="10"
                value={agentCount}
                disabled={isRunning}
                onChange={(e) => {
                  const v = Math.max(10, Math.min(10000, parseInt(e.target.value) || 10));
                  onSetAgentCount(v);
                }}
                style={{
                  width: 72, background: 'var(--surface-color)', border: '1px solid var(--border-color)',
                  color: '#fff', padding: '3px 6px', borderRadius: 4, fontSize: 13, textAlign: 'center'
                }}
              />
            </div>
            {agentCount > 2000 && (
              <span style={{ fontSize: 11, color: '#f59e0b' }}>
                ⚠️ {agentCount.toLocaleString()} {t.params.agentLimitWarning}
              </span>
            )}
          </label>
          <label>{t.params.simSpeed}: <select value={simSpeed} onChange={(e) => onSetSpeed(parseInt(e.target.value))}><option value="500">{t.params.speedOptions.slow}</option><option value="100">{t.params.speedOptions.normal}</option><option value="50">{t.params.speedOptions.fast}</option><option value="10">{t.params.speedOptions.turbo}</option></select></label>
          <label>{t.params.speedPreset}: <select value={simSpeed===500?'slow':simSpeed===100?'normal':simSpeed===50?'fast':'turbo'} onChange={(e)=>{const m:Record<string,number>={slow:500,normal:100,fast:50,turbo:10};onSetSpeed(m[e.target.value]||100);}}><option value="slow">{t.params.speedOptions.slow}</option><option value="normal">{t.params.speedOptions.normal}</option><option value="fast">{t.params.speedOptions.fast}</option><option value="turbo">{t.params.speedOptions.turbo}</option></select></label>
        </div>
      </section>

      <section className="control-section">
        <h3>{t.export.title}</h3>
        <div className="export-buttons">
          <button className="btn btn-secondary" onClick={handleExportJSON}>{t.export.exportJson}</button>
          <button className="btn btn-secondary" onClick={handleExportCSV}>{t.export.exportCsv}</button>
          <button className="btn btn-secondary" onClick={handleExportSummary}>{t.export.exportSummary}</button>
        </div>
        <div className="export-buttons" style={{ marginTop: 6 }}>
          {onExportAllAgents && (
            <button className="btn btn-agent-export" onClick={onExportAllAgents} title={t.export.allAgentsDesc}>
              🧑‍🤝‍🧑 {t.export.exportAllAgents}
            </button>
          )}
          {onExportInjectedAgents && (
            <button className="btn btn-agent-export" onClick={onExportInjectedAgents} title={t.export.injectedAgentsDesc}>
              💉 {t.export.exportInjected}
            </button>
          )}
          {onExportAgentSummary && (
            <button className="btn btn-agent-export" onClick={onExportAgentSummary} title={t.export.injectedSummaryDesc}>
              📋 {t.export.exportInjectedSummary}
            </button>
          )}
        </div>
      </section>

      <section className="control-section legend-section">
        <h3>{t.legend.title}</h3>
        <p className="section-hint">{t.legend.aggressionAxis} ⟷ {t.legend.influenceAxis}</p>
        <div className="legend-grid">
          {AGENT_STATE_ORDER.map(stateKey => {
            const stat = agentStateStats.find(s => s.state === stateKey);
            return (
              <div key={stateKey} className="legend-card">
                <span className="legend-dot" style={{ background: AGENT_STATE_COLORS[stateKey] }}></span>
                <div className="legend-text">
                  <div className="legend-label-row">
                    <span className="legend-label">{getStateAbbr(t.legend.agentStates[stateKey])}</span>
                    <span className="legend-live-count">{stat?.count ?? 0}</span>
                    <span className="legend-live-pct">({(stat?.percentage ?? 0).toFixed(1)}%)</span>
                  </div>
                  <div className="legend-mini-bar">
                    <div className="legend-mini-fill" style={{ width: `${Math.min((stat?.percentage ?? 0), 100)}%`, backgroundColor: AGENT_STATE_COLORS[stateKey] }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
