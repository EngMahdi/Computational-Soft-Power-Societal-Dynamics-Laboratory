/**
 * AgentGroupBuilder.tsx — v2
 * ─────────────────────────────────────────────────────────────
 * Agent Group Builder with Universal Archetypes system.
 *
 * Interface:
 *   1. Select Category (Academic / Religious / Economic / ...)
 *   2. Select specific archetype within category
 *   3. Set count, region, age group, label
 *   4. Custom Sliders to modify traits manually
 * ─────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { useTranslation } from '../i18n';
import {
  ARCHETYPE_CATEGORIES,
  AGENT_ARCHETYPES,
  getArchetypesByCategory,
  getArchetypeById,
  type AgentArchetype,
  type ArchetypeCategory,
} from '../simulation/agentArchetypes';
import { AGENT_PRESETS, type AgentPreset, type AgentGroup } from '../simulation/regionContext';
import type { AgeGroup } from '../types/age';

const AGE_GROUP_KEYS: AgeGroup[] = ['teen', 'youth', 'adult', 'elder'];



interface AgentGroupBuilderProps {
  groups: AgentGroup[];
  isRunning: boolean;
  onGroupsChange: (groups: AgentGroup[]) => void;
  onApply: (groups: AgentGroup[]) => void;
}

export default function AgentGroupBuilder({
  groups, isRunning, onGroupsChange, onApply,
}: AgentGroupBuilderProps) {
  const { t } = useTranslation();
  // ── Selection State ──
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ARCHETYPE_CATEGORIES[0].id);
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>(
    getArchetypesByCategory(ARCHETYPE_CATEGORIES[0].id)[0]?.id ?? ''
  );

  // ── Form State ──
  const [newCount,    setNewCount]    = useState(50);
  const [newProvince, setNewProvince] = useState('');
  const [newAgeGroup, setNewAgeGroup] = useState<AgeGroup | 'auto'>('auto');
  const [newLabel,    setNewLabel]    = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showCustomSliders, setShowCustomSliders] = useState(false);
  const [customTraits, setCustomTraits] = useState<Record<string, number>>({
    openness: 0.5, skepticism: 0.5, conformity: 0.5, tribalism: 0.5,
    aggression: 0.3, prestige_seeking: 0.5, fear_sensitivity: 0.5,
    emotionality: 0.5, cognitive_flexibility: 0.5, ideological_rigidity: 0.4,
    attention_span: 0.55, trust_in_institutions: 0.3, critical_thinking: 0.5,
  });

  const totalAgents = groups.reduce((s, g) => s + g.count, 0);

  const currentCategory  = ARCHETYPE_CATEGORIES.find(c => c.id === selectedCategoryId)!;
  const categoryArchetypes = getArchetypesByCategory(selectedCategoryId);
  const selectedArchetype  = getArchetypeById(selectedArchetypeId);

  // ── Add Group ──
  const addGroup = () => {
    if (!selectedArchetype) return;
    const label = newLabel.trim() || `${t.archetypes[selectedArchetype.id]?.label}${newProvince ? ` · ${newProvince}` : ''}`;
    const group: AgentGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      preset: 'custom' as AgentPreset,  // fallback للتوافق العكسي
      archetypeId: selectedArchetypeId,
      count: Math.max(1, Math.min(10000, newCount)),
      province: newProvince || 'غير محدد',
      ageGroup: newAgeGroup === 'auto' ? undefined : newAgeGroup as AgeGroup,
      label,
      customTraits: showCustomSliders ? { ...customTraits } : undefined,
    };
    onGroupsChange([...groups, group]);
    setNewLabel('');
  };

  const removeGroup = (id: string) => onGroupsChange(groups.filter(g => g.id !== id));

  const updateGroupCount = (id: string, count: number) =>
    onGroupsChange(groups.map(g => g.id === id ? { ...g, count: Math.max(1, Math.min(10000, count)) } : g));

  return (
    <div style={S.container}>
      {/* ─ Card Header ─ */}
      <div style={S.header}>
        <span style={S.headerTitle}>{t.builder.title}</span>
        <span style={S.totalBadge}>{totalAgents.toLocaleString()}</span>
      </div>

      {/* ─ Current Groups ─ */}
      {groups.length > 0 && (
        <div style={S.groupsList}>
          {groups.map(g => {
            const arch = g.archetypeId ? getArchetypeById(g.archetypeId) : null;
            const cat  = arch ? ARCHETYPE_CATEGORIES.find(c => c.id === arch.categoryId) : null;
            const color = cat?.color ?? '#6b7280';
            const isExpanded = expandedGroup === g.id;
            return (
              <div key={g.id} style={{ ...S.groupCard, borderColor: color + '60' }}>
                <div style={S.groupCardHeader}>
                  <span style={{ fontSize: 18 }}>{arch?.icon ?? '👤'}</span>
                  <div style={S.groupInfo}>
                    <span style={{ ...S.groupLabel, color }}>{g.label}</span>
                    <span style={S.groupMeta}>
                      {cat ? t.archetypeCategories[cat.id]?.label : t.builder.custom} · {g.province} · {g.ageGroup ? t.builder[g.ageGroup as keyof typeof t.builder] : t.builder.auto}
                    </span>
                  </div>
                  <div style={S.groupActions}>
                    <input
                      type="number" value={g.count} min={1} max={10000}
                      disabled={isRunning}
                      onChange={e => updateGroupCount(g.id, parseInt(e.target.value) || 1)}
                      style={S.countInput}
                    />
                    <button onClick={() => setExpandedGroup(isExpanded ? null : g.id)}
                      style={S.iconBtn} >ℹ️</button>
                    <button onClick={() => removeGroup(g.id)}
                      disabled={isRunning} style={S.removeBtn} >✕</button>
                  </div>
                </div>
                {isExpanded && arch && (
                  <div style={S.groupDetails}>
                    <p style={S.detailText}>📋 {t.archetypes[arch.id]?.description}</p>
                    {t.archetypes[arch.id]?.researchNote && (
                      <p style={{ ...S.detailText, color: '#60a5fa', marginTop: 4 }}>
                        🔬 {t.archetypes[arch.id]?.researchNote}
                      </p>
                    )}
                    <div style={S.traitPreview}>
                      {Object.entries(arch.traits).slice(0, 6).map(([k, v]) => (
                        <div key={k} style={S.traitRow}>
                          <span style={S.traitName}>{t.inspector.traitLabels[k] ?? k}</span>
                          <div style={S.traitBar}>
                            <div style={{ ...S.traitFill, width: `${v * 100}%`, background: color }} />
                          </div>
                          <span style={S.traitVal}>{(v * 100).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ color: '#64748b', fontSize: 9, marginTop: 4 }}>
                      {t.builder.traitOverrideNote}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─ Add Form ─ */}
      {!isRunning && (
        <div style={S.addForm}>
          <div style={S.formTitle}>➕ {t.builder.title}</div>

          {/* 1. Select Category */}
          <div style={{ marginBottom: 10 }}>
            <div style={S.sectionLabel}>①</div>
            <div style={S.categoryGrid}>
              {ARCHETYPE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    const first = getArchetypesByCategory(cat.id)[0];
                    if (first) setSelectedArchetypeId(first.id);
                  }}
                  style={{
                    ...S.categoryBtn,
                    borderColor: selectedCategoryId === cat.id ? cat.color : '#334155',
                    background:  selectedCategoryId === cat.id ? cat.color + '20' : '#0f172a',
                    color:       selectedCategoryId === cat.id ? cat.color : '#94a3b8',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{cat.icon}</span>
                  <span style={{ fontSize: 10, lineHeight: 1.3 }}>{t.archetypeCategories[cat.id]?.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Select Archetype */}
          <div style={{ marginBottom: 10 }}>
            <div style={S.sectionLabel}>②</div>
            <div style={S.archetypeGrid}>
              {categoryArchetypes.map(arch => (
                <button
                  key={arch.id}
                  onClick={() => setSelectedArchetypeId(arch.id)}
                  title={t.archetypes[arch.id]?.description}
                  style={{
                    ...S.archetypeBtn,
                    borderColor: selectedArchetypeId === arch.id ? currentCategory.color : '#1e3a5f',
                    background:  selectedArchetypeId === arch.id ? currentCategory.color + '22' : '#0a1628',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{arch.icon}</span>
                  <span style={{
                    fontSize: 10, lineHeight: 1.2, textAlign: 'center',
                    color: selectedArchetypeId === arch.id ? currentCategory.color : '#94a3b8',
                  }}>{t.archetypes[arch.id]?.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Archetype Description Card */}
          {selectedArchetype && (
            <div style={{
              background: '#0a1628',
              border: `1px solid ${currentCategory.color}40`,
              borderRadius: 8, padding: '8px 10px', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>{selectedArchetype.icon}</span>
                <div>
                  <div style={{ color: currentCategory.color, fontWeight: 700, fontSize: 12 }}>
                    {t.archetypes[selectedArchetype.id]?.label}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>{t.archetypeCategories[currentCategory.id]?.label}</div>
                </div>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 11, margin: '4px 0' }}>
                {t.archetypes[selectedArchetype.id]?.description}
              </p>
              {t.archetypes[selectedArchetype.id]?.researchNote && (
                <p style={{ color: '#60a5fa', fontSize: 10, margin: '4px 0 0' }}>
                  🔬 {t.archetypes[selectedArchetype.id]?.researchNote}
                </p>
              )}
            </div>
          )}

          {/* Custom Sliders */}
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => setShowCustomSliders(!showCustomSliders)} style={S.customToggle}>
              {showCustomSliders ? '▲' : '▼'} {t.builder.editTraitsBtn}
            </button>
            {showCustomSliders && (
              <div style={S.customSliders}>
                {Object.entries(customTraits).map(([k, v]) => (
                  <div key={k} style={S.sliderRow}>
                    <span style={S.sliderLabel}>{t.inspector.traitLabels[k] ?? k}</span>
                    <input
                      type="range" min={0} max={1} step={0.05} value={v}
                      onChange={e => setCustomTraits(p => ({ ...p, [k]: parseFloat(e.target.value) }))}
                      style={{ flex: 1, accentColor: currentCategory.color }}
                    />
                    <span style={{ ...S.sliderVal, color: currentCategory.color }}>
                      {(v * 100).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ③ */}
          <div style={S.sectionLabel}>③</div>

          <div style={S.formRow}>
            <label style={S.formLabel}>{t.builder.count}</label>
            <input
              type="number" min={1} max={10000} value={newCount}
              onChange={e => setNewCount(parseInt(e.target.value) || 1)}
              style={S.numberInput}
            />
          </div>

          <div style={S.formRow}>
            <label style={S.formLabel}>{t.builder.region}</label>
            <input
              type="text" value={newProvince}
              onChange={e => setNewProvince(e.target.value)}
              style={S.textInput} placeholder="..."
            />
          </div>

          <div style={S.formRow}>
            <label style={S.formLabel}>{t.builder.ageGroup}</label>
            <select value={newAgeGroup} onChange={e => setNewAgeGroup(e.target.value as AgeGroup | 'auto')}
              style={S.select}>
              <option value="auto">{t.builder.auto}</option>
              {AGE_GROUP_KEYS.map(k => <option key={k} value={k}>{t.builder[k as keyof typeof t.builder]}</option>)}
            </select>
          </div>

          <div style={S.formRow}>
            <label style={S.formLabel}>{t.builder.label}</label>
            <input
              type="text" value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder={`${selectedArchetype ? t.archetypes[selectedArchetype.id]?.label : ''}${newProvince ? ` · ${newProvince}` : ''}`}
              style={S.textInput}
            />
          </div>

          <button onClick={addGroup} style={{ ...S.addBtn, background: `linear-gradient(135deg, ${currentCategory.color}dd, ${currentCategory.color}99)` }}>
            {t.builder.addAgentsBtn.replace('{count}', newCount.toLocaleString()).replace('{label}', selectedArchetype ? t.archetypes[selectedArchetype.id]?.label : '')}
          </button>
        </div>
      )}

      {/* ─ Apply Button ─ */}
      {groups.length > 0 && (
        <button onClick={() => onApply(groups)} disabled={isRunning} style={S.applyBtn}>
          🚀 {t.builder.applyBtn} ({totalAgents.toLocaleString()})
        </button>
      )}

      {groups.length === 0 && (
        <p style={{ color: '#475569', fontSize: 11, textAlign: 'center', padding: '8px 0' }}>
          {t.builder.noGroups}
        </p>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  container: {
    background: '#0f172a', border: '1px solid #1e3a5f',
    borderRadius: 10, padding: 12, marginTop: 10, direction: 'rtl',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { color: '#60a5fa', fontSize: 13, fontWeight: 700 },
  totalBadge: {
    background: '#1e3a5f', color: '#38bdf8',
    borderRadius: 12, padding: '2px 8px', fontSize: 11, fontWeight: 600,
  },

  // Groups list
  groupsList: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 },
  groupCard: { background: '#1e293b', border: '1px solid', borderRadius: 8, padding: '8px 10px' },
  groupCardHeader: { display: 'flex', alignItems: 'center', gap: 8 },
  groupInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2 },
  groupLabel: { fontSize: 12, fontWeight: 600 },
  groupMeta: { fontSize: 10, color: '#64748b' },
  groupActions: { display: 'flex', alignItems: 'center', gap: 4 },
  countInput: {
    width: 58, padding: '2px 4px', background: '#0f172a',
    border: '1px solid #334155', borderRadius: 4,
    color: '#e2e8f0', fontSize: 12, textAlign: 'center',
  },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: 14 },
  removeBtn: {
    background: '#7f1d1d', border: 'none', borderRadius: 4,
    color: '#fca5a5', cursor: 'pointer', padding: '2px 6px', fontSize: 11,
  },
  groupDetails: { marginTop: 8, paddingTop: 8, borderTop: '1px solid #1e3a5f' },
  detailText: { color: '#94a3b8', fontSize: 11, margin: 0 },
  traitPreview: { display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 },
  traitRow: { display: 'flex', alignItems: 'center', gap: 6 },
  traitName: { color: '#64748b', fontSize: 10, width: 100, flexShrink: 0 },
  traitBar: { flex: 1, height: 4, background: '#0f172a', borderRadius: 2, overflow: 'hidden' },
  traitFill: { height: '100%', borderRadius: 2, transition: 'width 0.3s' },
  traitVal: { color: '#94a3b8', fontSize: 10, width: 24, textAlign: 'right' },

  // Add form
  addForm: { background: '#1e293b', border: '1px dashed #334155', borderRadius: 8, padding: 10, marginBottom: 8 },
  formTitle: { color: '#38bdf8', fontSize: 12, fontWeight: 600, marginBottom: 10 },
  sectionLabel: { color: '#64748b', fontSize: 10, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Category grid
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 2 },
  categoryBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    padding: '6px 4px', borderRadius: 6, border: '1px solid',
    cursor: 'pointer', transition: 'all 0.15s',
    background: '#0f172a',
  },

  // Archetype grid
  archetypeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 2 },
  archetypeBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    padding: '6px 2px', borderRadius: 6, border: '1px solid',
    cursor: 'pointer', transition: 'all 0.15s',
    minHeight: 60,
  },

  formRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  formLabel: { color: '#94a3b8', fontSize: 11, width: 80, flexShrink: 0 },
  select: {
    flex: 1, padding: '4px 6px', background: '#0f172a',
    border: '1px solid #334155', borderRadius: 4, color: '#e2e8f0', fontSize: 11,
  },
  numberInput: {
    flex: 1, padding: '4px 6px', background: '#0f172a',
    border: '1px solid #334155', borderRadius: 4, color: '#e2e8f0', fontSize: 11,
  },
  textInput: {
    flex: 1, padding: '4px 6px', background: '#0f172a',
    border: '1px solid #334155', borderRadius: 4, color: '#e2e8f0', fontSize: 11,
  },
  customToggle: {
    background: '#1e293b', border: '1px solid #334155',
    borderRadius: 4, color: '#94a3b8', cursor: 'pointer',
    fontSize: 11, padding: '3px 8px', width: '100%', marginBottom: 6,
  },
  customSliders: { display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 0' },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 6 },
  sliderLabel: { color: '#64748b', fontSize: 10, width: 100, flexShrink: 0 },
  sliderVal: { fontSize: 10, width: 24, textAlign: 'right' },
  addBtn: {
    width: '100%', padding: '8px 0', border: 'none',
    borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', marginTop: 4,
  },
  applyBtn: {
    width: '100%', padding: '9px 0',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    border: 'none', borderRadius: 7, color: '#fff',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5,
  },
};
