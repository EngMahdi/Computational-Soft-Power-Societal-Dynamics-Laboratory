use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum RelationType {
    Family,
    Friends,
    Work,
    Religious,
    Political,
    Digital,
    Prestige,
    MediaFollowing,
    Tribal,
    Educational,
}

impl RelationType {
    pub fn strength(&self) -> f32 {
        match self {
            RelationType::Family => 0.95,
            RelationType::Friends => 0.85,
            RelationType::Work => 0.65,
            RelationType::Religious => 0.75,
            RelationType::Political => 0.70,
            RelationType::Digital => 0.45,
            RelationType::Prestige => 0.80,
            RelationType::MediaFollowing => 0.30,
            RelationType::Tribal => 0.80,
            RelationType::Educational => 0.60,
        }
    }

    pub fn decay_rate(&self) -> f32 {
        match self {
            RelationType::Family => 0.001,
            RelationType::Friends => 0.005,
            RelationType::Work => 0.01,
            RelationType::Religious => 0.008,
            RelationType::Political => 0.012,
            RelationType::Digital => 0.02,
            RelationType::Prestige => 0.015,
            RelationType::MediaFollowing => 0.025,
            RelationType::Tribal => 0.008,
            RelationType::Educational => 0.015,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relationship {
    pub from_agent: usize,
    pub to_agent: usize,
    pub relation_type: RelationType,
    pub strength: f32,        // 0.0 - 1.0
    pub frequency: f32,       // عدد المرات التي يتفاعلان
    pub ideological_distance: f32, // الفرق الأيديولوجي
    pub emotional_influence: f32,  // تأثير عاطفي
    pub created_at: u64,      // التيك الذي تم إنشاء العلاقة فيه
}

impl Relationship {
    pub fn new(from: usize, to: usize, rel_type: RelationType, tick: u64) -> Self {
        Self {
            from_agent: from,
            to_agent: to,
            relation_type: rel_type,
            strength: rel_type.strength(),
            frequency: 0.0,
            ideological_distance: 0.0,
            emotional_influence: 0.5,
            created_at: tick,
        }
    }

    /// تحديث قوة العلاقة بناءً على التفاعل
    pub fn update_strength(&mut self, delta: f32) {
        self.strength = (self.strength + delta).min(1.0).max(0.0);
    }

    /// تطبيق الاضمحلال الطبيعي للعلاقة
    pub fn apply_decay(&mut self) {
        let decay = self.relation_type.decay_rate();
        self.strength = (self.strength - decay).max(0.0);
        
        // انخفاض التفاعل مع الوقت
        self.frequency = (self.frequency * 0.95).max(0.0);
    }

    /// التحقق من قوة العلاقة الحالية
    pub fn is_active(&self) -> bool {
        self.strength > 0.1 && self.frequency > 0.0
    }
}
