use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية التضخيم الخوارزمي
/// الخوارزميات تشكل الواقع من خلال الاختيار والتصنيف
pub struct AlgorithmicAmplificationTheory {
    pub algorithm_bias: f32,
}

impl AlgorithmicAmplificationTheory {
    pub fn new(algorithm_bias: f32) -> Self {
        Self { algorithm_bias }
    }
}

impl Theory for AlgorithmicAmplificationTheory {
    fn name(&self) -> &str {
        "Algorithmic Amplification"
    }

    fn description(&self) -> &str {
        "الخوارزميات تضخم المحتوى العاطفي والمثير"
    }

    fn apply(&self, world: &mut World) {
        let echo_density = world.stats.echo_density;
        
        for agent in &mut world.agents {
            // الخوارزميات تضخم المحتوى الذي يزيد الانشغال العاطفي
            for belief in agent.beliefs.beliefs.values_mut() {
                // المحتوى المثير ينتشر أسرع / Faster
                if agent.mind.emotionality > 0.6 {
                    *belief = (*belief + echo_density * self.algorithm_bias).min(1.0);
                }
            }
            
            // الخوارزميات تزيد من الانقسام
            if agent.mind.tribalism > 0.6 {
                // زيادة التعرض للمحتوى القبلي
                agent.mind.tribalism = 
                    (agent.mind.tribalism + self.algorithm_bias * 0.01).min(1.0);
            }
            
            // انعكاس: الخوارزميات تقلل التعرض للآراء المتنوعة
            agent.mind.cognitive_flexibility = 
                (agent.mind.cognitive_flexibility - echo_density * self.algorithm_bias * 0.01).max(0.0);
            
            // زيادة الاعتماد على المنصات
            agent.mind.trust_in_institutions = 
                (agent.mind.trust_in_institutions + self.algorithm_bias * 0.005).min(1.0);
        }
    }
}
