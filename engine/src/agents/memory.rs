use serde::{Deserialize, Serialize};

/// معرف حدث صادم
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Hash, Eq)]
pub struct EventId(pub String);

/// معرف وكيل
pub type AgentId = usize;

/// معتقد مخزَّن في الذاكرة الطويلة الأمد
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Belief {
    pub name: String,
    pub strength: f32,        // 0.0 - 1.0
    pub formation_tick: u64,  // متى تشكل
    pub source_ids: Vec<AgentId>, // من أثر فيه
}

/// سجل حدث صادم في الذاكرة
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraumaEvent {
    pub event_id: EventId,
    pub event_type: String,
    pub year: u32,
    pub personal_impact: f32,  // 0.0 - 1.0
    pub memory_strength: f32,  // 0.0 - 1.0 (يضمحل مع الوقت)
}

/// ذاكرة الوكيل الكاملة
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMemory {
    /// الذاكرة قصيرة الأمد — آخر المصادر التي تفاعل معها
    pub short_term: Vec<AgentId>,

    /// المعتقدات المخزَّنة طويلة الأمد
    pub long_term_beliefs: Vec<Belief>,

    /// الأحداث الصادمة التي مرَّ بها
    pub trauma_events: Vec<TraumaEvent>,

    /// سجل التعرض للمعلومات
    pub exposure_count: std::collections::HashMap<String, u32>,
}

impl AgentMemory {
    pub fn new() -> Self {
        Self {
            short_term: Vec::with_capacity(10),
            long_term_beliefs: Vec::new(),
            trauma_events: Vec::new(),
            exposure_count: std::collections::HashMap::new(),
        }
    }

    /// إضافة مصدر للذاكرة قصيرة الأمد (آخر 10)
    pub fn remember_source(&mut self, source_id: AgentId) {
        if self.short_term.len() >= 10 {
            self.short_term.remove(0);
        }
        if !self.short_term.contains(&source_id) {
            self.short_term.push(source_id);
        }
    }

    /// هل المصدر موثوق (موجود في الذاكرة طويلة الأمد)؟
    pub fn is_trusted_source(&self, source_id: AgentId) -> bool {
        self.long_term_beliefs
            .iter()
            .any(|b| b.source_ids.contains(&source_id))
    }

    /// إضافة معتقد جديد أو تحديث موجود
    pub fn add_or_update_belief(&mut self, name: &str, strength: f32, tick: u64, source_id: AgentId) {
        if let Some(belief) = self.long_term_beliefs.iter_mut().find(|b| b.name == name) {
            // تحديث معتقد موجود
            belief.strength = (belief.strength + strength) / 2.0;
            if !belief.source_ids.contains(&source_id) {
                belief.source_ids.push(source_id);
            }
        } else {
            self.long_term_beliefs.push(Belief {
                name: name.to_string(),
                strength,
                formation_tick: tick,
                source_ids: vec![source_id],
            });
        }
    }

    /// إضافة حدث صادم
    pub fn add_trauma_event(&mut self, event_id: EventId, event_type: &str, year: u32, impact: f32) {
        if !self.trauma_events.iter().any(|t| t.event_id == event_id) {
            self.trauma_events.push(TraumaEvent {
                event_id,
                event_type: event_type.to_string(),
                year,
                personal_impact: impact,
                memory_strength: 1.0,
            });
        }
    }

    /// تسجيل التعرض لمعلومة
    pub fn record_exposure(&mut self, info_key: &str) {
        *self.exposure_count.entry(info_key.to_string()).or_insert(0) += 1;
    }

    /// عدد مرات التعرض لمعلومة
    pub fn exposure_frequency(&self, info_key: &str) -> u32 {
        *self.exposure_count.get(info_key).unwrap_or(&0)
    }

    /// تطبيق اضمحلال الذاكرة مع تقدم الزمن
    pub fn apply_decay(&mut self, dt: f32) {
        for trauma in &mut self.trauma_events {
            trauma.memory_strength *= 1.0 - (0.001 * dt);
        }
        // الاحتفاظ بالذاكرة القوية فقط (> 0.1)
        self.trauma_events.retain(|t| t.memory_strength > 0.1);
    }
}