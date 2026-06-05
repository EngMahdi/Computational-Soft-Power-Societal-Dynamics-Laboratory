# خطة الإصلاح الشامل — كود جاهز
## 3 bugs جذرية + Inspector + Events

---

## BUG #1 — العاطفة: `"[object Object]": 1000`

**الدليل من JSON:**
```json
"emotionalDistribution": { "[object Object]": 1000 },
"emotionalCounts":        { "[object Object]": 1000 }
```

**السبب الدقيق:** الكود يستخدم كائن `EmotionalState` كـ Map key مباشرة بدل استخراج القيمة:

```typescript
// الكود الخاطئ الموجود حالياً — شيء من هذا القبيل:
emotionalCounts[agent.emotionalState]++   // agent.emotionalState هو Object لا string
// أو:
acc[agent.emotion] = ...   // agent.emotion = { fear: 0.3, anger: 0.1, ... } لا string
```

**الإصلاح — في الملف الذي يبني snapshot أو يصدر البيانات:**

```typescript
// ═══════════════════════════════════════════════
// الخطوة 1: دالة تحول EmotionalState إلى string
// ═══════════════════════════════════════════════

// أضف هذه الدالة في src/types/agent.ts أو src/utils/emotion.ts

export function dominantEmotion(e: EmotionalState): string {
  // إذا كانت EmotionalState كائناً متعدد الأبعاد:
  if (typeof e === 'object' && e !== null) {
    const entries = Object.entries(e) as [string, number][];
    if (entries.length === 0) return 'neutral';
    return entries.reduce((a, b) => b[1] > a[1] ? b : a)[0];
  }
  // إذا كانت string قديمة:
  return String(e);
}

// ═══════════════════════════════════════════════
// الخطوة 2: في دالة buildSnapshot أو exportTick
// ═══════════════════════════════════════════════

export function buildEmotionalCounts(agents: Agent[]): Record<string, number> {
  return agents.reduce((acc, agent) => {
    // استخدم dominantEmotion بدل agent.emotionalState مباشرة
    const key = dominantEmotion(agent.emotionalState);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// ═══════════════════════════════════════════════
// الخطوة 3: في دالة حساب emotionalDistribution
// ═══════════════════════════════════════════════

// ابحث عن هذا الكود وعدّله:
// قبل:
const emotionalCounts = {};
agents.forEach(a => {
  emotionalCounts[a.emotionalState]++;  // ← هذا يسبب [object Object]
});

// بعد:
const emotionalCounts = buildEmotionalCounts(agents);
```

---

## BUG #2 — Agent Inspector: البحث والنقر لا يعملان

**التشخيص من الصور:** اللوحة تعرض "12" فقط ولا يوجد نتائج عند البحث.

**الأسباب المحتملة الثلاثة — تحقق من كل واحد:**

### السبب أ: البيانات لا تصل للـ Inspector

```typescript
// ابحث في App.tsx أو الـ component الرئيسي
// هل يمرر agents للـ Inspector؟

// الخاطئ:
<AgentInspector />  // لا يمرر أي بيانات

// الصحيح:
<AgentInspector agents={agents} onAgentSelect={setSelectedAgent} />
```

### السبب ب: الشرط في البحث يفشل لأن الحقول غير موجودة

```typescript
// الإصلاح الكامل لدالة البحث:

function searchAgents(agents: Agent[], query: string): Agent[] {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();

  return agents.filter(agent => {
    // تحقق من وجود كل حقل قبل البحث فيه
    const idMatch    = String(agent.id ?? '').includes(q);
    const stateMatch = (agent.state ?? '').toLowerCase().includes(q);
    
    // حقول اختيارية — لا تكسر إن لم تكن موجودة
    const ageMatch      = (agent.ageProfile?.group ?? '').includes(q);
    const districtMatch = (agent.location?.district ?? '').toLowerCase().includes(q);
    const provinceMatch = (agent.location?.province ?? '').toLowerCase().includes(q);

    return idMatch || stateMatch || ageMatch || districtMatch || provinceMatch;
  }).slice(0, 20);
}
```

### السبب ج: النقر على الـ Canvas لا يجد الوكيل

```typescript
// في ملف Canvas.tsx أو SimulationView.tsx
// ابحث عن onClick أو handleClick على الـ canvas element

// الإصلاح الكامل:
const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
  const canvas = e.currentTarget;
  const rect   = canvas.getBoundingClientRect();

  // حساب الإزاحة الصحيحة مع الـ scale
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top)  * scaleY;

  const CLICK_RADIUS = 10; // بكسل — اجعله أكبر للسهولة

  let closestAgent: Agent | null = null;
  let closestDist = Infinity;

  for (const agent of agents) {
    const pos = agentPositions.get(agent.id);
    if (!pos) continue;

    const dist = Math.hypot(mouseX - pos.x, mouseY - pos.y);
    if (dist < CLICK_RADIUS && dist < closestDist) {
      closestDist  = dist;
      closestAgent = agent;
    }
  }

  if (closestAgent) {
    onAgentSelect(closestAgent);
    console.log('Agent selected:', closestAgent.id); // للتأكيد
  }
}, [agents, agentPositions, onAgentSelect]);

// تأكد أن الـ canvas له هذا:
<canvas
  onClick={handleCanvasClick}
  style={{ cursor: 'crosshair' }}
  // ...
/>
```

---

### الملف الكامل المُصحح: `AgentInspector.tsx`

انسخ هذا الملف بالكامل واستبدل الموجود:

```tsx
import React, { useState, useMemo, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────
interface Agent {
  id:             number;
  state:          string;
  emotionalState: any;
  mind?:          Record<string, number>;
  ageProfile?:    { group: string; age: number };
  location?:      { province: string; district: string };
  connections?:   number[];
}

interface Props {
  agents:          Agent[];
  selectedAgent?:  Agent | null;
  onInject?:       (id: number, injection: any) => void;
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

// ─── Main Component ──────────────────────────────────────────
export default function AgentInspector({ agents, selectedAgent: externalSelected, onInject }: Props) {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState<Agent | null>(null);
  const [showInject, setShowInject] = useState(false);

  // تحديث عند اختيار من Canvas
  useEffect(() => {
    if (externalSelected) setSelected(externalSelected);
  }, [externalSelected]);

  // البحث
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return agents.filter(a => {
      const idMatch      = String(a.id).includes(q);
      const stateMatch   = (a.state ?? '').toLowerCase().includes(q);
      const ageMatch     = (a.ageProfile?.group ?? '').includes(q);
      const locMatch     = `${a.location?.province ?? ''} ${a.location?.district ?? ''}`.toLowerCase().includes(q);
      return idMatch || stateMatch || ageMatch || locMatch;
    }).slice(0, 15);
  }, [query, agents]);

  // عينة افتراضية عند عدم وجود بحث
  const defaultSample = useMemo(() => {
    const states = ['extremist','activist','resistant','isolated','moderate'];
    return states
      .map(s => agents.find(a => a.state === s))
      .filter(Boolean) as Agent[];
  }, [agents]);

  return (
    <div style={S.panel}>
      <div style={S.header}>🔍 فحص الوكلاء</div>

      {/* شريط البحث */}
      <input
        style={S.input}
        placeholder="ID، حالة، عمر، منطقة..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        dir="rtl"
      />

      {/* نتائج البحث أو العينة الافتراضية */}
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
                {a.ageProfile.group} {a.ageProfile.age}yr
              </span>
            )}
            <span style={{ color: '#6b7280', fontSize: 10, marginRight: 'auto' }}>
              {dominantEmotion(a.emotionalState)}
            </span>
          </div>
        ))}
        {query.trim() && results.length === 0 && (
          <div style={{ color: '#6b7280', fontSize: 11, padding: 8, textAlign: 'center' }}>
            لا نتائج
          </div>
        )}
      </div>

      {/* بطاقة الوكيل المختار */}
      {selected && (
        <div style={S.card}>
          {/* رأس البطاقة */}
          <div style={S.cardHead}>
            <span style={{ color: AGE_COLORS[selected.ageProfile?.group ?? ''] ?? '#fff', fontWeight: 700 }}>
              وكيل #{selected.id}
              {selected.ageProfile && ` — ${selected.ageProfile.age} سنة (${selected.ageProfile.group})`}
            </span>
            <button style={S.closeBtn} onClick={() => setSelected(null)}>✕</button>
          </div>

          <KV label="الحالة"  value={selected.state} />
          <KV label="العاطفة" value={dominantEmotion(selected.emotionalState)} />
          {selected.location && (
            <KV label="الموقع" value={`${selected.location.province} / ${selected.location.district}`} />
          )}
          {selected.connections && (
            <KV label="الروابط" value={String(selected.connections.length)} />
          )}

          {/* الحالة العاطفية */}
          {selected.emotionalState && typeof selected.emotionalState === 'object' && (
            <>
              <Section>الحالة العاطفية</Section>
              {Object.entries(selected.emotionalState).map(([k, v]) => (
                <Bar key={k} label={k} value={Number(v)} color={EMOTION_COLORS[k] ?? '#6b7280'} />
              ))}
            </>
          )}

          {/* السمات النفسية */}
          {selected.mind && Object.keys(selected.mind).length > 0 && (
            <>
              <Section>السمات النفسية</Section>
              {Object.entries(selected.mind).map(([k, v]) => (
                <Bar key={k} label={k} value={Number(v)} color="#60a5fa" />
              ))}
            </>
          )}

          {/* زر الحقن */}
          {onInject && (
            <>
              <button
                style={S.injectBtn}
                onClick={() => setShowInject(p => !p)}
              >
                {showInject ? '▲ إغلاق' : '💉 حقن معلومات / سلوك'}
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
  const [type,     setType]     = useState('info_exposure');
  const [text,     setText]     = useState('');
  const [duration, setDuration] = useState(100);
  const [spread,   setSpread]   = useState(false);

  const types = [
    { v: 'info_exposure',     l: '📰 تعريض لمعلومة'  },
    { v: 'emotional_trigger', l: '⚡ إثارة عاطفية'   },
    { v: 'trauma',            l: '💔 حدث صادم'       },
    { v: 'resistance_boost',  l: '🛡️ تعزيز مناعة'    },
    { v: 'belief_shift',      l: '🔄 تغيير معتقد'    },
  ];

  return (
    <div style={{ marginTop: 8, direction: 'rtl' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {types.map(t => (
          <button key={t.v} onClick={() => setType(t.v)} style={{
            ...S.typeBtn,
            background: type === t.v ? '#7c3aed' : '#374151',
            color: type === t.v ? '#fff' : '#9ca3af',
          }}>{t.l}</button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="السردية أو المعلومة..."
        rows={2}
        style={S.textarea}
        dir="rtl"
      />

      <div style={{ fontSize: 11, color: '#9ca3af' }}>المدة: {duration} tick</div>
      <input type="range" min={10} max={500} step={10}
        value={duration} onChange={e => setDuration(+e.target.value)}
        style={{ width: '100%', marginBottom: 6 }} />

      <label style={{ fontSize: 11, color: '#9ca3af', cursor: 'pointer', display: 'flex', gap: 6 }}>
        <input type="checkbox" checked={spread} onChange={e => setSpread(e.target.checked)} />
        انشر في شبكة الوكيل
      </label>

      <button
        onClick={() => {
          onInject(agentId, { type, narrative: text, durationTicks: duration, spreadToNetwork: spread });
          onDone();
        }}
        style={{ ...S.injectBtn, background: '#059669', marginTop: 8 }}
      >
        ⚡ تنفيذ الآن
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

// ─── Constants ────────────────────────────────────────────────
const EMOTION_COLORS: Record<string, string> = {
  fear: '#ef4444', anger: '#f97316', hope: '#22c55e',
  pride: '#3b82f6', despair: '#6b7280', solidarity: '#a855f7',
};

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
```

---

## BUG #3 — الأحداث تنتهي فوراً

**التشخيص:** عند تفعيل حدث خارجي، `remainingTicks` لا يتناقص بشكل صحيح أو يبدأ بصفر.

**ابحث في ملف الأحداث (EventSystem أو events.ts) عن هذا الخطأ:**

```typescript
// الخطأ الأول المحتمل — تعريف remainingTicks كـ undefined:
const event = {
  type: 'political',
  effect: { ... },
  // remainingTicks غير موجود ← ينتهي فوراً
};

// الخطأ الثاني المحتمل — الشرط خاطئ:
if (event.remainingTicks <= 0) removeEvent(event);  // يُزال قبل تطبيق التأثير
```

### الإصلاح الكامل لنظام الأحداث:

```typescript
// ═══════════════════════════════════════════════════════
// src/simulation/eventSystem.ts — النظام الكامل المُصحح
// ═══════════════════════════════════════════════════════

export interface SimEvent {
  id:              string;
  type:            'political' | 'economic' | 'cultural' | 'informational';
  name:            string;
  totalDuration:   number;  // الكمية الكاملة
  remainingTicks:  number;  // تتناقص مع الوقت
  intensity:       number;  // 0–1
  effects: {
    polarization?:        number;
    cohesion?:            number;
    narrative_volatility?: number;
    belief_adoption?:     number;
    memetic_velocity?:    number;
    [key: string]:        number | undefined;
  };
  emotionalImpact?: {
    fear?:       number;
    anger?:      number;
    hope?:       number;
    solidarity?: number;
  };
}

// ─── إنشاء حدث جديد ─────────────────────────────────────────
export function createEvent(
  type: SimEvent['type'],
  durationTicks: number = 200  // افتراضي 200 tick لا صفر
): SimEvent {
  const templates: Record<SimEvent['type'], Partial<SimEvent>> = {
    political: {
      name:    'حدث سياسي',
      effects: { polarization: +0.15, narrative_volatility: +0.10 },
      emotionalImpact: { fear: +0.10, anger: +0.15 },
    },
    economic: {
      name:    'حدث اقتصادي',
      effects: { belief_adoption: +0.08, cohesion: -0.05 },
      emotionalImpact: { despair: +0.20, anger: +0.10 },
    },
    cultural: {
      name:    'حدث ثقافي',
      effects: { memetic_velocity: +0.20, cohesion: +0.05 },
      emotionalImpact: { pride: +0.15, solidarity: +0.10 },
    },
    informational: {
      name:    'حدث معلوماتي',
      effects: { narrative_volatility: +0.25, belief_adoption: +0.12 },
      emotionalImpact: { fear: +0.05, anger: +0.20 },
    },
  };

  const tpl = templates[type];
  return {
    id:             `${type}_${Date.now()}`,
    type,
    name:           tpl.name!,
    totalDuration:  durationTicks,
    remainingTicks: durationTicks,  // ← يبدأ بالقيمة الكاملة لا بصفر
    intensity:      1.0,
    effects:        tpl.effects    ?? {},
    emotionalImpact:tpl.emotionalImpact ?? {},
  };
}

// ─── تطبيق الأحداث في كل tick ─────────────────────────────
export function processEvents(
  activeEvents: SimEvent[],
  metrics: Record<string, number>,
  agents: any[]
): { updatedEvents: SimEvent[]; updatedMetrics: Record<string, number> } {

  const newMetrics = { ...metrics };
  const updatedEvents: SimEvent[] = [];

  for (const event of activeEvents) {
    // ← احسب أولاً، ثم تحقق إن انتهى

    // شدة التأثير تتلاشى تدريجياً مع الوقت (Fade-out)
    const progress   = event.remainingTicks / event.totalDuration; // 1.0 → 0.0
    const currentIntensity = event.intensity * Math.sqrt(progress); // تلاشٍ ناعم

    // طبّق التأثيرات على المقاييس
    for (const [key, delta] of Object.entries(event.effects)) {
      if (delta === undefined) continue;
      const current = newMetrics[key] ?? 0;
      newMetrics[key] = Math.max(0, Math.min(1, current + delta * currentIntensity * 0.01));
    }

    // طبّق التأثير العاطفي على عينة من الوكلاء
    if (event.emotionalImpact && agents.length > 0) {
      const sampleSize = Math.min(50, Math.floor(agents.length * 0.1));
      const sample     = agents.sort(() => Math.random() - 0.5).slice(0, sampleSize);
      sample.forEach(agent => {
        if (!agent.emotionalState || typeof agent.emotionalState !== 'object') return;
        for (const [emo, delta] of Object.entries(event.emotionalImpact!)) {
          if (delta === undefined) continue;
          agent.emotionalState[emo] = Math.max(0, Math.min(1,
            (agent.emotionalState[emo] ?? 0) + (delta as number) * currentIntensity * 0.1
          ));
        }
      });
    }

    // تناقص المدة
    const newRemaining = event.remainingTicks - 1;

    if (newRemaining > 0) {
      updatedEvents.push({ ...event, remainingTicks: newRemaining });
    }
    // إذا newRemaining === 0، الحدث ينتهي — لا يُضاف للقائمة
  }

  return { updatedEvents, updatedMetrics: newMetrics };
}
```

### تعديل حلقة الـ tick لاستخدام النظام الجديد:

```typescript
// في src/simulation/tick.ts — في نهاية دالة step():

// قبل:
activeEvents.forEach(e => applyEvent(e));  // يطبق ثم يُزيل فوراً

// بعد:
const { updatedEvents, updatedMetrics } = processEvents(
  state.activeEvents,
  state.metrics,
  state.agents
);
state.activeEvents = updatedEvents;
state.metrics      = updatedMetrics;
```

### تعديل زر تفعيل الحدث في الواجهة:

```typescript
// في EventPanel.tsx أو حيثما يوجد زر تفعيل الأحداث:

// قبل:
const handleEventClick = (type: string) => {
  addEvent({ type, effects: EVENT_EFFECTS[type] });  // بدون duration
};

// بعد:
const handleEventClick = (type: SimEvent['type']) => {
  const newEvent = createEvent(type, 300); // 300 tick = مدة معقولة
  setSimState(prev => ({
    ...prev,
    activeEvents: [...prev.activeEvents, newEvent],
  }));
};
```

---

## BUG #4 — `belief_adoption: 92.5%` — قيمة غير منطقية

**من JSON:** `belief_adoption: 0.925` مع أن 22 متطرف و5 صامدون موجودون.

هذا يكشف أن `belief_adoption` يُحسب كـ نسبة الـ "moderate" (91.9%) بدل قياس معدل تغيير المعتقدات.

```typescript
// الخطأ:
belief_adoption = moderateAgents.length / totalAgents  // ← هذا ليس belief adoption

// الصحيح:
belief_adoption = agentsWhoChangedBeliefThisTick / totalAgents
// أو:
belief_adoption = (agents.filter(a => a.beliefChangedInLastNTicks).length) / totalAgents
```

---

## ترتيب التطبيق

```
الخطوة 1 — إصلاح emotionalCounts         (5 دقائق)
  → ابحث عن كل مكان يستخدم agent.emotionalState كـ key
  → استبدله بـ dominantEmotion(agent.emotionalState)

الخطوة 2 — نسخ AgentInspector.tsx        (2 دقائق)
  → احذف الملف القديم
  → انسخ الكود الجديد بالكامل

الخطوة 3 — تمرير selectedAgent من Canvas  (5 دقائق)
  → أضف onAgentSelect prop للـ Canvas
  → أضف handleCanvasClick بالكود المذكور
  → مرر selectedAgent للـ AgentInspector

الخطوة 4 — استبدال eventSystem.ts         (3 دقائق)
  → احذف الكود القديم
  → انسخ processEvents و createEvent
  → عدّل handleEventClick ليستخدم createEvent(type, 300)

الخطوة 5 — تعديل حلقة الـ tick           (3 دقائق)
  → استبدل استدعاء الأحداث القديم بـ processEvents
```

---

## النتيجة المتوقعة في JSON بعد الإصلاح

```json
{
  "tick": 500,
  "emotionalDistribution": {
    "anger":      312,
    "fear":       98,
    "hope":       284,
    "despair":    156,
    "solidarity": 94,
    "pride":      56
  },
  "activeEvents": [
    {
      "id": "political_1716500000",
      "type": "political",
      "remainingTicks": 287,
      "totalDuration": 300,
      "intensity": 0.978
    }
  ]
}
```

**علامات نجاح الإصلاح:**
- `[object Object]` اختفى تماماً
- الأحداث تستمر عشرات الـ ticks لا تختفي فوراً
- النقر على الوكيل في Canvas يفتح بطاقته
- البحث يُعيد نتائج حقيقية
