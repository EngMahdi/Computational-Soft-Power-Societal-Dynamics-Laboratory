use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية تصعيد التطرف
/// المجموعات المتطرفة تزيد من عدوانيتها في الأيديولوجية المنعزلة
pub struct RadicalizationTheory {
    pub extremism_boost: f32,
}

impl RadicalizationTheory {
    pub fn new(extremism_boost: f32) -> Self {
        Self { extremism_boost }
    }
}

impl Theory for RadicalizationTheory {
    fn name(&self) -> &str {
        "Radicalization Cascades"
    }

    fn description(&self) -> &str {
        "المجموعات المنعزلة تزيد من تطرفها"
    }

    fn apply(&self, world: &mut World) {
        let polarization = world.stats.polarization_index;
        
        for agent in &mut world.agents {
            // في بيئة منقسمة، الوكلاء يزيدون تطرفهم
            if polarization > 0.7 {
                // زيادة العدوانية
                agent.mind.aggression = 
                    (agent.mind.aggression + self.extremism_boost * 0.02).min(1.0);
                
                // زيادة التطرف الأيديولوجي
                agent.mind.ideological_rigidity = 
                    (agent.mind.ideological_rigidity + self.extremism_boost * 0.03).min(1.0);
                
                // نقص الثقة في المؤسسات
                agent.mind.trust_in_institutions = 
                    (agent.mind.trust_in_institutions - self.extremism_boost * 0.02).max(0.0);
                
                // زيادة الخوف
                agent.mind.fear_sensitivity = 
                    (agent.mind.fear_sensitivity + self.extremism_boost * 0.01).min(1.0);
            }
        }
    }
}
