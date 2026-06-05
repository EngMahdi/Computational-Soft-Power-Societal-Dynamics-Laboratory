use crate::runtime::world::World;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metrics {
    // المؤشرات الرئيسية الـ11
    pub polarization_index: f32,
    pub cohesion_score: f32,
    pub identity_fragmentation: f32,
    pub memetic_velocity: f32,
    pub elite_dominance: f32,
    pub resistance_strength: f32,
    pub echo_density: f32,
    pub narrative_volatility: f32,
    pub algorithmic_capture: f32,
    pub ideological_entropy: f32,
    pub average_belief_adoption: f32,

    // مؤشرات إضافية
    pub network_density: f32,
    pub cluster_count: f32,
    pub timestamp: u64,

    // مقاييس موسعة جديدة — v3.0
    pub material_stress_index: f32,
    pub economic_despair_rate: f32,
    pub state_legitimacy_score: f32,
    pub militia_influence_reach: f32,
    pub religious_authority_pull: f32,
    pub generational_divide: f32,
    pub youth_mobilization_potential: f32,
    pub collective_trauma_activation: f32,
    pub stability_preference_index: f32,
    pub collapse_fear_aggregate: f32,
}

impl Metrics {
    pub fn new() -> Self {
        Self {
            polarization_index: 0.0,
            cohesion_score: 1.0,
            identity_fragmentation: 0.0,
            memetic_velocity: 0.0,
            elite_dominance: 0.0,
            resistance_strength: 0.0,
            echo_density: 0.0,
            narrative_volatility: 0.0,
            algorithmic_capture: 0.0,
            ideological_entropy: 0.0,
            average_belief_adoption: 0.0,
            network_density: 0.0,
            cluster_count: 0.0,
            timestamp: 0,
            material_stress_index: 0.0,
            economic_despair_rate: 0.0,
            state_legitimacy_score: 0.0,
            militia_influence_reach: 0.0,
            religious_authority_pull: 0.0,
            generational_divide: 0.0,
            youth_mobilization_potential: 0.0,
            collective_trauma_activation: 0.0,
            stability_preference_index: 0.0,
            collapse_fear_aggregate: 0.0,
        }
    }

    /// حساب جميع المقاييس من حالة العالم — تستخدم WorldStats المحسوبة مسبقاً
    pub fn calculate(&mut self, world: &World) {
        self.timestamp = world.tick;

        // استخدام المقاييس المحسوبة بالفعل في World
        self.polarization_index = world.stats.polarization_index;
        self.cohesion_score = world.stats.cohesion_score;
        self.identity_fragmentation = world.stats.identity_fragmentation;
        self.memetic_velocity = world.stats.memetic_velocity;
        self.elite_dominance = world.stats.elite_dominance;
        self.resistance_strength = world.stats.resistance_strength;
        self.echo_density = world.stats.echo_density;
        self.narrative_volatility = world.stats.narrative_volatility;
        self.algorithmic_capture = world.stats.algorithmic_capture;
        self.ideological_entropy = world.stats.ideological_entropy;
        self.average_belief_adoption = world.stats.average_belief_adoption;
        self.network_density = world.stats.network_density;
        self.cluster_count = world.stats.cluster_count as f32;

        // المقاييس الموسعة
        self.material_stress_index = world.stats.material_stress_index;
        self.economic_despair_rate = world.stats.economic_despair_rate;
        self.state_legitimacy_score = world.stats.state_legitimacy_score;
        self.militia_influence_reach = world.stats.militia_influence_reach;
        self.religious_authority_pull = world.stats.religious_authority_pull;
        self.generational_divide = world.stats.generational_divide;
        self.youth_mobilization_potential = world.stats.youth_mobilization_potential;
        self.collective_trauma_activation = world.stats.collective_trauma_activation;
        self.stability_preference_index = world.stats.stability_preference_index;
        self.collapse_fear_aggregate = world.stats.collapse_fear_aggregate;
    }
}

impl Default for Metrics {
    fn default() -> Self {
        Self::new()
    }
}