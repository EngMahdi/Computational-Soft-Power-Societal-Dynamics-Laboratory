use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية صنع الرضا (Manufacturing Consent)
/// وسائل الإعلام تشكل الرضا العام من خلال الفلترة والتأطير
pub struct ManufacturingConsentTheory {
    pub media_bias: f32,
}

impl ManufacturingConsentTheory {
    pub fn new(media_bias: f32) -> Self {
        Self { media_bias }
    }
}

impl Theory for ManufacturingConsentTheory {
    fn name(&self) -> &str {
        "Manufacturing Consent (Chomsky & Herman)"
    }

    fn description(&self) -> &str {
        "وسائل الإعلام تشكل الرضا العام"
    }

    fn apply(&self, world: &mut World) {
        let echo_density = world.stats.echo_density;
        
        for agent in &mut world.agents {
            // كلما زاد الإرهاق الإعلامي، زاد تقبل الرسائل الإعلامية
            let media_effect = echo_density * self.media_bias;
            
            // زيادة التبني الآلي للمعتقدات المروجة
            for belief in agent.beliefs.beliefs.values_mut() {
                *belief = (*belief + media_effect * 0.05).min(1.0);
            }
            
            // نقص المرونة الإدراكية
            agent.mind.cognitive_flexibility = 
                (agent.mind.cognitive_flexibility - media_effect * 0.02).max(0.0);
        }
    }
}
