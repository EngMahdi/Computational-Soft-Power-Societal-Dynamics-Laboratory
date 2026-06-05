use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية أنطونيو غرامشي للهيمنة الثقافية
/// السرديات المهيمنة تُطبِّع السلطة من خلال الموافقة
pub struct CulturalHegemonyTheory {
    pub normalization_rate: f32,
}

impl CulturalHegemonyTheory {
    pub fn new(normalization_rate: f32) -> Self {
        Self { normalization_rate }
    }
}

impl Theory for CulturalHegemonyTheory {
    fn name(&self) -> &str {
        "Cultural Hegemony (Gramsci)"
    }

    fn description(&self) -> &str {
        "السرديات المهيمنة تطبِّع الهياكل السلطوية"
    }

    fn apply(&self, world: &mut World) {
        // الأفكار الشائعة تزيد من قبول سلطة النخبة
        let avg_belief_adoption = world.stats.average_belief_adoption;
        
        for agent in &mut world.agents {
            // زيادة ثقة الوكيل في المؤسسات عندما تكون الأفكار المهيمنة منتشرة
            let hegemonic_effect = avg_belief_adoption * self.normalization_rate;
            agent.mind.trust_in_institutions = 
                (agent.mind.trust_in_institutions + hegemonic_effect).min(1.0);
            
            // لكن انخفاض المرونة المعرفية
            agent.mind.cognitive_flexibility = 
                (agent.mind.cognitive_flexibility - hegemonic_effect * 0.5).max(0.0);
        }
    }
}
