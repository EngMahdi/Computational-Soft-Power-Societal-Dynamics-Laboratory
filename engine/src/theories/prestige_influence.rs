use crate::runtime::world::World;
use crate::theories::r#trait::Theory;

/// نظرية تأثير الهيبة
/// الممثلون عالي الحالة يشوهون انتشار الأفكار
pub struct PrestigeInfluenceTheory {
    pub prestige_multiplier: f32,
}

impl PrestigeInfluenceTheory {
    pub fn new(prestige_multiplier: f32) -> Self {
        Self { prestige_multiplier }
    }
}

impl Theory for PrestigeInfluenceTheory {
    fn name(&self) -> &str {
        "Prestige Influence Theory"
    }

    fn description(&self) -> &str {
        "الممثلون عالي الحالة يزيدون تأثيرهم بشكل غير متناسب"
    }

    fn apply(&self, world: &mut World) {
        let high_prestige_agents: Vec<_> = world.agents.iter()
            .filter(|a| a.capital.symbolic > 0.7)
            .map(|a| (a.node_index, a.beliefs.beliefs.clone()))
            .collect();

        for (node_idx, beliefs) in high_prestige_agents {
            // Find neighbors from the graph
            let neighbors: Vec<_> = world.social_graph.neighbors(node_idx).collect();
            
            for neighbor_idx in neighbors {
                if let Some(neighbor) = world.agents.iter_mut().find(|a| a.node_index == neighbor_idx) {
                    for (belief_name, adoption) in beliefs.iter() {
                        let belief = neighbor.beliefs.beliefs.entry(belief_name.clone()).or_insert(0.0);
                        let prestige_effect = adoption * self.prestige_multiplier;
                        *belief = (*belief + prestige_effect).min(1.0);
                    }
                }
            }
        }
        
        for agent in &mut world.agents {
            if agent.capital.symbolic > 0.8 {
                agent.capital.symbolic = (agent.capital.symbolic - 0.005).max(0.0);
            }
        }
    }
}
