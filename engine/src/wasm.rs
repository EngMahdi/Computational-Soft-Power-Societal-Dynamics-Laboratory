use wasm_bindgen::prelude::*;
use crate::agents::mind::AgentMind;
use crate::agents::identity::IdentityMatrix;
use crate::agents::capital::Capital;
use crate::agents::age::AgeProfile;
use crate::agents::emotional::EmotionLabel;
use crate::runtime::world::{World, Agent, AgentState};
use crate::core::scheduler::{Scheduler, SchedulerSpeed};
use crate::theories::r#trait::Theory;
use crate::theories::soft_power::SoftPowerTheory;
use crate::theories::cultural_hegemony::CulturalHegemonyTheory;
use crate::theories::diffusion_of_innovations::DiffusionOfInnovationsTheory;
use crate::theories::social_identity::SocialIdentityTheory;
use crate::theories::spiral_of_silence::SpiralOfSilenceTheory;
use crate::theories::manufacturing_consent::ManufacturingConsentTheory;
use crate::theories::agenda_setting::AgendaSettingTheory;
use crate::theories::network_contagion::NetworkContagionTheory;
use crate::theories::memetic::MemeticTheory;
use crate::theories::echo_chamber::EchoChamberTheory;
use crate::theories::radicalization::RadicalizationTheory;
use crate::theories::prestige_influence::PrestigeInfluenceTheory;
use crate::theories::attention_economy::AttentionEconomyTheory;
use crate::theories::algorithmic_amplification::AlgorithmicAmplificationTheory;
use crate::statistics::metrics::Metrics;
use crate::statistics::export::ExportFormat;
use std::sync::Arc;

#[wasm_bindgen]
pub struct WasmWorld {
    world: World,
    scheduler: Scheduler,
    metrics: Metrics,
    metrics_history: Vec<Metrics>,
    theories: Vec<(String, bool)>,
}

#[wasm_bindgen]
impl WasmWorld {
    #[wasm_bindgen(constructor)]
    pub fn new(agent_count: usize, max_ticks: u64) -> WasmWorld {
        let mut world = World::new(12345);

        for i in 0..agent_count {
            let mind = AgentMind::random();
            let identity = IdentityMatrix::new();
            let capital = Capital::new();
            let mut agent = Agent::new(i, mind, identity, capital);
            // إنشاء روابط شبكية للوكلاء
            if i > 0 {
                world.dynamic_network.add_relationship(
                    i,
                    (i - 1) % agent_count,
                    crate::network::relationship::RelationType::Friends,
                    0,
                );
            }
            world.add_agent(agent);
        }

        let mut scheduler = Scheduler::new(max_ticks);

        // Add all theories by default
        scheduler.add_theory(Arc::new(SoftPowerTheory::new(0.01)));
        scheduler.add_theory(Arc::new(CulturalHegemonyTheory::new(0.02)));
        scheduler.add_theory(Arc::new(DiffusionOfInnovationsTheory::new(0.015)));
        scheduler.add_theory(Arc::new(SocialIdentityTheory::new(0.03)));
        scheduler.add_theory(Arc::new(SpiralOfSilenceTheory::new(0.02)));
        scheduler.add_theory(Arc::new(ManufacturingConsentTheory::new(0.015)));
        scheduler.add_theory(Arc::new(AgendaSettingTheory::new(0.02)));
        scheduler.add_theory(Arc::new(NetworkContagionTheory::new(0.01)));
        scheduler.add_theory(Arc::new(MemeticTheory::new(0.02, 0.05)));
        scheduler.add_theory(Arc::new(EchoChamberTheory::new(0.015)));
        scheduler.add_theory(Arc::new(RadicalizationTheory::new(0.01)));
        scheduler.add_theory(Arc::new(PrestigeInfluenceTheory::new(0.02)));
        scheduler.add_theory(Arc::new(AttentionEconomyTheory::new(0.025)));
        scheduler.add_theory(Arc::new(AlgorithmicAmplificationTheory::new(0.02)));

        let theories = vec![
            ("Soft Power".to_string(), true),
            ("Cultural Hegemony".to_string(), true),
            ("Diffusion of Innovations".to_string(), true),
            ("Social Identity".to_string(), true),
            ("Spiral of Silence".to_string(), true),
            ("Manufacturing Consent".to_string(), true),
            ("Agenda Setting".to_string(), true),
            ("Network Contagion".to_string(), true),
            ("Memetic".to_string(), true),
            ("Echo Chamber".to_string(), true),
            ("Radicalization".to_string(), true),
            ("Prestige Influence".to_string(), true),
            ("Attention Economy".to_string(), true),
            ("Algorithmic Amplification".to_string(), true),
        ];

        WasmWorld {
            world,
            scheduler,
            metrics: Metrics::new(),
            metrics_history: Vec::new(),
            theories,
        }
    }

    #[wasm_bindgen]
    pub fn step(&mut self) {
        // Run one simulation tick using Network Message Passing
        self.scheduler.step(&mut self.world);

        // Calculate and store metrics
        self.metrics.calculate(&self.world);
        self.metrics_history.push(self.metrics.clone());
    }

    #[wasm_bindgen]
    pub fn run_full(&mut self) {
        self.scheduler.run(&mut self.world);
    }

    #[wasm_bindgen]
    pub fn get_tick(&self) -> u64 {
        self.world.tick
    }

    #[wasm_bindgen]
    pub fn get_agent_count(&self) -> usize {
        self.world.agents.len()
    }

    // All 10 major metrics
    #[wasm_bindgen]
    pub fn get_polarization(&self) -> f32 {
        self.metrics.polarization_index
    }

    #[wasm_bindgen]
    pub fn get_cohesion(&self) -> f32 {
        self.metrics.cohesion_score
    }

    #[wasm_bindgen]
    pub fn get_identity_fragmentation(&self) -> f32 {
        self.metrics.identity_fragmentation
    }

    #[wasm_bindgen]
    pub fn get_memetic_velocity(&self) -> f32 {
        self.metrics.memetic_velocity
    }

    #[wasm_bindgen]
    pub fn get_elite_dominance(&self) -> f32 {
        self.metrics.elite_dominance
    }

    #[wasm_bindgen]
    pub fn get_resistance_strength(&self) -> f32 {
        self.metrics.resistance_strength
    }

    #[wasm_bindgen]
    pub fn get_echo_density(&self) -> f32 {
        self.metrics.echo_density
    }

    #[wasm_bindgen]
    pub fn get_narrative_volatility(&self) -> f32 {
        self.metrics.narrative_volatility
    }

    #[wasm_bindgen]
    pub fn get_algorithmic_capture(&self) -> f32 {
        self.metrics.algorithmic_capture
    }

    #[wasm_bindgen]
    pub fn get_ideological_entropy(&self) -> f32 {
        self.metrics.ideological_entropy
    }

    #[wasm_bindgen]
    pub fn get_belief_adoption(&self) -> f32 {
        self.metrics.average_belief_adoption
    }

    // New extended metrics
    #[wasm_bindgen]
    pub fn get_material_stress_index(&self) -> f32 {
        self.metrics.material_stress_index
    }

    #[wasm_bindgen]
    pub fn get_economic_despair_rate(&self) -> f32 {
        self.metrics.economic_despair_rate
    }

    #[wasm_bindgen]
    pub fn get_generational_divide(&self) -> f32 {
        self.metrics.generational_divide
    }

    #[wasm_bindgen]
    pub fn get_stability_preference(&self) -> f32 {
        self.metrics.stability_preference_index
    }

    #[wasm_bindgen]
    pub fn get_collapse_fear(&self) -> f32 {
        self.metrics.collapse_fear_aggregate
    }

    // Agent data for visualization
    #[wasm_bindgen]
    pub fn get_agent_states(&self) -> JsValue {
        let states: Vec<serde_json::Value> = self.world.agents.iter().map(|a| {
            serde_json::json!({
                "id": a.id,
                "state": a.state.name(),
                "age_group": a.age_profile.group.to_string(),
                "age": a.age_profile.age,
                "dominant_emotion": a.emotional_state.dominant().emoji(),
                "fear": a.emotional_state.fear,
                "anger": a.emotional_state.anger,
                "hope": a.emotional_state.hope,
                "despair": a.emotional_state.despair,
                "solidarity": a.emotional_state.solidarity,
                "is_influencer": a.is_influencer,
                "openness": a.mind.openness,
                "skepticism": a.mind.skepticism,
                "conformity": a.mind.conformity,
                "aggression": a.mind.aggression,
                "prestige": a.capital.symbolic,
                "adoption": a.beliefs.beliefs.values().copied().fold(0.0, f32::max),
            })
        }).collect();
        JsValue::from_str(&serde_json::to_string(&states).unwrap_or_default())
    }

    #[wasm_bindgen]
    pub fn get_agent_positions(&self) -> JsValue {
        let positions: Vec<serde_json::Value> = self.world.agents.iter().map(|a| {
            serde_json::json!({
                "id": a.id,
                "aggression": a.mind.aggression,
                "openness": a.mind.openness,
                "prestige": a.capital.symbolic,
                "is_influencer": a.is_influencer,
                "state": a.state.name(),
                "adoption": a.beliefs.beliefs.values().copied().fold(0.0, f32::max),
                "emotion": a.emotional_state.dominant().emoji(),
            })
        }).collect();
        JsValue::from_str(&serde_json::to_string(&positions).unwrap_or_default())
    }

    // Theory management
    #[wasm_bindgen]
    pub fn get_theories(&self) -> JsValue {
        let theories_json: Vec<serde_json::Value> = self.theories.iter().map(|(name, enabled)| {
            serde_json::json!({
                "name": name,
                "enabled": enabled
            })
        }).collect();
        JsValue::from_str(&serde_json::to_string(&theories_json).unwrap_or_default())
    }

    #[wasm_bindgen]
    pub fn toggle_theory(&mut self, name: &str, enabled: bool) {
        // Map JS TheoryKey (e.g. "softPower") or display name (e.g. "Soft Power") 
        // to the display name used in self.theories tracking list,
        // and to the full Rust theory name used in scheduler.
        let (display_name, rust_name): (&str, &str) = match name {
            // TheoryKey format (from JS App.tsx)
            "softPower" => ("Soft Power", "Soft Power (Joseph Nye)"),
            "culturalHegemony" => ("Cultural Hegemony", "Cultural Hegemony (Gramsci)"),
            "diffusionOfInnovations" => ("Diffusion of Innovations", "Diffusion of Innovations (Rogers)"),
            "socialIdentity" => ("Social Identity", "Social Identity (Tajfel & Turner)"),
            "spiralOfSilence" => ("Spiral of Silence", "Spiral of Silence (Noelle-Neumann)"),
            "manufacturingConsent" => ("Manufacturing Consent", "Manufacturing Consent (Herman & Chomsky)"),
            "agendaSetting" => ("Agenda Setting", "Agenda Setting (McCombs & Shaw)"),
            "networkContagion" => ("Network Contagion", "Network Contagion"),
            "memetic" => ("Memetic", "Memetic (Dawkins)"),
            "echoChamber" => ("Echo Chamber", "Echo Chamber"),
            "radicalization" => ("Radicalization", "Radicalization"),
            "prestigeInfluence" => ("Prestige Influence", "Prestige Influence"),
            "attentionEconomy" => ("Attention Economy", "Attention Economy"),
            "algorithmicAmplification" => ("Algorithmic Amplification", "Algorithmic Amplification"),
            // Display name format (from get_theories)
            "Soft Power" => ("Soft Power", "Soft Power (Joseph Nye)"),
            "Cultural Hegemony" => ("Cultural Hegemony", "Cultural Hegemony (Gramsci)"),
            "Diffusion of Innovations" => ("Diffusion of Innovations", "Diffusion of Innovations (Rogers)"),
            "Social Identity" => ("Social Identity", "Social Identity (Tajfel & Turner)"),
            "Spiral of Silence" => ("Spiral of Silence", "Spiral of Silence (Noelle-Neumann)"),
            "Manufacturing Consent" => ("Manufacturing Consent", "Manufacturing Consent (Herman & Chomsky)"),
            "Agenda Setting" => ("Agenda Setting", "Agenda Setting (McCombs & Shaw)"),
            "Network Contagion" => ("Network Contagion", "Network Contagion"),
            "Memetic" => ("Memetic", "Memetic (Dawkins)"),
            "Echo Chamber" => ("Echo Chamber", "Echo Chamber"),
            "Radicalization" => ("Radicalization", "Radicalization"),
            "Prestige Influence" => ("Prestige Influence", "Prestige Influence"),
            "Attention Economy" => ("Attention Economy", "Attention Economy"),
            "Algorithmic Amplification" => ("Algorithmic Amplification", "Algorithmic Amplification"),
            _ => return,
        };
        // Update the tracking list (used for get_theories)
        if let Some((_, e)) = self.theories.iter_mut().find(|(n, _)| n == display_name) {
            *e = enabled;
        }
        // Actually propagate the toggle to the engine's EnableableTheory
        self.scheduler.set_theory_enabled(rust_name, enabled);
    }

    // Export functions
    #[wasm_bindgen]
    pub fn export_json(&self) -> String {
        ExportFormat::export_json(&self.world, &self.metrics)
    }

    #[wasm_bindgen]
    pub fn export_csv(&self) -> String {
        ExportFormat::export_metrics_csv(&self.metrics_history)
    }

    #[wasm_bindgen]
    pub fn export_summary(&self) -> String {
        ExportFormat::export_summary(&self.world, &self.metrics)
    }

    #[wasm_bindgen]
    pub fn export_all_agents_full(&self) -> String {
        ExportFormat::export_all_agents_full(&self.world, &self.metrics)
    }

    #[wasm_bindgen]
    pub fn export_injected_agents(&self) -> String {
        ExportFormat::export_injected_agents(&self.world, &self.metrics)
    }

    // Simulation control
    #[wasm_bindgen]
    pub fn toggle_pause(&mut self) {
        self.scheduler.is_paused = !self.scheduler.is_paused;
    }

    #[wasm_bindgen]
    pub fn is_paused(&self) -> bool {
        self.scheduler.is_paused
    }

    #[wasm_bindgen]
    pub fn set_speed(&mut self, speed: &str) {
        match speed {
            "slow" => self.scheduler.set_speed(SchedulerSpeed::Slow),
            "fast" => self.scheduler.set_speed(SchedulerSpeed::Fast),
            _ => self.scheduler.set_speed(SchedulerSpeed::Normal),
        }
    }
}