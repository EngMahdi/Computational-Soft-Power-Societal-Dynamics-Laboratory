use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContentType {
    News,
    Opinion,
    Propaganda,
    CounterPropaganda,
    Entertainment,
    Educational,
    Viral,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Content {
    pub id: usize,
    pub creator_id: usize,
    pub content_type: ContentType,
    pub narrative: String,
    pub emotional_charge: f32,    // 0.0 محايد، 1.0 عالي جداً
    pub virality_score: f32,       // احتمالية الانتشار
    pub target_belief: String,     // المعتقد المستهدف
    pub engagement: f32,           // مستوى الانشغال
    pub reach: usize,              // عدد الأشخاص الذين رأوه
    pub created_at: u64,           // التيك الذي تم الإنشاء فيه
}

impl Content {
    pub fn new(
        id: usize,
        creator_id: usize,
        content_type: ContentType,
        narrative: String,
        target_belief: String,
    ) -> Self {
        // حساب الشحنة العاطفية بناءً على النوع
        let emotional_charge = match content_type {
            ContentType::Propaganda => 0.9,
            ContentType::Viral => 0.8,
            ContentType::Opinion => 0.7,
            ContentType::News => 0.4,
            ContentType::CounterPropaganda => 0.8,
            ContentType::Entertainment => 0.6,
            ContentType::Educational => 0.2,
        };

        let virality_score = emotional_charge * 0.8 + 0.2; // المحتوى العاطفي ينتشر أسرع / Faster

        Self {
            id,
            creator_id,
            content_type,
            narrative,
            emotional_charge,
            virality_score,
            target_belief,
            engagement: 0.0,
            reach: 0,
            created_at: 0,
        }
    }

    /// زيادة الوصول والانشغال
    pub fn spread(&mut self, new_reach: usize, engagement_boost: f32) {
        self.reach += new_reach;
        self.engagement = (self.engagement + engagement_boost * self.virality_score).min(1.0);
    }

    /// تطبيق تأثير الإرهاق - تقليل الانتشار مع مرور الوقت
    pub fn apply_fatigue(&mut self, fatigue_rate: f32) {
        self.virality_score = (self.virality_score - fatigue_rate * 0.05).max(0.1);
        self.engagement = (self.engagement * 0.95).max(0.0);
    }
}
