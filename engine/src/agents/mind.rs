use serde::{Deserialize, Serialize};
use crate::core::signal::{Signal, EmotionalCharge};

/// السمات الشخصية الـ12 للوكيل — كلها تؤثر فعلياً في معالجة الإشارات
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMind {
    pub openness: f32,
    pub skepticism: f32,
    pub conformity: f32,
    pub tribalism: f32,
    pub aggression: f32,
    pub prestige_seeking: f32,
    pub fear_sensitivity: f32,
    pub emotionality: f32,
    pub cognitive_flexibility: f32,
    pub ideological_rigidity: f32,
    pub attention_span: f32,
    pub trust_in_institutions: f32,
}

impl AgentMind {
    pub fn random() -> Self {
        Self {
            openness: rand::random::<f32>(),
            skepticism: rand::random::<f32>(),
            conformity: rand::random::<f32>(),
            tribalism: rand::random::<f32>(),
            aggression: rand::random::<f32>(),
            prestige_seeking: rand::random::<f32>(),
            fear_sensitivity: rand::random::<f32>(),
            emotionality: rand::random::<f32>(),
            cognitive_flexibility: rand::random::<f32>(),
            ideological_rigidity: rand::random::<f32>(),
            attention_span: rand::random::<f32>(),
            trust_in_institutions: rand::random::<f32>(),
        }
    }

    /// متطلبات المقاومة لتغيير المعتقد — تعتمد على الصلابة الأيديولوجية
    pub fn resistance_threshold(&self) -> f32 {
        0.3 + self.ideological_rigidity * 0.4 - self.cognitive_flexibility * 0.2
    }

    /// حساب قبول الإشارة بناءً على السمات الشخصية
    pub fn calculate_acceptance(&self, signal: &Signal, fear: f32) -> f32 {
        let base = signal.strength;

        // السمات النفسية تعمل فعلياً الآن
        let skepticism_penalty = self.skepticism * signal.credibility_gap;
        let conformity_bonus = self.conformity * signal.social_pressure;
        let fear_amplifier = if fear > 0.7 { 1.4 } else { 1.0 };
        let openness_modifier = self.openness * 0.2;
        let tribalism_modifier = if signal.source_theory.contains("tribal") || signal.source_theory.contains("identity") {
            self.tribalism * 0.3
        } else {
            0.0
        };

        (base - skepticism_penalty + conformity_bonus + openness_modifier + tribalism_modifier)
            * fear_amplifier
    }

    /// السمة السائدة — للعرض في الواجهة
    pub fn dominant_trait(&self) -> &'static str {
        let traits = [
            ("openness", self.openness),
            ("skepticism", self.skepticism),
            ("conformity", self.conformity),
            ("tribalism", self.tribalism),
            ("aggression", self.aggression),
            ("prestige_seeking", self.prestige_seeking),
            ("fear_sensitivity", self.fear_sensitivity),
            ("emotionality", self.emotionality),
            ("cognitive_flexibility", self.cognitive_flexibility),
            ("ideological_rigidity", self.ideological_rigidity),
            ("attention_span", self.attention_span),
            ("trust_in_institutions", self.trust_in_institutions),
        ];
        traits.into_iter()
            .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))
            .map(|(name, _)| name)
            .unwrap_or("moderate")
    }

    /// مؤشر اتجاه التغيير (↑ أو ↓) للمقارنة بين تكتين
    pub fn trait_direction(&self, old_val: f32, new_val: f32) -> &'static str {
        if new_val > old_val { "↑" } else { "↓" }
    }
}