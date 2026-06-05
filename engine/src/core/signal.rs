use serde::{Deserialize, Serialize};
use crate::agents::age::AgeGroup;

/// نوع الإشارة التي تمر عبر الشبكة بين الوكلاء
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Signal {
    pub source_id: usize,
    pub target_id: usize,
    pub source_theory: String,
    pub belief_delta: f32,           // تغيير المعتقد
    pub strength: f32,               // قوة الإشارة (0.0 - 1.0)
    pub credibility_gap: f32,        // فجوة المصداقية
    pub social_pressure: f32,        // الضغط الاجتماعي
    pub emotional_charge: EmotionalCharge,
    pub target_age_preference: Option<AgeGroup>, // الفئة العمرية المستهدفة
}

/// الشحنة العاطفية للإشارة
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EmotionalCharge {
    Neutral,
    Fear,
    Anger,
    Hope,
    Pride,
    Solidarity,
    Suppress,    // كبت / إسكات
    Amplify,     // تضخيم
}

impl EmotionalCharge {
    pub fn dominant_color(&self) -> &'static str {
        match self {
            EmotionalCharge::Neutral => "#888888",
            EmotionalCharge::Fear => "#ff4444",
            EmotionalCharge::Anger => "#ff8800",
            EmotionalCharge::Hope => "#44ff44",
            EmotionalCharge::Pride => "#ffdd00",
            EmotionalCharge::Solidarity => "#44aaff",
            EmotionalCharge::Suppress => "#8844aa",
            EmotionalCharge::Amplify => "#ff44ff",
        }
    }

    pub fn intensity_multiplier(&self) -> f32 {
        match self {
            EmotionalCharge::Fear => 1.4,
            EmotionalCharge::Anger => 1.3,
            EmotionalCharge::Hope => 0.8,
            EmotionalCharge::Pride => 0.9,
            EmotionalCharge::Solidarity => 1.1,
            EmotionalCharge::Suppress => 0.6,
            EmotionalCharge::Amplify => 1.5,
            EmotionalCharge::Neutral => 1.0,
        }
    }
}

/// مجموعة الإشارات التي تستقبلها وكيل معين
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSignals {
    pub agent_id: usize,
    pub signals: Vec<Signal>,
}

impl AgentSignals {
    pub fn new(agent_id: usize) -> Self {
        Self {
            agent_id,
            signals: Vec::new(),
        }
    }

    /// متوسط قوة الإشارات المستقبلة
    pub fn average_strength(&self) -> f32 {
        if self.signals.is_empty() {
            return 0.0;
        }
        self.signals.iter().map(|s| s.strength).sum::<f32>() / self.signals.len() as f32
    }

    /// الشحنة العاطفية السائدة
    pub fn dominant_charge(&self) -> EmotionalCharge {
        let mut counts = std::collections::HashMap::new();
        for signal in &self.signals {
            *counts.entry(format!("{:?}", signal.emotional_charge)).or_insert(0) += 1;
        }
        counts.into_iter()
            .max_by_key(|&(_, count)| count)
            .map(|(key, _)| match key.as_str() {
                "Fear" => EmotionalCharge::Fear,
                "Anger" => EmotionalCharge::Anger,
                "Hope" => EmotionalCharge::Hope,
                "Pride" => EmotionalCharge::Pride,
                "Solidarity" => EmotionalCharge::Solidarity,
                "Suppress" => EmotionalCharge::Suppress,
                "Amplify" => EmotionalCharge::Amplify,
                _ => EmotionalCharge::Neutral,
            })
            .unwrap_or(EmotionalCharge::Neutral)
    }
}

/// نتيجة انتشار الإشارات عبر الشبكة
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalPropagationResult {
    pub signals: Vec<Signal>,
    pub agent_signals: Vec<AgentSignals>,
    pub total_signals_sent: usize,
    pub average_path_length: f32,
}

impl SignalPropagationResult {
    pub fn new() -> Self {
        Self {
            signals: Vec::new(),
            agent_signals: Vec::new(),
            total_signals_sent: 0,
            average_path_length: 0.0,
        }
    }

    /// جمع الإشارات لوكيل معين
    pub fn for_agent(&self, agent_id: usize) -> Vec<Signal> {
        self.agent_signals
            .iter()
            .find(|asig| asig.agent_id == agent_id)
            .map(|asig| asig.signals.clone())
            .unwrap_or_default()
    }

    /// عدد الإشارات الموجهة لوكيل معين
    pub fn count_for(&self, agent_id: usize) -> usize {
        self.for_agent(agent_id).len()
    }
}