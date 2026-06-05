use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية اقتصاد الانتباه
/// الانتباه مورد نادر والمعتقدات تتنافس عليه
pub struct AttentionEconomyTheory {
    pub attention_scarcity: f32,
}

impl AttentionEconomyTheory {
    pub fn new(attention_scarcity: f32) -> Self {
        Self { attention_scarcity }
    }
}

impl Theory for AttentionEconomyTheory {
    fn name(&self) -> &str {
        "Attention Economy Theory"
    }

    fn description(&self) -> &str {
        "الانتباه مورد محدود والأفكار تتنافس عليه"
    }

    fn apply(&self, world: &mut World) {
        for agent in &mut world.agents {
            // تقليل الانتباه الكلي (مورد نادر)
            agent.mind.attention_span = 
                (agent.mind.attention_span - self.attention_scarcity * 0.001).max(0.0);
            
            // الأفكار الأكثر إثارة للعاطفة تسيطر على الانتباه
            if !agent.beliefs.beliefs.is_empty() {
                let max_belief = agent.beliefs.beliefs.values().copied().fold(0.0, f32::max);
                
                // تعزيز الأفكار العالية على حساب الأخرى
                for belief in agent.beliefs.beliefs.values_mut() {
                    if *belief < max_belief * 0.5 {
                        *belief = (*belief - self.attention_scarcity * 0.01).max(0.0);
                    }
                }
                
                // زيادة الانفعالية
                agent.mind.emotionality = 
                    (agent.mind.emotionality + self.attention_scarcity * 0.005).min(1.0);
            }
        }
    }
}
