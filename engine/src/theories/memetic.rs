use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية المميات (Memetic Theory)
/// الأفكار تتنافس وتتطور مثل الكائنات الحية
pub struct MemeticTheory {
    pub mutation_rate: f32,
    pub selection_pressure: f32,
}

impl MemeticTheory {
    pub fn new(mutation_rate: f32, selection_pressure: f32) -> Self {
        Self { mutation_rate, selection_pressure }
    }
}

impl Theory for MemeticTheory {
    fn name(&self) -> &str {
        "Memetic Theory (Dawkins)"
    }

    fn description(&self) -> &str {
        "الأفكار تتنافس وتتطور مثل الجينات"
    }

    fn apply(&self, world: &mut World) {
        for agent in &mut world.agents {
            // تطفر الأفكار القوية
            for (belief_name, adoption) in agent.beliefs.beliefs.iter_mut() {
                if *adoption > 0.6 {
                    // احتمالية تطفر الفكرة
                    if rand::random::<f32>() < self.mutation_rate {
                        *adoption = (*adoption + rand::random::<f32>() * 0.1 - 0.05).min(1.0).max(0.0);
                    }
                }
            }
            
            // الاختيار الطبيعي: الأفكار الشائعة تزيد أقوى
            let avg_adoption = agent.beliefs.beliefs.values().sum::<f32>() 
                / agent.beliefs.beliefs.len().max(1) as f32;
            
            for adoption in agent.beliefs.beliefs.values_mut() {
                if *adoption > avg_adoption {
                    *adoption = (*adoption + self.selection_pressure * 0.01).min(1.0);
                } else {
                    *adoption = (*adoption - self.selection_pressure * 0.01).max(0.0);
                }
            }
        }
    }
}
