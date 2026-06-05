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
    despair?:    number;
    pride?:      number;
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
      const sample     = [...agents].sort(() => Math.random() - 0.5).slice(0, sampleSize);
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
