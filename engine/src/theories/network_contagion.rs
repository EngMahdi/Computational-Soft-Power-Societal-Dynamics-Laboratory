use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية العدوى الشبكية
/// المعتقدات تنتشر عبر الشبكة الاجتماعية بناءً على التعرض المتكرر
pub struct NetworkContagionTheory {
    pub contagion_rate: f32,
}

impl NetworkContagionTheory {
    pub fn new(contagion_rate: f32) -> Self {
        Self { contagion_rate }
    }
}

impl Theory for NetworkContagionTheory {
    fn name(&self) -> &str {
        "Network Contagion"
    }

    fn description(&self) -> &str {
        "المعتقدات تنتشر عبر الشبكة الاجتماعية"
    }

    fn apply(&self, world: &mut World) {
        // انتشار المعتقدات عبر الحواف في الشبكة الاجتماعية
        let mut belief_updates = Vec::new();
        
        for edge_idx in world.social_graph.edge_indices() {
            if let Some((source_idx, target_idx)) = world.social_graph.edge_endpoints(edge_idx) {
                if let Some(source_agent) = world.agents.iter().find(|a| a.node_index == source_idx) {
                    for (belief_name, adoption) in source_agent.beliefs.beliefs.iter() {
                        if *adoption > 0.7 {
                            belief_updates.push((target_idx, belief_name.clone(), *adoption));
                        }
                    }
                }
            }
        }
        
        // تطبيق التحديثات
        for (target_idx, belief_name, adoption) in belief_updates {
            if let Some(target) = world.agents.iter_mut().find(|a| a.node_index == target_idx) {
                let belief = target.beliefs.beliefs.entry(belief_name.clone()).or_insert(0.0);
                *belief = (*belief + adoption * self.contagion_rate).min(1.0);
                
                // زيادة التشبع
                let saturation = target.beliefs.saturation.entry(belief_name).or_insert(0.0);
                *saturation = (*saturation + 1.0).min(100.0);
            }
        }
    }
}
