#[cfg(test)]
mod tests {
    use crate::runtime::world::{World, Agent, AgentMind, IdentityMatrix, BeliefSystem};
    use crate::agents::capital::Capital;
    use crate::core::scheduler::Scheduler;
    use crate::theories::soft_power::SoftPowerTheory;
    use crate::theories::r#trait::Theory;

    #[test]
    fn test_world_creation() {
        let world = World::new(42);
        assert_eq!(world.agents.len(), 0);
        assert_eq!(world.tick, 0);
        assert_eq!(world.seed, 42);
    }

    #[test]
    fn test_agent_creation() {
        let mind = AgentMind {
            openness: 0.5,
            skepticism: 0.5,
            conformity: 0.5,
            tribalism: 0.5,
            aggression: 0.5,
            prestige_seeking: 0.5,
            fear_sensitivity: 0.5,
            emotionality: 0.5,
            cognitive_flexibility: 0.5,
            ideological_rigidity: 0.5,
            attention_span: 0.5,
            trust_in_institutions: 0.5,
        };

        let identity = IdentityMatrix {
            local_identity: 0.5,
            national_identity: 0.5,
            religious_identity: 0.5,
            digital_identity: 0.5,
            hybrid_identity: 0.5,
            ideological_identity: 0.5,
        };

        let capital = Capital {
            economic: 0.5,
            social: 0.5,
            symbolic: 0.5,
            educational: 0.5,
        };

        let agent = Agent::new(1, mind, identity, capital);
        assert_eq!(agent.id, 1);
        assert_eq!(agent.mind.openness, 0.5);
        assert!(agent.age >= 18 && agent.age <= 98);
    }

    #[test]
    fn test_world_add_agent() {
        let mut world = World::new(42);
        
        let agent = Agent::new(
            1,
            AgentMind {
                openness: 0.5,
                skepticism: 0.5,
                conformity: 0.5,
                tribalism: 0.5,
                aggression: 0.5,
                prestige_seeking: 0.5,
                fear_sensitivity: 0.5,
                emotionality: 0.5,
                cognitive_flexibility: 0.5,
                ideological_rigidity: 0.5,
                attention_span: 0.5,
                trust_in_institutions: 0.5,
            },
            IdentityMatrix {
                local_identity: 0.5,
                national_identity: 0.5,
                religious_identity: 0.5,
                digital_identity: 0.5,
                hybrid_identity: 0.5,
                ideological_identity: 0.5,
            },
            Capital {
                economic: 0.5,
                social: 0.5,
                symbolic: 0.5,
                educational: 0.5,
            },
        );

        world.add_agent(agent);
        assert_eq!(world.agents.len(), 1);
    }

    #[test]
    fn test_soft_power_theory() {
        let theory = SoftPowerTheory::new(0.01);
        assert_eq!(theory.name(), "Soft Power (Joseph Nye)");
    }

    #[test]
    fn test_belief_system() {
        let mut belief_system = BeliefSystem::new();
        belief_system.beliefs.insert("test".to_string(), 0.5);
        assert_eq!(belief_system.beliefs.len(), 1);
        assert_eq!(belief_system.fatigue, 0.0);
    }

    #[test]
    fn test_scheduler_creation() {
        let scheduler = Scheduler::new(1000);
        assert_eq!(scheduler.max_tick, 1000);
        assert!(!scheduler.is_paused);
    }

    #[test]
    fn test_world_snapshot() {
        let mut world = World::new(42);
        world.take_snapshot();
        assert_eq!(world.snapshots.len(), 1);
        assert_eq!(world.snapshots[0].tick, 0);
    }

    #[test]
    fn test_compute_stats() {
        let mut world = World::new(42);
        
        let agent = Agent::new(
            1,
            AgentMind {
                openness: 0.5,
                skepticism: 0.5,
                conformity: 0.5,
                tribalism: 0.5,
                aggression: 0.5,
                prestige_seeking: 0.5,
                fear_sensitivity: 0.5,
                emotionality: 0.5,
                cognitive_flexibility: 0.5,
                ideological_rigidity: 0.5,
                attention_span: 0.5,
                trust_in_institutions: 0.5,
            },
            IdentityMatrix {
                local_identity: 0.5,
                national_identity: 0.5,
                religious_identity: 0.5,
                digital_identity: 0.5,
                hybrid_identity: 0.5,
                ideological_identity: 0.5,
            },
            Capital {
                economic: 0.5,
                social: 0.5,
                symbolic: 0.5,
                educational: 0.5,
            },
        );

        world.add_agent(agent);
        world.compute_stats();

        assert!(world.stats.polarization_index >= 0.0 && world.stats.polarization_index <= 1.0);
        assert!(world.stats.cohesion_score >= 0.0 && world.stats.cohesion_score <= 1.0);
    }
}
