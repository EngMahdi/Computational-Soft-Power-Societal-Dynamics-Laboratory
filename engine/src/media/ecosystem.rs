use crate::media::content::Content;
use crate::media::recommendation::RecommendationAlgorithm;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaEcosystem {
    pub all_content: Vec<Content>,
    pub recommendation_algorithm: RecommendationAlgorithm,
    pub feed_size: usize,
    pub content_id_counter: usize,
}

impl MediaEcosystem {
    pub fn new() -> Self {
        Self {
            all_content: Vec::new(),
            recommendation_algorithm: RecommendationAlgorithm::new(),
            feed_size: 20, // حجم الملف الشخصي الواحد
            content_id_counter: 0,
        }
    }

    /// إنشاء محتوى جديد
    pub fn create_content(
        &mut self,
        creator_id: usize,
        content_type: crate::media::content::ContentType,
        narrative: String,
        target_belief: String,
        tick: u64,
    ) -> usize {
        let mut content = Content::new(
            self.content_id_counter,
            creator_id,
            content_type,
            narrative,
            target_belief,
        );
        content.created_at = tick;
        self.all_content.push(content);
        let id = self.content_id_counter;
        self.content_id_counter += 1;
        id
    }

    /// الحصول على ملف شخصي للوكيل
    pub fn get_personalized_feed(
        &self,
        agent_id: usize,
        agent_beliefs: &std::collections::HashMap<String, f32>,
        agent_tribalism: f32,
    ) -> Vec<&Content> {
        let recommended_ids = self
            .recommendation_algorithm
            .recommend(agent_beliefs, &self.all_content, agent_tribalism);

        let mut feed: Vec<&Content> = recommended_ids
            .iter()
            .filter_map(|id| self.all_content.iter().find(|c| c.id == *id))
            .collect();

        feed.truncate(self.feed_size);
        feed
    }

    /// تحديث النظام الإعلامي
    pub fn update(&mut self) {
        // تطبيق الإرهاق على المحتوى القديم
        for content in &mut self.all_content {
            content.apply_fatigue(0.01);
        }

        // إزالة المحتوى الذي انتهى
        self.all_content.retain(|c| c.virality_score > 0.05);
    }

    /// حساب معدل انتشار المحتوى
    pub fn viral_spread(&mut self, content_id: usize, exposed_agents: usize, engagement_rate: f32) {
        if let Some(content) = self.all_content.iter_mut().find(|c| c.id == content_id) {
            content.spread(exposed_agents, engagement_rate);
        }
    }

    /// حساب درجة الفقاعة الإعلامية
    pub fn calculate_media_bubble(
        &self,
        agent_beliefs: &std::collections::HashMap<String, f32>,
    ) -> f32 {
        self.recommendation_algorithm.bubble_score(agent_beliefs)
    }

    /// حساب الانقسام الإعلامي
    pub fn media_polarization(&self) -> f32 {
        if self.all_content.is_empty() {
            return 0.0;
        }

        let avg_emotion = self.all_content.iter().map(|c| c.emotional_charge).sum::<f32>()
            / self.all_content.len() as f32;
        
        self.all_content
            .iter()
            .map(|c| (c.emotional_charge - avg_emotion).abs())
            .sum::<f32>()
            / self.all_content.len() as f32
    }
}

impl Default for MediaEcosystem {
    fn default() -> Self {
        Self::new()
    }
}
