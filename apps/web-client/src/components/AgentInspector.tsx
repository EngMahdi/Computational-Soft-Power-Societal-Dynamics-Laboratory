import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../i18n';

// ─── Types ───────────────────────────────────────────────────
export interface InspectableAgent {
  id:             number;
  state:          string;
  emotionalState: any;
  mind?:          Record<string, number>;
  ageProfile?:    { group: string; age: number };
  location?:      { province: string; district: string };
  connections?:   number[];
  memory?:        { shortTerm: number[]; traumaEvents: string[] };
}

export interface AgentInjection {
  type:             "belief_shift" | "emotional_trigger" | "info_exposure" | "trauma" | "resistance_boost";
  narrative?:       string;
  durationTicks:    number;
  spreadToNetwork:  boolean;
  spreadRadius:     number;
}

import type { AIConfig } from '../simulation/aiRouter';
import AgentHistoryModal from './AgentHistoryModal';

interface Props {
  agents:          InspectableAgent[];
  selectedAgent?:  InspectableAgent | null;
  onInject?:       (id: number, injection: AgentInjection) => void;
  onAgentClick?:   (agent: InspectableAgent) => void;
  aiConfig?:       AIConfig;
}

// ─── Helpers ─────────────────────────────────────────────────
function dominantEmotion(e: any): string {
  if (!e || typeof e !== 'object') return String(e ?? 'neutral');
  const entries = Object.entries(e) as [string, number][];
  if (!entries.length) return 'neutral';
  return entries.reduce((a, b) => b[1] > a[1] ? b : a)[0];
}

const STATE_COLORS: Record<string, string> = {
  extremist:        '#ef4444',
  conservative:     '#f59e0b',
  moderate:         '#6b7280',
  liberal:          '#3b82f6',
  activist:         '#ec4899',
  resistant:        '#22c55e',
  isolated:         '#9ca3af',
  gullible:         '#f97316',
  positiveInfluencer:'#a855f7',
  negativeInfluencer:'#dc2626',
};

const AGE_COLORS: Record<string, string> = {
  teen:  '#60a5fa',
  youth: '#34d399',
  adult: '#f59e0b',
  elder: '#a78bfa',
};

const EMOTION_COLORS: Record<string, string> = {
  fear: '#ef4444', anger: '#f97316', hope: '#22c55e',
  pride: '#3b82f6', despair: '#6b7280', solidarity: '#a855f7',
};

// ─── Main Component ──────────────────────────────────────────
export default function AgentInspector({ agents, selectedAgent: externalSelected, onInject, aiConfig }: Props) {
  const { t } = useTranslation();
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState<InspectableAgent | null>(null);
  const [showInject, setShowInject] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Sync external selection (from Canvas click)
  useEffect(() => {
    if (externalSelected) {
      setSelected(externalSelected);
      setShowInject(false);
    }
  }, [externalSelected]);

  // Search
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return agents.filter(a => {
      const idMatch      = String(a.id ?? '').includes(q);
      const stateMatch   = (a.state ?? '').toLowerCase().includes(q);
      const ageMatch     = (a.ageProfile?.group ?? '').includes(q);
      const locMatch     = `${a.location?.province ?? ''} ${a.location?.district ?? ''}`.toLowerCase().includes(q);
      const emoMatch     = dominantEmotion(a.emotionalState).toLowerCase().includes(q);
      return idMatch || stateMatch || ageMatch || locMatch || emoMatch;
    }).slice(0, 15);
  }, [query, agents]);

  // Default sample when no search
  const defaultSample = useMemo(() => {
    const states = ['extremist','activist','resistant','isolated','moderate'];
    return states
      .map(s => agents.find(a => a.state === s))
      .filter(Boolean) as InspectableAgent[];
  }, [agents]);

  return (
    <div style={S.panel}>
      <div style={S.header}>{t.inspector.title}</div>

      {/* Search input */}
      <input
        style={S.input}
        placeholder={t.inspector.searchPlaceholder}
        value={query}
        onChange={e => setQuery(e.target.value)}
        dir="rtl"
      />

      {/* Results or default sample */}
      <div style={S.list}>
        {(query.trim() ? results : defaultSample).map(a => (
          <div
            key={a.id}
            style={{ ...S.row, background: selected?.id === a.id ? '#1e3a5f' : 'transparent' }}
            onClick={() => { setSelected(a); setShowInject(false); }}
          >
            <span style={{ color: AGE_COLORS[a.ageProfile?.group ?? ''] ?? '#fff', fontWeight: 700, minWidth: 35 }}>
              #{a.id}
            </span>
            <span style={{ ...S.badge, background: STATE_COLORS[a.state] ?? '#374151', color: '#fff' }}>
              {a.state}
            </span>
            {a.ageProfile && (
              <span style={{ ...S.badge, background: '#1f2937' }}>
                {a.ageProfile.group} {a.ageProfile.age.toFixed(1)}yr
              </span>
            )}
            <span style={{ color: '#6b7280', fontSize: 10, marginRight: 'auto' }}>
              {dominantEmotion(a.emotionalState)}
            </span>
          </div>
        ))}
        {query.trim() && results.length === 0 && (
          <div style={{ color: '#6b7280', fontSize: 11, padding: 8, textAlign: 'center' }}>
            {t.inspector.noResults}
          </div>
        )}
      </div>

      {/* Agent card */}
      {selected && (
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={{ color: AGE_COLORS[selected.ageProfile?.group ?? ''] ?? '#fff', fontWeight: 700 }}>
              {t.inspector.agent} #{selected.id}
              {selected.ageProfile && ` — ${selected.ageProfile.age.toFixed(1)} ${t.inspector.year} (${selected.ageProfile.group})`}
            </span>
            <button style={S.closeBtn} onClick={() => setSelected(null)}>✕</button>
          </div>

          <KV label={t.inspector.state}  value={selected.state} />
          <KV label={t.inspector.emotion} value={dominantEmotion(selected.emotionalState)} />
          {selected.location && (
            <KV label={t.inspector.location} value={`${selected.location.province} / ${selected.location.district}`} />
          )}
          {selected.connections && (
            <KV label={t.inspector.connections} value={String(selected.connections.length)} />
          )}

          {/* Emotional state bars */}
          {selected.emotionalState && typeof selected.emotionalState === 'object' && (
            <>
              <Section>{t.inspector.emotionalState}</Section>
              {Object.entries(selected.emotionalState).map(([k, v]) => {
                const emotionLabel = (t.inspector.emotionLabels as Record<string, string>)[k] || k;
                return (
                  <Bar key={k} label={emotionLabel} value={Number(v)} color={EMOTION_COLORS[k] ?? '#6b7280'} />
                );
              })}
            </>
          )}

          {/* Psychological traits */}
          {selected.mind && Object.keys(selected.mind).length > 0 && (
            <>
              <Section>{t.inspector.psychologicalTraits}</Section>
              {Object.entries(selected.mind).map(([k, v]) => {
                const traitLabel = (t.inspector.traitLabels as Record<string, string>)[k] || k;
                return (
                  <Bar key={k} label={traitLabel} value={Number(v)} color="#60a5fa" />
                );
              })}
            </>
          )}

          {/* Research Ledger Integration */}
          <Section>{t.inspector.ledgerTitle}</Section>
          <button 
            style={{...S.injectBtn, background: '#10b981', marginBottom: 8}}
            onClick={() => setShowHistory(true)}
          >
            {t.inspector.viewLedgerBtn}
          </button>

          {showHistory && aiConfig && (
            <AgentHistoryModal 
              agent={selected} 
              aiConfig={aiConfig} 
              onClose={() => setShowHistory(false)} 
            />
          )}

          {/* Inject button */}
          {onInject && (
            <>
              <button style={S.injectBtn} onClick={() => setShowInject(p => !p)}>
                {showInject ? t.inspector.close : t.inspector.inject}
              </button>
              {showInject && (
                <InjectionForm
                  agentId={selected.id}
                  onInject={onInject}
                  onDone={() => setShowInject(false)}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Injection Form ───────────────────────────────────────────
function InjectionForm({ agentId, onInject, onDone }: {
  agentId:  number;
  onInject: (id: number, inj: any) => void;
  onDone:   () => void;
}) {
  const { t } = useTranslation();
  const [type,     setType]     = useState('info_exposure');
  const [text,     setText]     = useState('');
  const [duration, setDuration] = useState(100);
  const [spread,   setSpread]   = useState(false);

  const types = [
    { v: 'info_exposure',     l: t.inspector.injectionTypes.info_exposure },
    { v: 'emotional_trigger', l: t.inspector.injectionTypes.emotional_trigger },
    { v: 'trauma',            l: t.inspector.injectionTypes.trauma },
    { v: 'resistance_boost',  l: t.inspector.injectionTypes.resistance_boost },
    { v: 'belief_shift',      l: t.inspector.injectionTypes.belief_shift },
  ];

  return (
    <div style={{ marginTop: 8, direction: 'rtl' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {types.map(tp => (
          <button key={tp.v} onClick={() => setType(tp.v)} style={{
            ...S.typeBtn,
            background: type === tp.v ? '#7c3aed' : '#374151',
            color: type === tp.v ? '#fff' : '#9ca3af',
          }}>{tp.l}</button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={t.inspector.narrativePlaceholder}
        rows={2}
        style={S.textarea}
        dir="rtl"
      />

      <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.inspector.duration}: {duration} tick</div>
      <input type="range" min={10} max={500} step={10}
        value={duration} onChange={e => setDuration(+e.target.value)}
        style={{ width: '100%', marginBottom: 6 }} />

      <label style={{ fontSize: 11, color: '#9ca3af', cursor: 'pointer', display: 'flex', gap: 6 }}>
        <input type="checkbox" checked={spread} onChange={e => setSpread(e.target.checked)} />
        {t.inspector.spread}
      </label>

      <button
        onClick={() => {
          onInject(agentId, { type, narrative: text, durationTicks: duration, spreadToNetwork: spread });
          onDone();
        }}
        style={{ ...S.injectBtn, background: '#059669', marginTop: 8 }}
      >
        {t.inspector.execute}
      </button>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────
function KV({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ color: '#e5e7eb' }}>{value}</span>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase',
    marginTop: 10, marginBottom: 4, borderBottom: '1px solid #374151', paddingBottom: 3 }}>
    {children}
  </div>;
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = isNaN(value) ? 0 : Math.max(0, Math.min(1, value)) * 100;
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
        <span style={{ color: '#9ca3af' }}>{label}</span>
        <span style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ background: '#111827', borderRadius: 3, height: 4 }}>
        <div style={{ width: `${pct}%`, background: color, height: 4, borderRadius: 3,
          transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  panel:     { width: 280, background: '#0f172a', padding: 12, borderRadius: 10,
               border: '1px solid #1e3a5f', fontFamily: 'monospace', direction: 'rtl',
               maxHeight: '80vh', overflowY: 'auto' },
  header:    { color: '#93c5fd', fontSize: 14, fontWeight: 700, marginBottom: 10 },
  input:     { width: '100%', background: '#1e293b', border: '1px solid #334155',
               color: '#f1f5f9', borderRadius: 6, padding: '6px 10px',
               fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  list:      { maxHeight: 160, overflowY: 'auto', marginTop: 6 },
  row:       { display: 'flex', gap: 5, alignItems: 'center', padding: '5px 4px',
               cursor: 'pointer', borderRadius: 5, fontSize: 11,
               borderBottom: '1px solid #1e293b' },
  badge:     { padding: '1px 6px', borderRadius: 4, fontSize: 10 },
  card:      { marginTop: 10, background: '#1e293b', borderRadius: 8,
               padding: 12, border: '1px solid #334155' },
  cardHead:  { display: 'flex', justifyContent: 'space-between',
               alignItems: 'flex-start', marginBottom: 10 },
  closeBtn:  { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 },
  injectBtn: { width: '100%', background: '#7c3aed', border: 'none',
               color: '#fff', padding: '7px 0', borderRadius: 6,
               cursor: 'pointer', fontSize: 12, marginTop: 10 },
  typeBtn:   { padding: '3px 8px', fontSize: 10, borderRadius: 4,
               cursor: 'pointer', border: 'none' },
  textarea:  { width: '100%', background: '#0f172a', border: '1px solid #334155',
               color: '#f1f5f9', borderRadius: 6, padding: 8, fontSize: 11,
               resize: 'none', outline: 'none', boxSizing: 'border-box',
               marginBottom: 6 },
};
