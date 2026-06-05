# UPGRADE 3.0 — كود جاهز للتطبيق المباشر
## تعليمات لـ AI Coding Agent — كل قسم = ملف واحد تعدّله أو تنشئه

**أولوية التطبيق:** اتبع الأقسام بالترتيب بدقة. لا تتجاوز قسماً.

---

## BUG FIX #1 — الأهم: إصلاح انهيار الحالة العاطفية

**المشكلة:** كل الوكلاء يصبحون fearful ولا يخرجون منها أبداً.
**السبب:** لا يوجد decay للعاطفة، ولا تعدد في الحالات.

### الملف المطلوب تعديله: `src/types/agent.ts` (أو ما يعادله)

```typescript
// احذف هذا (أو ما يشبهه):
// emotionalState: "fearful" | "angry" | "hopeful"  ← خاطئ

// ضع هذا بدلاً منه:
export interface EmotionalState {
  fear:       number; // 0.0 – 1.0
  anger:      number;
  hope:       number;
  pride:      number;
  despair:    number;
  solidarity: number;
}

export function defaultEmotionalState(): EmotionalState {
  return { fear: 0.1, anger: 0.05, hope: 0.3, pride: 0.2, despair: 0.1, solidarity: 0.25 };
}

export function dominantEmotion(e: EmotionalState): string {
  const entries = Object.entries(e) as [string, number][];
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

// decay كل tick — بدونه تبقى العاطفة مجمّدة
export function decayEmotions(e: EmotionalState, dt: number = 1): EmotionalState {
  const DECAY = { fear: 0.008, anger: 0.010, hope: 0.005, pride: 0.004, despair: 0.007, solidarity: 0.006 };
  return {
    fear:       Math.max(0, e.fear       - DECAY.fear       * dt),
    anger:      Math.max(0, e.anger      - DECAY.anger      * dt),
    hope:       Math.max(0, e.hope       - DECAY.hope       * dt),
    pride:      Math.max(0, e.pride      - DECAY.pride      * dt),
    despair:    Math.max(0, e.despair    - DECAY.despair    * dt),
    solidarity: Math.max(0, e.solidarity - DECAY.solidarity * dt),
  };
}
```

---

### الملف: `src/simulation/tick.ts` (أو حلقة الـ tick الرئيسية)

```typescript
// في نهاية كل tick، أضف هذا السطر لكل وكيل:
agents = agents.map(agent => ({
  ...agent,
  emotionalState: decayEmotions(agent.emotionalState),
}));

// وعند جمع الإحصاء، استخدم dominantEmotion بدل قيمة ثابتة:
const emotionalCounts = agents.reduce((acc, agent) => {
  const dominant = dominantEmotion(agent.emotionalState);
  acc[dominant] = (acc[dominant] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

---

## FEATURE #1 — نظام الأعمار

### ملف جديد: `src/types/age.ts`

```typescript
export type AgeGroup = "teen" | "youth" | "adult" | "elder";

export interface AgeProfile {
  group: AgeGroup;
  age:   number;
}

export function randomAgeProfile(): AgeProfile {
  // توزيع عراقي واقعي: 20% مراهق، 33% شاب، 30% بالغ، 17% كبير
  const rand = Math.random();
  if (rand < 0.20) return { group: "teen",  age: 13 + Math.floor(Math.random() * 7) };
  if (rand < 0.53) return { group: "youth", age: 20 + Math.floor(Math.random() * 15) };
  if (rand < 0.83) return { group: "adult", age: 35 + Math.floor(Math.random() * 20) };
  return              { group: "elder", age: 55 + Math.floor(Math.random() * 25) };
}

// مدى قبول التأثير الخارجي
export function susceptibility(ag: AgeProfile): number {
  return { teen: 1.35, youth: 1.10, adult: 0.85, elder: 0.70 }[ag.group];
}

// مدى التأثير على الآخرين (السلطة الاجتماعية)
export function socialAuthority(ag: AgeProfile): number {
  return { teen: 0.60, youth: 0.95, adult: 1.10, elder: 1.25 }[ag.group];
}

// مصدر المعلومات الأساسي
export function primaryInfoSource(ag: AgeProfile): string {
  return {
    teen:  "tiktok_instagram",
    youth: "telegram_twitter",
    adult: "tv_whatsapp",
    elder: "mosque_oral",
  }[ag.group];
}

// خوف الانهيار — مرتبط بالذاكرة التاريخية
export function collapseFeaBaseline(ag: AgeProfile): number {
  return { teen: 0.25, youth: 0.45, adult: 0.70, elder: 0.85 }[ag.group];
}

// لون العرض على الـ Canvas
export function ageColor(ag: AgeProfile): string {
  return { teen: "#60a5fa", youth: "#34d399", adult: "#f59e0b", elder: "#a78bfa" }[ag.group];
}
```

### تعديل ملف: `src/types/agent.ts`

```typescript
// أضف للـ Agent interface:
import { AgeProfile } from "./age";

export interface Agent {
  // ... الحقول الموجودة ...
  ageProfile:     AgeProfile;    // أضف هذا
  emotionalState: EmotionalState; // عدّل هذا ليستخدم النوع الجديد
  memory: {
    shortTerm:     number[];  // آخر 10 IDs تفاعل معها
    traumaEvents:  string[];  // أحداث صادمة مرت على هذا الوكيل
  };
}
```

### تعديل دالة إنشاء الوكيل (حيثما تُنشأ الوكلاء):

```typescript
import { randomAgeProfile } from "../types/age";
import { defaultEmotionalState } from "../types/agent";

// في دالة createAgent أو initAgents:
const agent: Agent = {
  id: i,
  // ... الحقول الموجودة ...
  ageProfile:     randomAgeProfile(),
  emotionalState: defaultEmotionalState(),
  memory: { shortTerm: [], traumaEvents: [] },
};
```

---

## FEATURE #2 — Agent Inspector (اختيار + بحث + بطاقة)

### ملف جديد: `src/components/AgentInspector.tsx`

```tsx
import React, { useState, useMemo } from "react";
import { Agent } from "../types/agent";
import { dominantEmotion } from "../types/agent";
import { ageColor } from "../types/age";
import AgentInjectionPanel from "./AgentInjectionPanel";

interface Props {
  agents:   Agent[];
  onInject: (agentId: number, injection: AgentInjection) => void;
}

export default function AgentInspector({ agents, onInject }: Props) {
  const [query,    setQuery]    = useState("");
  const [selected, setSelected] = useState<Agent | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return agents.filter(a =>
      String(a.id).includes(q)              ||
      a.state.toLowerCase().includes(q)     ||
      a.ageProfile.group.includes(q)        ||
      (a.location?.district ?? "").toLowerCase().includes(q)
    ).slice(0, 20);
  }, [query, agents]);

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>🔍 فحص الوكلاء</h3>

      {/* شريط البحث */}
      <input
        style={styles.searchInput}
        placeholder="ابحث بـ ID، حالة، عمر، منطقة..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        dir="rtl"
      />

      {/* نتائج البحث */}
      {results.length > 0 && (
        <div style={styles.results}>
          {results.map(a => (
            <div key={a.id} style={styles.resultRow} onClick={() => setSelected(a)}>
              <span style={{ color: ageColor(a.ageProfile), fontWeight: "bold" }}>
                #{a.id}
              </span>
              <span style={styles.badge}>{a.ageProfile.group}</span>
              <span style={styles.badge}>{a.state}</span>
              <span style={{ color: "#9ca3af", fontSize: 11 }}>
                {dominantEmotion(a.emotionalState)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* بطاقة الوكيل المختار */}
      {selected && (
        <AgentCard
          agent={selected}
          onClose={() => setSelected(null)}
          onInject={(inj) => onInject(selected.id, inj)}
        />
      )}
    </div>
  );
}

// ─── بطاقة الوكيل ───────────────────────────────────────────
function AgentCard({ agent, onClose, onInject }: {
  agent:    Agent;
  onClose:  () => void;
  onInject: (inj: AgentInjection) => void;
}) {
  const [showInject, setShowInject] = useState(false);
  const em = agent.emotionalState;

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <span style={{ color: ageColor(agent.ageProfile), fontWeight: "bold" }}>
          وكيل #{agent.id} — {agent.ageProfile.age} سنة ({agent.ageProfile.group})
        </span>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
      </div>

      {/* الحالة الحالية */}
      <Row label="الحالة"     value={agent.state} />
      <Row label="العاطفة"    value={dominantEmotion(em)} />
      {agent.location && <Row label="الموقع" value={`${agent.location.province} / ${agent.location.district}`} />}

      {/* الحالة العاطفية — شرائط */}
      <div style={styles.section}>الحالة العاطفية</div>
      <EmotionBar label="خوف"        value={em.fear}       color="#ef4444" />
      <EmotionBar label="غضب"        value={em.anger}      color="#f97316" />
      <EmotionBar label="أمل"        value={em.hope}       color="#22c55e" />
      <EmotionBar label="فخر"        value={em.pride}      color="#3b82f6" />
      <EmotionBar label="يأس"        value={em.despair}    color="#6b7280" />
      <EmotionBar label="تضامن"      value={em.solidarity} color="#a855f7" />

      {/* السمات النفسية */}
      {agent.mind && (
        <>
          <div style={styles.section}>السمات النفسية</div>
          {Object.entries(agent.mind).map(([k, v]) => (
            <EmotionBar key={k} label={k} value={v as number} color="#60a5fa" />
          ))}
        </>
      )}

      {/* الذاكرة */}
      {agent.memory?.shortTerm?.length > 0 && (
        <>
          <div style={styles.section}>الذاكرة القصيرة (آخر تفاعلات)</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            {agent.memory.shortTerm.join(", ")}
          </div>
        </>
      )}

      {/* زر الحقن */}
      <button style={styles.injectBtn} onClick={() => setShowInject(!showInject)}>
        {showInject ? "إغلاق الحقن" : "💉 حقن معلومات / سلوك"}
      </button>

      {showInject && <AgentInjectionPanel agent={agent} onInject={onInject} />}
    </div>
  );
}

// ─── مكونات مساعدة ────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
      <span style={{ color: "#9ca3af" }}>{label}</span>
      <span style={{ color: "#e5e7eb" }}>{value}</span>
    </div>
  );
}

function EmotionBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <span style={{ color: "#9ca3af" }}>{label}</span>
        <span style={{ color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div style={{ background: "#1f2937", borderRadius: 4, height: 5 }}>
        <div style={{ width: `${value * 100}%`, background: color, height: 5, borderRadius: 4,
          transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// ─── أنماط ────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  panel:       { width: 280, background: "#111827", padding: 12, borderRadius: 8,
                  border: "1px solid #374151", fontFamily: "monospace", direction: "rtl" },
  title:       { color: "#f9fafb", fontSize: 14, marginBottom: 8 },
  searchInput: { width: "100%", background: "#1f2937", border: "1px solid #374151",
                  color: "#f9fafb", borderRadius: 6, padding: "6px 10px", fontSize: 12,
                  outline: "none", boxSizing: "border-box" },
  results:     { maxHeight: 200, overflowY: "auto", marginTop: 6 },
  resultRow:   { display: "flex", gap: 6, alignItems: "center", padding: "5px 4px",
                  cursor: "pointer", borderRadius: 4,
                  borderBottom: "1px solid #1f2937", fontSize: 12 },
  badge:       { background: "#1f2937", padding: "1px 6px", borderRadius: 4,
                  fontSize: 10, color: "#9ca3af" },
  card:        { marginTop: 10, background: "#1f2937", borderRadius: 8,
                  padding: 12, border: "1px solid #374151" },
  cardHeader:  { display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 10 },
  closeBtn:    { background: "none", border: "none", color: "#9ca3af",
                  cursor: "pointer", fontSize: 16 },
  section:     { color: "#6b7280", fontSize: 10, textTransform: "uppercase",
                  marginTop: 10, marginBottom: 6, borderBottom: "1px solid #374151",
                  paddingBottom: 3 },
  injectBtn:   { width: "100%", marginTop: 12, background: "#7c3aed", border: "none",
                  color: "white", padding: "7px 0", borderRadius: 6,
                  cursor: "pointer", fontSize: 12 },
};

export type { AgentInjection };
export interface AgentInjection {
  type:             "belief_shift" | "emotional_trigger" | "info_exposure" | "trauma" | "resistance_boost";
  narrative?:       string;
  emotionDeltas?:   Partial<EmotionalState>;
  beliefDeltas?:    Partial<Record<string, number>>;
  durationTicks:    number;
  spreadToNetwork:  boolean;
  spreadRadius:     number;
}
```

---

## FEATURE #3 — لوحة حقن الوكلاء

### ملف جديد: `src/components/AgentInjectionPanel.tsx`

```tsx
import React, { useState } from "react";
import { Agent } from "../types/agent";
import { AgentInjection } from "./AgentInspector";

interface Props {
  agent:    Agent;
  onInject: (inj: AgentInjection) => void;
}

export default function AgentInjectionPanel({ agent, onInject }: Props) {
  const [type,     setType]     = useState<AgentInjection["type"]>("info_exposure");
  const [text,     setText]     = useState("");
  const [duration, setDuration] = useState(100);
  const [spread,   setSpread]   = useState(false);
  const [radius,   setRadius]   = useState(2);

  // تحويل نوع الحقن إلى تأثيرات عاطفية تلقائية
  const autoEmotionDeltas = (): Partial<Record<string, number>> => ({
    info_exposure:    { fear: +0.15, anger: +0.10 },
    emotional_trigger:{ fear: +0.30, solidarity: -0.10 },
    belief_shift:     {},
    trauma:           { fear: +0.40, despair: +0.25, hope: -0.20 },
    resistance_boost: { fear: -0.10, pride: +0.20, solidarity: +0.15 },
  }[type] ?? {});

  const handleInject = () => {
    if (!text.trim() && type !== "resistance_boost") return;
    onInject({
      type,
      narrative:      text,
      emotionDeltas:  autoEmotionDeltas() as any,
      durationTicks:  duration,
      spreadToNetwork:spread,
      spreadRadius:   radius,
    });
    setText("");
  };

  const injectionTypes: { value: AgentInjection["type"]; label: string; icon: string }[] = [
    { value: "info_exposure",    label: "تعريض لمعلومة",    icon: "📰" },
    { value: "emotional_trigger",label: "إثارة عاطفية",     icon: "⚡" },
    { value: "belief_shift",     label: "تغيير معتقد",      icon: "🔄" },
    { value: "trauma",           label: "حدث صادم",         icon: "💔" },
    { value: "resistance_boost", label: "تعزيز مناعة",      icon: "🛡️" },
  ];

  return (
    <div style={{ marginTop: 10, direction: "rtl" }}>
      {/* نوع الحقن */}
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>نوع الحقن</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
        {injectionTypes.map(t => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            style={{
              padding: "4px 8px", fontSize: 10, borderRadius: 4, cursor: "pointer", border: "none",
              background: type === t.value ? "#7c3aed" : "#374151",
              color: type === t.value ? "white" : "#9ca3af",
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* النص / السردية */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="أدخل السردية أو المعلومة..."
        rows={3}
        style={{ width: "100%", background: "#111827", border: "1px solid #374151",
          color: "#f9fafb", borderRadius: 6, padding: 8, fontSize: 11,
          resize: "none", outline: "none", boxSizing: "border-box" }}
        dir="rtl"
      />

      {/* مدة التأثير */}
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
        مدة التأثير: {duration} tick
      </div>
      <input type="range" min={10} max={500} step={10}
        value={duration} onChange={e => setDuration(+e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      {/* الانتشار الشبكي */}
      <label style={{ display: "flex", alignItems: "center", gap: 6,
        fontSize: 11, color: "#9ca3af", cursor: "pointer", marginBottom: 6 }}>
        <input type="checkbox" checked={spread}
          onChange={e => setSpread(e.target.checked)} />
        انشر في شبكة الوكيل
      </label>

      {spread && (
        <>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            نطاق الانتشار: {radius} قفزات
          </div>
          <input type="range" min={1} max={5} step={1}
            value={radius} onChange={e => setRadius(+e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
        </>
      )}

      {/* معاينة التأثير */}
      <div style={{ background: "#111827", borderRadius: 6, padding: 8,
        fontSize: 10, color: "#6b7280", marginBottom: 8 }}>
        <div style={{ color: "#9ca3af", marginBottom: 4 }}>معاينة التأثير:</div>
        {Object.entries(autoEmotionDeltas()).map(([k, v]) => (
          <div key={k} style={{ color: (v as number) > 0 ? "#ef4444" : "#22c55e" }}>
            {k}: {(v as number) > 0 ? "+" : ""}{((v as number) * 100).toFixed(0)}%
          </div>
        ))}
        {spread && (
          <div style={{ color: "#7c3aed", marginTop: 4 }}>
            📡 سيصل لـ ~{radius * 3} وكيل مجاور
          </div>
        )}
      </div>

      <button onClick={handleInject}
        style={{ width: "100%", background: "#059669", border: "none", color: "white",
          padding: "8px 0", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
        ⚡ تنفيذ الحقن الآن
      </button>
    </div>
  );
}
```

---

## FEATURE #4 — معالجة الحقن في المحاكاة

### تعديل ملف: `src/simulation/tick.ts` (أو المكان الذي يُطبَّق فيه تأثير الحقن)

```typescript
import { AgentInjection } from "../components/AgentInspector";

// أضف هذه الدالة:
export function applyInjection(
  agents: Agent[],
  targetId: number,
  injection: AgentInjection
): Agent[] {
  // جمع معرّفات المستهدفين
  const targets = new Set<number>([targetId]);

  // إذا طُلب الانتشار — أضف الجيران
  if (injection.spreadToNetwork) {
    const target = agents.find(a => a.id === targetId);
    if (target?.connections) {
      let frontier = [...(target.connections ?? [])];
      for (let r = 1; r < injection.spreadRadius; r++) {
        const next = frontier.flatMap(id =>
          agents.find(a => a.id === id)?.connections ?? []
        );
        frontier = next;
        next.forEach(id => targets.add(id));
      }
    }
  }

  return agents.map(agent => {
    if (!targets.has(agent.id)) return agent;

    // تطبيق التغييرات العاطفية
    const newEmotions = { ...agent.emotionalState };
    if (injection.emotionDeltas) {
      for (const [key, delta] of Object.entries(injection.emotionDeltas)) {
        const k = key as keyof typeof newEmotions;
        newEmotions[k] = Math.max(0, Math.min(1, (newEmotions[k] ?? 0) + (delta ?? 0)));
      }
    }

    // تطبيق تغييرات المعتقدات
    const newMind = { ...agent.mind };
    if (injection.beliefDeltas) {
      for (const [key, delta] of Object.entries(injection.beliefDeltas)) {
        if (key in newMind) {
          (newMind as any)[key] = Math.max(0, Math.min(1,
            ((newMind as any)[key] ?? 0.5) + (delta ?? 0)));
        }
      }
    }

    // تسجيل في الذاكرة القصيرة
    const shortTerm = [targetId, ...(agent.memory?.shortTerm ?? [])].slice(0, 10);

    return {
      ...agent,
      emotionalState: newEmotions,
      mind:           newMind,
      memory:         { ...agent.memory, shortTerm },
      // يستمر تأثير الحقن لـ N tick
      activeInjection: { type: injection.type, remainingTicks: injection.durationTicks },
    };
  });
}
```

---

## FEATURE #5 — ربط AgentInspector بالـ Canvas (اختيار بالنقر)

### تعديل ملف: `src/components/Canvas.tsx` (أو ما يرسم الشبكة)

```typescript
// أضف للـ Canvas component:

interface Props {
  agents:         Agent[];
  onAgentClick:   (agent: Agent) => void;   // ← أضف هذا
  agentPositions: Map<number, { x: number; y: number }>;
}

// داخل الـ canvas click handler:
const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const rect   = e.currentTarget.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const RADIUS = 8; // نصف قطر الوكيل على الشاشة

  for (const [id, pos] of agentPositions.entries()) {
    const dist = Math.hypot(mouseX - pos.x, mouseY - pos.y);
    if (dist < RADIUS) {
      const agent = agents.find(a => a.id === id);
      if (agent) { onAgentClick(agent); break; }
    }
  }
};

// أضف للـ canvas element:
// <canvas onClick={handleCanvasClick} style={{ cursor: "crosshair" }} ... />

// رسم ألوان الأعمار على الوكلاء:
import { ageColor } from "../types/age";

function drawAgent(ctx: CanvasRenderingContext2D, agent: Agent, pos: { x: number; y: number }) {
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = ageColor(agent.ageProfile);  // لون حسب الفئة العمرية
  ctx.fill();

  // هالة للوكلاء المحقونين
  if (agent.activeInjection) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
```

---

## FEATURE #6 — تحديث JSON export ليعكس البيانات الجديدة

### تعديل دالة `exportTick` (أينما كانت):

```typescript
export function buildTickSnapshot(world: WorldState) {
  return {
    tick:       world.tick,
    agentCount: world.agents.length,

    // إحصاء العواطف الحقيقية (لا مجرد "fearful: 1000")
    emotionalCounts: world.agents.reduce((acc, a) => {
      const dom = dominantEmotion(a.emotionalState);
      acc[dom] = (acc[dom] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),

    // توزيع الأعمار
    ageCounts: world.agents.reduce((acc, a) => {
      acc[a.ageProfile.group] = (acc[a.ageProfile.group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),

    // متوسط العواطف العالمي (لرسم الـ charts)
    emotionalAverages: {
      fear:       avg(world.agents, a => a.emotionalState.fear),
      anger:      avg(world.agents, a => a.emotionalState.anger),
      hope:       avg(world.agents, a => a.emotionalState.hope),
      despair:    avg(world.agents, a => a.emotionalState.despair),
      solidarity: avg(world.agents, a => a.emotionalState.solidarity),
    },

    agentStateStats: computeStateStats(world.agents),
    events:          world.recentEvents,
  };
}

function avg(agents: Agent[], fn: (a: Agent) => number): number {
  return agents.reduce((s, a) => s + fn(a), 0) / agents.length;
}
```

---

## FEATURE #7 — ربط الكل في App.tsx

### تعديل ملف: `src/App.tsx`

```tsx
import AgentInspector, { AgentInjection } from "./components/AgentInspector";
import { applyInjection } from "./simulation/tick";

// داخل الـ component:
const [inspectedAgent, setInspectedAgent] = useState<Agent | null>(null);

const handleInject = (agentId: number, injection: AgentInjection) => {
  setAgents(prev => applyInjection(prev, agentId, injection));
};

// في الـ JSX — أضف Inspector بجانب الـ Canvas:
<div style={{ display: "flex", gap: 16 }}>
  <Canvas
    agents={agents}
    agentPositions={agentPositions}
    onAgentClick={setInspectedAgent}
  />
  <AgentInspector
    agents={agents}
    onInject={handleInject}
  />
</div>

// عند بناء الـ UI — اربط الوكيل المختار من Canvas بالـ Inspector:
// عندما يُضغط على وكيل في الـ canvas، يظهر تلقائياً في الـ Inspector
```

---

## ترتيب تطبيق الملفات (للـ AI Coding Agent)

```
الخطوة 1 — src/types/agent.ts
  → أضف EmotionalState interface
  → أضف defaultEmotionalState()
  → أضف dominantEmotion()
  → أضف decayEmotions()
  → أضف memory و ageProfile للـ Agent interface

الخطوة 2 — src/types/age.ts  (ملف جديد)
  → انسخ الكود كاملاً

الخطوة 3 — src/simulation/tick.ts
  → أضف decayEmotions لكل وكيل في نهاية كل tick
  → عدّل emotionalCounts ليستخدم dominantEmotion
  → أضف applyInjection function

الخطوة 4 — src/components/AgentInjectionPanel.tsx  (ملف جديد)
  → انسخ الكود كاملاً

الخطوة 5 — src/components/AgentInspector.tsx  (ملف جديد)
  → انسخ الكود كاملاً

الخطوة 6 — src/components/Canvas.tsx
  → أضف onAgentClick prop
  → أضف handleCanvasClick
  → عدّل drawAgent ليستخدم ageColor

الخطوة 7 — src/App.tsx
  → أضف handleInject
  → أضف AgentInspector للـ JSX
  → اربط onAgentClick بـ Inspector
```

---

## النتيجة المتوقعة في JSON بعد التطبيق

```json
{
  "tick": 2801,
  "emotionalCounts": {
    "anger":      28,
    "fear":       15,
    "hope":       22,
    "despair":    14,
    "solidarity": 13,
    "pride":       8
  },
  "ageCounts": {
    "teen":  19,
    "youth": 34,
    "adult": 30,
    "elder": 17
  },
  "emotionalAverages": {
    "fear":       0.18,
    "anger":      0.24,
    "hope":       0.31,
    "despair":    0.19,
    "solidarity": 0.22
  }
}
```

**هذا هو الشكل الصحيح — لا fearful: 100 بعد الآن.**
