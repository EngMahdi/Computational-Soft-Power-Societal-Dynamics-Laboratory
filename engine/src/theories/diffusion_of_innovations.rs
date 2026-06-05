use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية انتشار الابتكارات
/// الأفكار تنتشر عبر مراحل: المحتفلون، الأكثر تبنياً، الأكثرية الباكرة، الأكثرية المتأخرة، المتشكون
pub struct DiffusionOfInnovationsTheory {
    pub adoption_rate: f32,
}

impl DiffusionOfInnovationsTheory {
    pub fn new(adoption_rate: f32) -> Self {
        Self { adoption_rate }
    }
}

impl Theory for DiffusionOfInnovationsTheory {
    fn name(&self) -> &str {
        "Diffusion of Innovations (Rogers)"
    }

    fn description(&self) -> &str {
        "الأفكار تنتشر عبر السكان وفقاً لمنحنى S"
    }

    fn apply(&self, world: &mut World) {
        // النسبة المتبنية تؤثر على سرعة الانتشار
        let adoption_level = world.stats.average_belief_adoption;
        
        for agent in &mut world.agents {
            // كلما زادت النسبة المتبنية، زادت الضغوط على المتشككين
            let diffusion_pressure = adoption_level * self.adoption_rate;
            
            // لكن المتشككون يزيد لديهم الشك
            agent.mind.skepticism = 
                (agent.mind.skepticism + diffusion_pressure * 0.1).min(1.0);
            
            // والمنفتحون يقبلون بسهولة أكبر
            if agent.mind.openness > 0.6 {
                for belief in agent.beliefs.beliefs.values_mut() {
                    *belief = (*belief + diffusion_pressure).min(1.0);
                }
            }
        }
    }
}
