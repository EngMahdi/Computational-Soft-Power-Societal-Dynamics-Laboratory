use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية جوزيف ناي للقوة الناعمة
/// الجاذبية الثقافية والشرعية تزيد من الاعتماد
pub struct SoftPowerTheory {
    pub influence_weight: f32,
}

impl SoftPowerTheory {
    pub fn new(influence_weight: f32) -> Self {
        Self { influence_weight }
    }
}

impl Theory for SoftPowerTheory {
    fn name(&self) -> &str {
        "Soft Power (Joseph Nye)"
    }

    fn description(&self) -> &str {
        "الجاذبية الثقافية والشرعية تزيد من اعتماد الأفكار"
    }

    fn apply(&self, world: &mut World) {
        // للعلاقات ذات الثقة العالية، زيادة تبني المعتقدات
        for edge_idx in world.social_graph.edge_indices() {
            if let Some(weight) = world.social_graph.edge_weight(edge_idx) {
                if *weight > 0.5 {
                    if let Some((source_idx, target_idx)) = world.social_graph.edge_endpoints(edge_idx) {
                        // تأثير الوكيل المصدر على الهدف
                        if let Some(source) = world.agents.iter().find(|a| a.node_index == source_idx) {
                            let source_prestige = source.capital.symbolic; // الرأس مال الرمزي = الشرعية
                            
                            if let Some(target) = world.agents.iter_mut().find(|a| a.node_index == target_idx) {
                                // تزيد الجاذبية الثقافية من التبني
                                for (belief, adoption) in target.beliefs.beliefs.iter_mut() {
                                    let prestige_effect = source_prestige * self.influence_weight * *weight;
                                    *adoption = (*adoption + prestige_effect).min(1.0);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
