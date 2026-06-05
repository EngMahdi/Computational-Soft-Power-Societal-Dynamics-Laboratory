use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية غرف الصدى
/// الوكلاء ينظمون أنفسهم تدريجياً في مجموعات أيديولوجية معزولة
pub struct EchoChamberTheory {
    pub isolation_rate: f32,
}

impl EchoChamberTheory {
    pub fn new(isolation_rate: f32) -> Self {
        Self { isolation_rate }
    }
}

impl Theory for EchoChamberTheory {
    fn name(&self) -> &str {
        "Echo Chamber Theory"
    }

    fn description(&self) -> &str {
        "الوكلاء ينعزلون في مجموعات فكرية محكومة"
    }

    fn apply(&self, world: &mut World) {
        // الوكلاء الذين لديهم معتقدات قوية يعزلون أنفسهم
        for agent in &mut world.agents {
            let max_belief = agent.beliefs.beliefs.values().copied().fold(0.0, f32::max);
            
            if max_belief > 0.7 {
                // زيادة الصلابة الأيديولوجية
                agent.mind.ideological_rigidity = 
                    (agent.mind.ideological_rigidity + self.isolation_rate * 0.02).min(1.0);
                
                // نقص المرونة المعرفية
                agent.mind.cognitive_flexibility = 
                    (agent.mind.cognitive_flexibility - self.isolation_rate * 0.02).max(0.0);
                
                // زيادة العدوانية تجاه الآراء المختلفة
                agent.mind.aggression = 
                    (agent.mind.aggression + self.isolation_rate * 0.01).min(1.0);
            }
        }
    }
}
