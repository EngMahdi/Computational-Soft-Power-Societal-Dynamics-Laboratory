use serde::{Deserialize, Serialize};

/// الملصقات العاطفية المركبة
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EmotionLabel {
    Calm,
    Fear,
    Anger,
    Hope,
    Pride,
    Despair,
    Solidarity,
    // حالات مركبة
    RageDespair,         // fear + anger + low_hope
    CollectiveVigilance, // high_solidarity + high_fear
    Apathetic,           // low everything
    Anxious,
}

impl EmotionLabel {
    pub fn emoji(&self) -> &'static str {
        match self {
            EmotionLabel::Calm => "😐",
            EmotionLabel::Fear => "😨",
            EmotionLabel::Anger => "😡",
            EmotionLabel::Hope => "🙏",
            EmotionLabel::Pride => "😤",
            EmotionLabel::Despair => "😔",
            EmotionLabel::Solidarity => "🤝",
            EmotionLabel::RageDespair => "💥",
            EmotionLabel::CollectiveVigilance => "👁️",
            EmotionLabel::Apathetic => "😶",
            EmotionLabel::Anxious => "😰",
        }
    }
}

/// معدلات الاضمحلال لكل عاطفة
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionalDecay {
    pub fear: f32,
    pub anger: f32,
    pub hope: f32,
    pub pride: f32,
    pub despair: f32,
    pub solidarity: f32,
}

impl EmotionalDecay {
    /// القيم الافتراضية — الخوف يضمحل ببطء، الغضب أسرع / Faster
    pub fn default() -> Self {
        Self {
            fear: 0.02,
            anger: 0.05,
            hope: 0.04,
            pride: 0.03,
            despair: 0.01,
            solidarity: 0.03,
        }
    }
}

/// الحالة العاطفية متعددة الأبعاد — 6 أبعاد أساسية
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionalState {
    pub fear: f32,
    pub anger: f32,
    pub hope: f32,
    pub pride: f32,
    pub despair: f32,
    pub solidarity: f32,
    pub decay_rates: EmotionalDecay,
}

impl EmotionalState {
    pub fn new() -> Self {
        Self {
            fear: 0.0,
            anger: 0.0,
            hope: 0.3,
            pride: 0.2,
            despair: 0.0,
            solidarity: 0.3,
            decay_rates: EmotionalDecay::default(),
        }
    }

    /// تطبيق الاضمحلال الطبيعي — التعب العاطفي
    pub fn update(&mut self, dt: f32) {
        self.fear *= 1.0 - (self.decay_rates.fear * dt);
        self.anger *= 1.0 - (self.decay_rates.anger * dt);
        self.hope *= 1.0 - (self.decay_rates.hope * dt);
        self.despair *= 1.0 - (self.decay_rates.despair * dt);
        self.pride *= 1.0 - (self.decay_rates.pride * dt);
        self.solidarity *= 1.0 - (self.decay_rates.solidarity * dt);
        self.clamp_all();
    }

    /// ضبط جميع القيم ضمن [0, 1]
    pub fn clamp_all(&mut self) {
        self.fear = self.fear.clamp(0.0, 1.0);
        self.anger = self.anger.clamp(0.0, 1.0);
        self.hope = self.hope.clamp(0.0, 1.0);
        self.pride = self.pride.clamp(0.0, 1.0);
        self.despair = self.despair.clamp(0.0, 1.0);
        self.solidarity = self.solidarity.clamp(0.0, 1.0);
    }

    /// تطبيق شحنة عاطفية من إشارة
    pub fn apply_charge(&mut self, charge: &crate::core::signal::EmotionalCharge, strength: f32) {
        match charge {
            crate::core::signal::EmotionalCharge::Fear => self.fear = (self.fear + strength * 0.3).min(1.0),
            crate::core::signal::EmotionalCharge::Anger => self.anger = (self.anger + strength * 0.3).min(1.0),
            crate::core::signal::EmotionalCharge::Hope => self.hope = (self.hope + strength * 0.3).min(1.0),
            crate::core::signal::EmotionalCharge::Pride => self.pride = (self.pride + strength * 0.3).min(1.0),
            crate::core::signal::EmotionalCharge::Solidarity => self.solidarity = (self.solidarity + strength * 0.3).min(1.0),
            crate::core::signal::EmotionalCharge::Suppress => {
                // الكبت يُضعف الأمل والفخر
                self.hope = (self.hope - strength * 0.2).max(0.0);
                self.pride = (self.pride - strength * 0.2).max(0.0);
            }
            crate::core::signal::EmotionalCharge::Amplify => {
                // التضخيم يُقوّي كل المشاعر
                self.fear = (self.fear + strength * 0.1).min(1.0);
                self.anger = (self.anger + strength * 0.1).min(1.0);
            }
            crate::core::signal::EmotionalCharge::Neutral => {}
        }
    }

    /// العاطفة السائدة — المستخدمة في الواجهة
    pub fn dominant(&self) -> EmotionLabel {
        // حالات مركبة
        if self.fear > 0.7 && self.anger > 0.5 && self.hope < 0.2 {
            return EmotionLabel::RageDespair;
        }
        if self.solidarity > 0.7 && self.fear > 0.6 {
            return EmotionLabel::CollectiveVigilance;
        }
        if self.hope < 0.1 && self.pride < 0.1 && self.solidarity < 0.1 {
            return EmotionLabel::Apathetic;
        }

        // الحالة الأقوى
        let mut max_val = self.fear;
        let mut dominant = EmotionLabel::Fear;

        if self.anger > max_val { max_val = self.anger; dominant = EmotionLabel::Anger; }
        if self.hope > max_val { max_val = self.hope; dominant = EmotionLabel::Hope; }
        if self.pride > max_val { max_val = self.pride; dominant = EmotionLabel::Pride; }
        if self.despair > max_val { max_val = self.despair; dominant = EmotionLabel::Despair; }
        if self.solidarity > max_val { max_val = self.solidarity; dominant = EmotionLabel::Solidarity; }

        if max_val < 0.15 {
            EmotionLabel::Calm
        } else if self.fear > 0.4 && self.anger < 0.3 {
            EmotionLabel::Anxious
        } else {
            dominant
        }
    }
}