use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية الهوية الاجتماعية
/// الوكلاء يزيدون من التماهي مع المجموعة الداخلية ويضعفون الخارجية
pub struct SocialIdentityTheory {
    pub tribalism_boost: f32,
}

impl SocialIdentityTheory {
    pub fn new(tribalism_boost: f32) -> Self {
        Self { tribalism_boost }
    }
}

impl Theory for SocialIdentityTheory {
    fn name(&self) -> &str {
        "Social Identity Theory (Tajfel & Turner)"
    }

    fn description(&self) -> &str {
        "الوكلاء يزيدون تماهيهم مع المجموعات الداخلية"
    }

    fn apply(&self, world: &mut World) {
        // زيادة الانقسام بين المجموعات بناءً على الاعتقادات
        for agent in &mut world.agents {
            let avg_tribal = agent.mind.tribalism;
            
            // زيادة القبلية تزيد من الانقسام
            agent.mind.tribalism = (agent.mind.tribalism + self.tribalism_boost * 0.01).min(1.0);
            
            // و تقلل من الثقة الكلية
            agent.mind.trust_in_institutions = 
                (agent.mind.trust_in_institutions - self.tribalism_boost * 0.01).max(0.0);
            
            // زيادة صلابة الهوية
            agent.identity.ideological_identity = 
                (agent.identity.ideological_identity + self.tribalism_boost * 0.01).min(1.0);
        }
    }
}
