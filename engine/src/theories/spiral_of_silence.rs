use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية الصمت الحلزوني (Spiral of Silence)
/// الآراء الأقلية تميل للصمت، مما يقوي الآراء الأغلبية
pub struct SpiralOfSilenceTheory {
    pub silence_rate: f32,
}

impl SpiralOfSilenceTheory {
    pub fn new(silence_rate: f32) -> Self {
        Self { silence_rate }
    }
}

impl Theory for SpiralOfSilenceTheory {
    fn name(&self) -> &str {
        "Spiral of Silence (Noelle-Neumann)"
    }

    fn description(&self) -> &str {
        "الآراء الأقلية تميل للصمت، مما يقوي الأغلبية"
    }

    fn apply(&self, world: &mut World) {
        let polarization = world.stats.polarization_index;
        
        for agent in &mut world.agents {
            // إذا كان الوكيل في أقلية، فإنه يصمت
            if polarization > 0.6 {
                // نقص الشجاعة على التعبير
                agent.mind.aggression = 
                    (agent.mind.aggression - self.silence_rate * 0.05).max(0.0);
                
                // زيادة الخوف
                agent.mind.fear_sensitivity = 
                    (agent.mind.fear_sensitivity + self.silence_rate * 0.05).min(1.0);
                
                // انسحاب المشاركة الاجتماعية
                agent.beliefs.fatigue = 
                    (agent.beliefs.fatigue + self.silence_rate * 0.02).min(1.0);
            }
        }
    }
}
