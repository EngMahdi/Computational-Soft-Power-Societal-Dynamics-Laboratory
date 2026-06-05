use crate::runtime::world::World;
use crate::statistics::metrics::Metrics;
use serde_json::json;
use std::collections::HashMap;

pub struct ExportFormat;

impl ExportFormat {
    /// تصدير الحالة كـ JSON
    pub fn export_json(world: &World, metrics: &Metrics) -> String {
        let agents_json: Vec<_> = world
            .agents
            .iter()
            .map(|a| {
                json!({
                    "id": a.id,
                    "mind": {
                        "openness": a.mind.openness,
                        "skepticism": a.mind.skepticism,
                        "tribalism": a.mind.tribalism,
                        "ideological_rigidity": a.mind.ideological_rigidity,
                    },
                    "beliefs": a.beliefs.beliefs,
                    "capital": {
                        "economic": a.capital.economic,
                        "social": a.capital.social,
                        "symbolic": a.capital.symbolic,
                    }
                })
            })
            .collect();

        let export = json!({
            "tick": world.tick,
            "agent_count": world.agents.len(),
            "metrics": {
                "polarization": metrics.polarization_index,
                "cohesion": metrics.cohesion_score,
                "echo_density": metrics.echo_density,
                "belief_adoption": metrics.average_belief_adoption,
            },
            "agents": agents_json,
        });

        export.to_string()
    }

    /// تصدير الـ Metrics كـ CSV
    pub fn export_metrics_csv(metrics_history: &[Metrics]) -> String {
        let mut csv = String::from(
            "tick,polarization,cohesion,echo_density,belief_adoption,identity_fragmentation\n",
        );

        for m in metrics_history {
            csv.push_str(&format!(
                "{},{},{},{},{},{}\n",
                m.timestamp,
                m.polarization_index,
                m.cohesion_score,
                m.echo_density,
                m.average_belief_adoption,
                m.identity_fragmentation
            ));
        }

        csv
    }

    /// تصدير الملخص النهائي
    pub fn export_summary(world: &World, metrics: &Metrics) -> String {
        format!(
            "SIMULATION SUMMARY\n\
            Ticks: {}\n\
            Agents: {}\n\
            \n\
            METRICS:\n\
            Polarization Index: {:.3}\n\
            Cohesion Score: {:.3}\n\
            Echo Density: {:.3}\n\
            Average Belief Adoption: {:.3}\n\
            Narrative Volatility: {:.3}\n\
            Identity Fragmentation: {:.3}\n\
            Elite Dominance: {:.3}\n\
            Resistance Strength: {:.3}\n",
            world.tick,
            world.agents.len(),
            metrics.polarization_index,
            metrics.cohesion_score,
            metrics.echo_density,
            metrics.average_belief_adoption,
            metrics.narrative_volatility,
            metrics.identity_fragmentation,
            metrics.elite_dominance,
            metrics.resistance_strength,
        )
    }

    /// تصدير بيانات جميع الوكلاء كاملة مع جميع الحقول
    pub fn export_all_agents_full(world: &World, metrics: &Metrics) -> String {
        let agents_full: Vec<_> = world.agents.iter().map(|a| {
            json!({
                "id": a.id,
                "state": a.state.name(),
                "is_influencer": a.is_influencer,
                "age": a.age_profile.age,
                "age_group": a.age_profile.group.to_string(),
                "location": {
                    "province": a.location.province,
                    "district": a.location.district,
                },
                "mind": {
                    "openness": a.mind.openness,
                    "skepticism": a.mind.skepticism,
                    "conformity": a.mind.conformity,
                    "tribalism": a.mind.tribalism,
                    "aggression": a.mind.aggression,
                    "prestige_seeking": a.mind.prestige_seeking,
                    "ideological_rigidity": a.mind.ideological_rigidity,
                    "trust_in_institutions": a.mind.trust_in_institutions,
                    "cognitive_flexibility": a.mind.cognitive_flexibility,
                    "fear_sensitivity": a.mind.fear_sensitivity,
                    "emotionality": a.mind.emotionality,
                    "attention_span": a.mind.attention_span,
                },
                "identity": {
                    "ideological_identity": a.identity.ideological_identity,
                    "national_identity": a.identity.national_identity,
                    "religious_identity": a.identity.religious_identity,
                    "tribal_identity": a.identity.local_identity,
                    "sectarian_identity": a.identity.religious_identity,
                },
                "capital": {
                    "economic": a.capital.economic,
                    "social": a.capital.social,
                    "symbolic": a.capital.symbolic,
                },
                "beliefs": a.beliefs.beliefs,
                "belief_saturation": a.beliefs.saturation,
                "belief_fatigue": a.beliefs.fatigue,
                "emotional_state": {
                    "fear": a.emotional_state.fear,
                    "anger": a.emotional_state.anger,
                    "hope": a.emotional_state.hope,
                    "pride": a.emotional_state.pride,
                    "despair": a.emotional_state.despair,
                    "solidarity": a.emotional_state.solidarity,
                    "dominant": a.emotional_state.dominant().emoji(),
                },
                "injection_history": a.injection_history.iter().map(|inj| json!({
                    "tick": inj.tick,
                    "type": inj.injection_type,
                    "payload": inj.payload,
                    "spread_to_network": inj.spread_to_network,
                })).collect::<Vec<_>>(),
                "collective_memory_resonance": a.collective_memory_resonance,
            })
        }).collect();

        let export = json!({
            "tick": world.tick,
            "agent_count": world.agents.len(),
            "seed": world.seed,
            "timestamp": "runtime", // JS side can fill this
            "metrics": {
                "polarization_index": metrics.polarization_index,
                "cohesion_score": metrics.cohesion_score,
                "identity_fragmentation": metrics.identity_fragmentation,
                "memetic_velocity": metrics.memetic_velocity,
                "elite_dominance": metrics.elite_dominance,
                "resistance_strength": metrics.resistance_strength,
                "echo_density": metrics.echo_density,
                "narrative_volatility": metrics.narrative_volatility,
                "algorithmic_capture": metrics.algorithmic_capture,
                "ideological_entropy": metrics.ideological_entropy,
                "average_belief_adoption": metrics.average_belief_adoption,
                "material_stress_index": metrics.material_stress_index,
                "economic_despair_rate": metrics.economic_despair_rate,
                "state_legitimacy_score": metrics.state_legitimacy_score,
                "generational_divide": metrics.generational_divide,
                "stability_preference_index": metrics.stability_preference_index,
                "collapse_fear_aggregate": metrics.collapse_fear_aggregate,
            },
            "agent_state_distribution": serde_json::json!({}),
            "age_distribution": serde_json::json!({}),
            "agents": agents_full,
        });

        export.to_string()
    }

    /// تصدير بيانات الوكلاء المحقونين فقط
    pub fn export_injected_agents(world: &World, metrics: &Metrics) -> String {
        let injected_agents: Vec<_> = world.agents.iter()
            .filter(|a| !a.injection_history.is_empty())
            .map(|a| {
                json!({
                    "id": a.id,
                    "state": a.state.name(),
                    "initial_state": a.injection_history.first().map(|_| "injected"),
                    "injection_count": a.injection_history.len(),
                    "injection_history": a.injection_history.iter().map(|inj| json!({
                        "tick": inj.tick,
                        "type": inj.injection_type,
                        "payload": inj.payload,
                        "spread_to_network": inj.spread_to_network,
                    })).collect::<Vec<_>>(),
                    "final_state": a.state.name(),
                    "age": a.age_profile.age,
                    "age_group": a.age_profile.group.to_string(),
                    "emotional_state": {
                        "fear": a.emotional_state.fear,
                        "anger": a.emotional_state.anger,
                        "hope": a.emotional_state.hope,
                        "despair": a.emotional_state.despair,
                        "solidarity": a.emotional_state.solidarity,
                        "dominant": a.emotional_state.dominant().emoji(),
                    },
                    "mind": {
                        "openness": a.mind.openness,
                        "skepticism": a.mind.skepticism,
                        "conformity": a.mind.conformity,
                        "aggression": a.mind.aggression,
                        "trust_in_institutions": a.mind.trust_in_institutions,
                        "ideological_rigidity": a.mind.ideological_rigidity,
                    },
                    "beliefs": a.beliefs.beliefs,
                    "capital": {
                        "economic": a.capital.economic,
                        "social": a.capital.social,
                        "symbolic": a.capital.symbolic,
                    },
                    "identity": {
                        "ideological_identity": a.identity.ideological_identity,
                        "national_identity": a.identity.national_identity,
                        "religious_identity": a.identity.religious_identity,
                    },
                    "collective_memory_resonance": a.collective_memory_resonance,
                })
            }).collect();

        let export = json!({
            "tick": world.tick,
            "total_agents": world.agents.len(),
            "injected_agents_count": injected_agents.len(),
            "metrics": {
                "polarization_index": metrics.polarization_index,
                "cohesion_score": metrics.cohesion_score,
                "average_belief_adoption": metrics.average_belief_adoption,
            },
            "injected_agents": injected_agents,
        });

        export.to_string()
    }
}