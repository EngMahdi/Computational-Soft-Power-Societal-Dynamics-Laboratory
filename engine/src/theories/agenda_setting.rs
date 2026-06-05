use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية تحديد الأجندة
/// وسائل الإعلام لا تخبر الناس ماذا يفكرون، لكن ماذا يفكرون فيه
pub struct AgendaSettingTheory {
    pub salience_weight: f32,
}

impl AgendaSettingTheory {
    pub fn new(salience_weight: f32) -> Self {
        Self { salience_weight }
    }
}

impl Theory for AgendaSettingTheory {
    fn name(&self) -> &str {
        "Agenda Setting (McCombs & Shaw)"
    }

    fn description(&self) -> &str {
        "وسائل الإعلام تحدد الأولويات الاجتماعية"
    }

    fn apply(&self, world: &mut World) {
        // التركيز الإعلامي على المعتقدات المحددة
        for agent in &mut world.agents {
            // زيادة الاهتمام بالمعتقدات 'البارزة'
            for (belief_name, adoption) in agent.beliefs.beliefs.iter_mut() {
                if agent.beliefs.saturation.get(belief_name).copied().unwrap_or(0.0) > 0.5 {
                    *adoption = (*adoption + self.salience_weight * 0.02).min(1.0);
                }
            }
            
            // نقص الاهتمام بالمعتقدات المهمشة
            agent.mind.attention_span = 
                (agent.mind.attention_span - self.salience_weight * 0.01).max(0.0);
        }
    }
}
