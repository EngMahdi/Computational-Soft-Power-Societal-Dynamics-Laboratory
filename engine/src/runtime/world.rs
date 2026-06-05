use crate::agents::mind::AgentMind;
use crate::agents::identity::IdentityMatrix;
use crate::agents::capital::Capital;
use crate::agents::age::{AgeProfile, AgeGroup};
use crate::agents::emotional::{EmotionalState, EmotionLabel};
use crate::agents::memory::{AgentMemory, EventId};
use crate::core::signal::{Signal, EmotionalCharge, AgentSignals, SignalPropagationResult};
use crate::runtime::region_context::RegionContext;
use crate::network::dynamic_network::DynamicNetwork;
use petgraph::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// معتقدات الوكيل حول الأفكار المختلفة
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BeliefSystem {
    pub beliefs: HashMap<String, f32>,
    pub saturation: HashMap<String, f32>,
    pub fatigue: f32,
}

impl BeliefSystem {
    pub fn new() -> Self {
        Self {
            beliefs: HashMap::new(),
            saturation: HashMap::new(),
            fatigue: 0.0,
        }
    }
}

/// حالة الوكيل
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AgentState {
    Moderate,
    Extremist,
    Conservative,
    Liberal,
    PositiveInfluencer,
    NegativeInfluencer,
    Resistant,
    Gullible,
    Activist,
    Isolated,
}

impl AgentState {
    pub fn emoji(&self) -> &'static str {
        match self {
            AgentState::Moderate => "⚖️",
            AgentState::Extremist => "🔥",
            AgentState::Conservative => "🔒",
            AgentState::Liberal => "🌿",
            AgentState::PositiveInfluencer => "⭐",
            AgentState::NegativeInfluencer => "💀",
            AgentState::Resistant => "🛡️",
            AgentState::Gullible => "🧽",
            AgentState::Activist => "📢",
            AgentState::Isolated => "🏝️",
        }
    }

    pub fn name(&self) -> &'static str {
        match self {
            AgentState::Moderate => "moderate",
            AgentState::Extremist => "extremist",
            AgentState::Conservative => "conservative",
            AgentState::Liberal => "liberal",
            AgentState::PositiveInfluencer => "positiveInfluencer",
            AgentState::NegativeInfluencer => "negativeInfluencer",
            AgentState::Resistant => "resistant",
            AgentState::Gullible => "gullible",
            AgentState::Activist => "activist",
            AgentState::Isolated => "isolated",
        }
    }
}

/// هيكل الموقع الجغرافي
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentLocation {
    pub province: String,
    pub district: String,
}

/// تحديد قرار التغيير — مبدأ التفضيل الاستقراري
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ChangeDecision {
    Support,
    ActivelyOppose,
    Passive,
}

/// وكيل محسّن — v3.0
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: usize,
    pub mind: AgentMind,
    pub identity: IdentityMatrix,
    pub capital: Capital,
    pub beliefs: BeliefSystem,
    pub node_index: NodeIndex,
    pub age_profile: AgeProfile,
    pub emotional_state: EmotionalState,
    pub memory: AgentMemory,
    pub state: AgentState,
    pub location: AgentLocation,
    pub is_influencer: bool,
    pub injection_history: Vec<InjectionRecord>,
    pub collective_memory_resonance: f32,
}

impl Agent {
    pub fn new(id: usize, mind: AgentMind, identity: IdentityMatrix, capital: Capital) -> Self {
        let age = AgeProfile::new(rand::random::<u8>() % 80 + 18);
        Self {
            id,
            mind,
            identity,
            capital,
            beliefs: BeliefSystem::new(),
            node_index: NodeIndex::new(0),
            age_profile: age,
            emotional_state: EmotionalState::new(),
            memory: AgentMemory::new(),
            state: AgentState::Moderate,
            location: AgentLocation {
                province: "بغداد".to_string(),
                district: "المركز".to_string(),
            },
            is_influencer: rand::random::<f32>() < 0.05,
            injection_history: Vec::new(),
            collective_memory_resonance: 0.0,
        }
    }

    /// معالجة الإشارات الواردة — القلب الجديد لـ AgentMind
    pub fn process_signals(&mut self, signals: Vec<Signal>, ctx: &WorldContext) {
        for signal in signals {
            // السمات الشخصية تحدد الاستجابة
            let acceptance = self.mind.calculate_acceptance(
                &signal,
                self.emotional_state.fear
            );

            if acceptance > self.mind.resistance_threshold() {
                // تطبيق تحول المعتقد
                self.apply_belief_shift(signal.belief_delta * acceptance);

                // تذكر المصدر
                self.memory.remember_source(signal.source_id);

                // تطبيق التغيير العاطفي
                self.emotional_state.apply_charge(&signal.emotional_charge, acceptance);

                // إضافة للذاكرة طويلة الأمد إذا كانت الإشارة قوية
                if acceptance > 0.6 {
                    self.memory.add_or_update_belief(
                        &signal.source_theory,
                        acceptance,
                        ctx.tick,
                        signal.source_id,
                    );
                }
            }

            // مصدر موثوق مسبقاً → تخفيض عامل الشك
            if self.memory.is_trusted_source(signal.source_id) {
                self.mind.skepticism = (self.mind.skepticism * 0.99).max(0.05);
            }
        }

        // تحديث الحالة بناءً على الإشارات المعالجة
        self.state = self.derive_state_from_mind();

        // تطبيق اضمحلال الذاكرة
        self.memory.apply_decay(1.0);
    }

    /// تطبيق تحول المعتقد
    pub fn apply_belief_shift(&mut self, delta: f32) {
        for (_key, value) in self.beliefs.beliefs.iter_mut() {
            *value = (*value + delta * 0.1).clamp(0.0, 1.0);
        }
    }

    /// اشتقاق الحالة من العقل — خوارزمية الهجرة الجديدة
    pub fn derive_state_from_mind(&self) -> AgentState {
        let polarization = self.beliefs.beliefs.values()
            .map(|v| (v - 0.5).abs())
            .sum::<f32>()
            / self.beliefs.beliefs.len().max(1) as f32;

        let openness = self.mind.openness;
        let rigidity = self.mind.ideological_rigidity;
        let aggression = self.mind.aggression;
        let prestige = self.mind.prestige_seeking;
        let skepticism = self.mind.skepticism;

        if polarization > 0.7 && aggression > 0.6 {
            AgentState::Extremist
        } else if rigidity > 0.6 && openness < 0.3 {
            AgentState::Conservative
        } else if openness > 0.7 && skepticism < 0.3 {
            AgentState::Liberal
        } else if prestige > 0.7 && self.is_influencer {
            if aggression > 0.5 {
                AgentState::NegativeInfluencer
            } else {
                AgentState::PositiveInfluencer
            }
        } else if skepticism > 0.7 && rigidity > 0.5 {
            AgentState::Resistant
        } else if openness > 0.6 && skepticism < 0.2 {
            AgentState::Gullible
        } else if polarization > 0.5 && aggression > 0.4 {
            AgentState::Activist
        } else if polarization < 0.2 && self.capital.social < 0.2 {
            AgentState::Isolated
        } else {
            AgentState::Moderate
        }
    }

    /// تقييم تحمل التغيير — مبدأ "الوضع السيئ المستقر"
    pub fn evaluate_change_tolerance(&self, change_benefit: f32, change_uncertainty: f32) -> ChangeDecision {
        let collapse_fear = self.emotional_state.fear
            * self.age_profile.collapse_fear_baseline()
            * self.collective_memory_resonance;

        let status_quo_satisfaction = 0.5 - self.mind.openness * 0.3 + self.mind.conformity * 0.2;
        let expected_utility = change_benefit - (change_uncertainty * collapse_fear);

        if expected_utility > status_quo_satisfaction + collapse_fear {
            ChangeDecision::Support
        } else if collapse_fear > 0.7 {
            ChangeDecision::ActivelyOppose
        } else {
            ChangeDecision::Passive
        }
    }

    /// جيران الوكيل في الشبكة
    pub fn neighbors<'a>(&self, network: &'a DynamicNetwork) -> Vec<usize> {
        network.neighbors(self.id)
    }
}

/// تسجيل حقن سابق
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InjectionRecord {
    pub tick: u64,
    pub injection_type: String,
    pub payload: String,
    pub spread_to_network: bool,
}

/// سياق العالم
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldContext {
    pub tick: u64,
    pub region_context: Option<RegionContext>,
}

/// إحصائيات المحاكاة الموسعة
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldStats {
    // المقاييس الأساسية الـ11
    pub polarization_index: f32,
    pub cohesion_score: f32,
    pub identity_fragmentation: f32,
    pub memetic_velocity: f32,
    pub echo_density: f32,
    pub elite_dominance: f32,
    pub resistance_strength: f32,
    pub narrative_volatility: f32,
    pub algorithmic_capture: f32,
    pub ideological_entropy: f32,
    pub average_belief_adoption: f32,

    // مقاييس موسعة جديدة
    pub material_stress_index: f32,
    pub economic_despair_rate: f32,
    pub state_legitimacy_score: f32,
    pub militia_influence_reach: f32,
    pub religious_authority_pull: f32,
    pub generational_divide: f32,
    pub youth_mobilization_potential: f32,
    pub collective_trauma_activation: f32,
    pub historical_pattern_resonance: f32,
    pub stability_preference_index: f32,
    pub collapse_fear_aggregate: f32,

    // إحصائيات إضافية
    pub network_density: f32,
    pub cluster_count: u32,
    pub dominant_emotion: String,
    pub age_distribution: HashMap<String, u32>,
    pub agent_state_distribution: HashMap<String, u32>,
}

impl WorldStats {
    pub fn new() -> Self {
        Self {
            polarization_index: 0.0,
            cohesion_score: 1.0,
            identity_fragmentation: 0.0,
            memetic_velocity: 0.0,
            echo_density: 0.0,
            elite_dominance: 0.0,
            resistance_strength: 0.0,
            narrative_volatility: 0.0,
            algorithmic_capture: 0.0,
            ideological_entropy: 0.0,
            average_belief_adoption: 0.0,
            material_stress_index: 0.0,
            economic_despair_rate: 0.0,
            state_legitimacy_score: 0.0,
            militia_influence_reach: 0.0,
            religious_authority_pull: 0.0,
            generational_divide: 0.0,
            youth_mobilization_potential: 0.0,
            collective_trauma_activation: 0.0,
            historical_pattern_resonance: 0.0,
            stability_preference_index: 0.0,
            collapse_fear_aggregate: 0.0,
            network_density: 0.0,
            cluster_count: 0,
            dominant_emotion: "calm".to_string(),
            age_distribution: HashMap::new(),
            agent_state_distribution: HashMap::new(),
        }
    }
}

/// WORLD — قلب المحاكاة المُعاد بناؤه
#[derive(Debug, Serialize, Deserialize)]
pub struct World {
    pub agents: Vec<Agent>,
    pub social_graph: Graph<usize, f32>,
    pub dynamic_network: DynamicNetwork,
    pub tick: u64,
    pub stats: WorldStats,
    pub seed: u64,
    pub context: WorldContext,
    pub snapshots: Vec<WorldSnapshot>,
}

/// لقطة من حالة العالم
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorldSnapshot {
    pub tick: u64,
    pub agents: Vec<Agent>,
}

impl World {
    pub fn new(seed: u64) -> Self {
        Self {
            agents: Vec::new(),
            social_graph: Graph::new(),
            dynamic_network: DynamicNetwork::new(),
            tick: 0,
            stats: WorldStats::new(),
            seed,
            context: WorldContext {
                tick: 0,
                region_context: Some(RegionContext::default()),
            },
            snapshots: Vec::new(),
        }
    }

    pub fn add_agent(&mut self, mut agent: Agent) {
        let node = self.social_graph.add_node(agent.id);
        agent.node_index = node;
        self.agents.push(agent);
    }

    pub fn agent_count(&self) -> usize {
        self.agents.len()
    }

    pub fn take_snapshot(&mut self) {
        let snapshot = WorldSnapshot {
            tick: self.tick,
            agents: self.agents.clone(),
        };
        self.snapshots.push(snapshot);
    }

    /// خطوة المحاكاة الجديدة — Network Message Passing
    pub fn step(&mut self) {
        self.context.tick = self.tick;

        // المرحلة 1: توليد الإشارات عبر حواف الشبكة
        let signals = self.propagate_signals();

        // المرحلة 2: كل وكيل يعالج إشاراته حسب سماته الشخصية
        for agent in self.agents.iter_mut() {
            let incoming = signals.for_agent(agent.id);
            if !incoming.is_empty() {
                agent.process_signals(incoming, &self.context);
            }

            // التحديث العاطفي الطبيعي
            agent.emotional_state.update(1.0);
        }

        // المرحلة 3: المقاييس تُحسب كتجميع من حالات الوكلاء
        self.compute_stats();

        // المرحلة 4: تحديث الشبكة الديناميكية
        self.dynamic_network.update();

        // المرحلة 5: حفظ لقطة دورية
        if self.tick % 100 == 0 {
            self.take_snapshot();
        }

        self.tick += 1;
    }

    /// توليد الإشارات عبر الشبكة
    pub fn propagate_signals(&self) -> SignalPropagationResult {
        let mut result = SignalPropagationResult::new();
        let mut agent_signal_map: HashMap<usize, Vec<Signal>> = HashMap::new();

        for agent in &self.agents {
            let neighbors = agent.neighbors(&self.dynamic_network);

            for neighbor_id in neighbors {
                let strength = agent.mind.openness * 0.3 + agent.mind.prestige_seeking * 0.2;
                let credibility_gap = 1.0 - agent.mind.trust_in_institutions;
                let social_pressure = agent.mind.conformity * 0.5 + agent.age_profile.social_authority() * 0.5;

                let signal = Signal {
                    source_id: agent.id,
                    target_id: neighbor_id,
                    source_theory: "social_influence".to_string(),
                    belief_delta: agent.beliefs.beliefs.values().sum::<f32>()
                        / agent.beliefs.beliefs.len().max(1) as f32 - 0.5,
                    strength: strength.min(1.0),
                    credibility_gap: credibility_gap.min(1.0),
                    social_pressure: social_pressure.min(1.0),
                    emotional_charge: match agent.emotional_state.dominant() {
                        EmotionLabel::Fear => EmotionalCharge::Fear,
                        EmotionLabel::Anger => EmotionalCharge::Anger,
                        EmotionLabel::Hope => EmotionalCharge::Hope,
                        EmotionLabel::Pride => EmotionalCharge::Pride,
                        EmotionLabel::Solidarity => EmotionalCharge::Solidarity,
                        EmotionLabel::Despair => EmotionalCharge::Suppress,
                        EmotionLabel::RageDespair => EmotionalCharge::Fear,
                        EmotionLabel::CollectiveVigilance => EmotionalCharge::Solidarity,
                        _ => EmotionalCharge::Neutral,
                    },
                    target_age_preference: None,
                };

                result.signals.push(signal.clone());
                agent_signal_map.entry(neighbor_id).or_default().push(signal);
            }
        }

        // بناء AgentSignals
        for (agent_id, signals) in agent_signal_map {
            result.agent_signals.push(AgentSignals {
                agent_id,
                signals,
            });
        }

        result.total_signals_sent = result.signals.len();
        result
    }

    /// حساب جميع المقاييس
    pub fn compute_stats(&mut self) {
        if self.agents.is_empty() {
            return;
        }

        let n = self.agents.len() as f32;

        // المقاييس الأساسية
        let mut polarization = 0.0;
        let mut beliefs_sum = 0.0;
        let mut fatigue_sum = 0.0;
        let mut elite_capital = 0.0;
        let mut resistance = 0.0;
        let mut adoption_sum = 0.0;

        // إحصائيات جديدة
        let mut fear_sum = 0.0;
        let mut anger_sum = 0.0;
        let mut hope_sum = 0.0;
        let mut despair_sum = 0.0;
        let mut solidarity_sum = 0.0;
        let mut collapse_fear_sum = 0.0;
        let mut stability_support = 0.0;
        let mut youth_anger = 0.0;
        let mut youth_count = 0;
        let mut elder_count = 0;

        // توزيع الأعمار والحالات
        let mut age_dist: HashMap<String, u32> = HashMap::new();
        let mut state_dist: HashMap<String, u32> = HashMap::new();

        for agent in &self.agents {
            // المقاييس الأساسية
            let belief_count = agent.beliefs.beliefs.len();
            if belief_count > 0 {
                let avg_belief = agent.beliefs.beliefs.values().sum::<f32>() / belief_count as f32;
                polarization += (avg_belief - 0.5).abs();
                adoption_sum += avg_belief;
            }
            fatigue_sum += agent.beliefs.fatigue;

            if agent.is_influencer {
                elite_capital += agent.capital.symbolic;
            }

            resistance += agent.mind.skepticism + agent.mind.ideological_rigidity;

            // المقاييس العاطفية
            fear_sum += agent.emotional_state.fear;
            anger_sum += agent.emotional_state.anger;
            hope_sum += agent.emotional_state.hope;
            despair_sum += agent.emotional_state.despair;
            solidarity_sum += agent.emotional_state.solidarity;
            collapse_fear_sum += agent.emotional_state.fear * agent.age_profile.collapse_fear_baseline();

            // التفضيل الاستقراري
            if agent.evaluate_change_tolerance(0.5, 0.5) == ChangeDecision::ActivelyOppose {
                stability_support += 1.0;
            }

            // توزيع الأعمار
            let age_key = agent.age_profile.group.to_string();
            *age_dist.entry(age_key).or_insert(0) += 1;

            // توزيع الحالات
            let state_key = agent.state.name().to_string();
            *state_dist.entry(state_key).or_insert(0) += 1;

            // مقاييس الأجيال
            match agent.age_profile.group {
                AgeGroup::Youth => {
                    youth_anger += agent.emotional_state.anger;
                    youth_count += 1;
                }
                AgeGroup::Elder => {
                    elder_count += 1;
                }
                _ => {}
            }
        }

        // تعبئة المقاييس الأساسية
        self.stats.polarization_index = (polarization / n).min(1.0);
        self.stats.cohesion_score = 1.0 - self.stats.polarization_index;
        self.stats.identity_fragmentation = self.agents.iter()
            .map(|a| a.identity.ideological_identity)
            .sum::<f32>() / n;
        self.stats.memetic_velocity = (fatigue_sum / n * 10.0).min(1.0);
        self.stats.elite_dominance = (elite_capital / n * 2.0).min(1.0);
        self.stats.resistance_strength = (resistance / (n * 2.0)).min(1.0);
        self.stats.echo_density = (fatigue_sum / n * 0.5).min(1.0);
        self.stats.narrative_volatility = (self.stats.memetic_velocity * 0.5 + self.stats.polarization_index * 0.5).min(1.0);
        self.stats.algorithmic_capture = self.agents.iter()
            .map(|a| a.mind.trust_in_institutions)
            .sum::<f32>() / n * self.stats.echo_density;
        self.stats.average_belief_adoption = (adoption_sum / n).min(1.0);

        // إنتروبيا أيديولوجية
        let mut entropy = 0.0;
        for agent in &self.agents {
            for belief in agent.beliefs.beliefs.values() {
                if *belief > 0.0 && *belief < 1.0 {
                    entropy -= belief * belief.log2() + (1.0 - belief) * (1.0 - belief).log2();
                }
            }
        }
        self.stats.ideological_entropy = (entropy / n / 10.0).min(1.0);

        // المقاييس الموسعة الجديدة
        if let Some(ctx) = &self.context.region_context {
            self.stats.material_stress_index = ctx.material.material_stress_index();
            self.stats.economic_despair_rate = ctx.material.economic_despair_rate();
            self.stats.state_legitimacy_score = ctx.institutions.government_trust;
            self.stats.militia_influence_reach = ctx.power_networks.internal_faction_influence;
            self.stats.religious_authority_pull = ctx.institutions.traditional_authority_trust;
        }

        // الفجوة الجيلية
        let elder_anger = self.agents.iter()
            .filter(|a| matches!(a.age_profile.group, AgeGroup::Elder))
            .map(|a| a.emotional_state.anger)
            .sum::<f32>() / elder_count.max(1) as f32;
        let avg_youth_anger = youth_anger / youth_count.max(1) as f32;
        self.stats.generational_divide = (avg_youth_anger - elder_anger).abs().min(1.0);
        self.stats.youth_mobilization_potential = (avg_youth_anger * 0.5 + self.stats.material_stress_index * 0.5).min(1.0);

        // الذاكرة الجماعية
        self.stats.collective_trauma_activation = self.agents.iter()
            .map(|a| a.collective_memory_resonance)
            .sum::<f32>() / n;

        self.stats.collapse_fear_aggregate = (collapse_fear_sum / n).min(1.0);
        self.stats.stability_preference_index = (stability_support / n).min(1.0);

        // المشاعر السائدة
        let max_emotion = fear_sum.max(anger_sum).max(hope_sum).max(despair_sum).max(solidarity_sum);
        self.stats.dominant_emotion = if max_emotion == fear_sum { "fear".to_string() }
            else if max_emotion == anger_sum { "anger".to_string() }
            else if max_emotion == hope_sum { "hope".to_string() }
            else if max_emotion == despair_sum { "despair".to_string() }
            else if max_emotion == solidarity_sum { "solidarity".to_string() }
            else { "calm".to_string() };

        self.stats.network_density = self.dynamic_network.network_density(self.agents.len());
        self.stats.cluster_count = self.dynamic_network.clusters.len() as u32;
        self.stats.age_distribution = age_dist;
        self.stats.agent_state_distribution = state_dist;
    }
}