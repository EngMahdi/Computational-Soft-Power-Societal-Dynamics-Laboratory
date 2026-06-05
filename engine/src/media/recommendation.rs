use crate::media::content::Content;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendationAlgorithm {
    pub engagement_weight: f32,    // وزن الانشغال
    pub emotional_weight: f32,     // وزن الشحنة العاطفية
    pub confirmation_weight: f32,  // وزن تأكيد المعتقدات (Echo chamber)
    pub diversity_penalty: f32,    // عقوبة التنوع
}

impl RecommendationAlgorithm {
    pub fn new() -> Self {
        Self {
            engagement_weight: 0.4,
            emotional_weight: 0.35,
            confirmation_weight: 0.2,
            diversity_penalty: 0.05,
        }
    }

    /// توصية بمحتوى لوكيل معين
    pub fn recommend(
        &self,
        agent_beliefs: &std::collections::HashMap<String, f32>,
        available_content: &[Content],
        agent_tribalism: f32,
    ) -> Vec<usize> {
        let mut scored_content: Vec<(usize, f32)> = available_content
            .iter()
            .map(|content| {
                let mut score = 0.0;

                // 1. الانشغال العالي
                score += content.engagement * self.engagement_weight;

                // 2. الشحنة العاطفية
                score += content.emotional_charge * self.emotional_weight;

                // 3. تأكيد المعتقد (Echo chamber effect)
                if let Some(belief_strength) = agent_beliefs.get(&content.target_belief) {
                    if *belief_strength > 0.5 {
                        score += *belief_strength * self.confirmation_weight;
                    } else {
                        score -= self.diversity_penalty;
                    }
                }

                // 4. تأثير القبلية - تضخيم المحتوى القبلي
                if agent_tribalism > 0.7 {
                    score *= 1.2; // زيادة 20% للمحتوى للمجموعات القبلية المنعزلة
                }

                (content.id, score.max(0.0))
            })
            .collect();

        // ترتيب بناءً على الدرجة
        scored_content.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        // إرجاع أفضل 5 توصيات
        scored_content
            .into_iter()
            .take(5)
            .map(|(id, _)| id)
            .collect()
    }

    /// حساب مؤشر الفقاعة (Echo chamber density)
    pub fn bubble_score(&self, agent_beliefs: &std::collections::HashMap<String, f32>) -> f32 {
        if agent_beliefs.is_empty() {
            return 0.0;
        }

        let avg_belief = agent_beliefs.values().sum::<f32>() / agent_beliefs.len() as f32;
        // الفقاعة قوية عندما تكون المعتقدات منسجمة جداً
        1.0 - (agent_beliefs.values().map(|b| (b - avg_belief).abs()).sum::<f32>() / agent_beliefs.len() as f32)
    }
}

impl Default for RecommendationAlgorithm {
    fn default() -> Self {
        Self::new()
    }
}
