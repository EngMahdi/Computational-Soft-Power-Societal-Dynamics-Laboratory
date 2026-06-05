use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Generic region context — works for any society/location
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionContext {
    /// Region name (user-defined)
    pub region_name: String,

    /// Institutional trust levels
    pub institutions: InstitutionTrust,

    /// Material / socioeconomic indicators
    pub material: MaterialIndicators,

    /// Collective memory (cumulative historical traumas)
    pub collective_memory: CollectiveMemoryProfile,

    /// Power network influence factors
    pub power_networks: PowerNetworks,
}

impl Default for RegionContext {
    fn default() -> Self {
        Self {
            region_name: "المركز".to_string(),
            institutions: InstitutionTrust::default(),
            material: MaterialIndicators::default(),
            collective_memory: CollectiveMemoryProfile::default(),
            power_networks: PowerNetworks::default(),
        }
    }
}

impl RegionContext {
    pub fn new(region_name: &str) -> Self {
        Self {
            region_name: region_name.to_string(),
            ..Default::default()
        }
    }
}

/// Institutional trust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstitutionTrust {
    pub government_trust: f32,
    pub civil_society_trust: f32,
    pub traditional_authority_trust: f32,
    pub security_forces_trust: f32,
    pub media_trust: f32,
}

impl Default for InstitutionTrust {
    fn default() -> Self {
        Self {
            government_trust: 0.35,
            civil_society_trust: 0.50,
            traditional_authority_trust: 0.55,
            security_forces_trust: 0.45,
            media_trust: 0.30,
        }
    }
}

/// Material indicators
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialIndicators {
    pub unemployment_rate: f32,
    pub youth_unemployment_rate: f32,
    pub inflation_rate: f32,
    pub poverty_rate: f32,
    pub basic_services_access: f32,  // 0-1 (electricity, water, etc.)
}

impl Default for MaterialIndicators {
    fn default() -> Self {
        Self {
            unemployment_rate: 0.15,
            youth_unemployment_rate: 0.30,
            inflation_rate: 0.08,
            poverty_rate: 0.20,
            basic_services_access: 0.65,
        }
    }
}

impl MaterialIndicators {
    /// Composite material stress index
    pub fn material_stress_index(&self) -> f32 {
        let service_stress = (1.0 - self.basic_services_access) * 0.3;
        let employment_stress = (self.unemployment_rate + self.youth_unemployment_rate) / 2.0 * 0.3;
        let economic_stress = (self.inflation_rate + self.poverty_rate) / 2.0 * 0.4;
        (service_stress + employment_stress + economic_stress).min(1.0)
    }

    /// Economic despair rate
    pub fn economic_despair_rate(&self) -> f32 {
        (self.youth_unemployment_rate * 0.5 + self.poverty_rate * 0.3 + self.inflation_rate * 0.2).min(1.0)
    }
}

/// Historical event in collective memory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoricalEvent {
    pub year: u32,
    pub name: String,
    pub trauma_weight: f32,  // 0.0 - 1.0
}

/// Collective memory profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectiveMemoryProfile {
    pub events: Vec<HistoricalEvent>,
}

impl Default for CollectiveMemoryProfile {
    fn default() -> Self {
        // Generic neutral defaults — no hardcoded country events
        Self { events: vec![] }
    }
}

impl CollectiveMemoryProfile {
    pub fn calculate_resonance(&self, _event_type: &str, current_year: u32) -> f32 {
        if self.events.is_empty() {
            return 0.2; // baseline resonance for regions with no defined history
        }
        self.events.iter()
            .filter(|e| {
                let years_ago = current_year.saturating_sub(e.year);
                years_ago > 0 && years_ago < 60
            })
            .map(|e| {
                let recency = 1.0 - ((current_year - e.year) as f32 / 60.0).min(1.0);
                e.trauma_weight * recency
            })
            .sum::<f32>()
            .min(1.0)
    }
}

/// Power networks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PowerNetworks {
    pub internal_faction_influence: f32,
    pub external_soft_power_a: f32,   // e.g. regional power A
    pub external_soft_power_b: f32,   // e.g. regional power B
    pub traditional_community_power: f32,
    pub media_influence: f32,
}

impl Default for PowerNetworks {
    fn default() -> Self {
        Self {
            internal_faction_influence: 0.40,
            external_soft_power_a: 0.35,
            external_soft_power_b: 0.25,
            traditional_community_power: 0.45,
            media_influence: 0.50,
        }
    }
}

/// Generic region/area profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionProfile {
    pub name: String,
    pub population_sample: u32,
    pub dominant_identity: String,
    pub traditional_structure_strength: f32,
    pub religious_practice_level: f32,
    pub urban_rural_ratio: f32,
    pub youth_frustration_index: f32,
    pub collective_memory_weight: f32,
    pub special_factors: Vec<String>,
}

/// Generic external event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionEvent {
    pub id: String,
    pub name: String,
    pub trigger: EventTrigger,
    pub probability_per_tick: f32,
    pub impacts: EventImpacts,
    pub target_groups: Vec<String>,
    pub geographic_scope: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventTrigger {
    Manual,
    Random,
    ManualOrRandom,
    RandomOrInjection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventImpacts {
    pub material: Option<MaterialDelta>,
    pub emotional: Option<EmotionalDelta>,
    pub institutional: Option<InstitutionDelta>,
    pub belief: Option<HashMap<String, f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialDelta {
    pub services_access_delta: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmotionalDelta {
    pub fear: Option<f32>,
    pub anger: Option<f32>,
    pub hope: Option<f32>,
    pub despair: Option<f32>,
    pub solidarity: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstitutionDelta {
    pub government_trust: Option<f32>,
    pub civil_society_trust: Option<f32>,
    pub traditional_authority_trust: Option<f32>,
    pub security_forces_trust: Option<f32>,
}

/// Generic societal event bank — applicable to any region
pub fn get_region_event_bank() -> Vec<RegionEvent> {
    vec![
        RegionEvent {
            id: "services_crisis".to_string(),
            name: "أزمة خدمات أساسية".to_string(),
            trigger: EventTrigger::ManualOrRandom,
            probability_per_tick: 0.002,
            impacts: EventImpacts {
                material: Some(MaterialDelta { services_access_delta: Some(-0.10) }),
                emotional: Some(EmotionalDelta { anger: Some(0.25), despair: Some(0.15), hope: None, fear: None, solidarity: None }),
                institutional: Some(InstitutionDelta { government_trust: Some(-0.08), civil_society_trust: None, traditional_authority_trust: None, security_forces_trust: None }),
                belief: None,
            },
            target_groups: vec!["Adult".to_string(), "Elder".to_string()],
            geographic_scope: "region_wide".to_string(),
        },
        RegionEvent {
            id: "viral_protest".to_string(),
            name: "انتشار فيديو احتجاجي".to_string(),
            trigger: EventTrigger::RandomOrInjection,
            probability_per_tick: 0.004,
            impacts: EventImpacts {
                material: None,
                emotional: Some(EmotionalDelta { anger: Some(0.30), solidarity: Some(0.25), fear: None, hope: None, despair: None }),
                institutional: None,
                belief: Some(HashMap::from([("protest_legitimacy".to_string(), 0.35)])),
            },
            target_groups: vec!["Teen".to_string(), "Youth".to_string()],
            geographic_scope: "widespread".to_string(),
        },
        RegionEvent {
            id: "economic_shock".to_string(),
            name: "صدمة اقتصادية".to_string(),
            trigger: EventTrigger::Random,
            probability_per_tick: 0.003,
            impacts: EventImpacts {
                material: None,
                emotional: Some(EmotionalDelta { despair: Some(0.25), anger: Some(0.20), fear: None, hope: None, solidarity: None }),
                institutional: Some(InstitutionDelta { government_trust: Some(-0.12), civil_society_trust: None, traditional_authority_trust: None, security_forces_trust: None }),
                belief: None,
            },
            target_groups: vec!["Adult".to_string()],
            geographic_scope: "region_wide".to_string(),
        },
        RegionEvent {
            id: "community_mediation".to_string(),
            name: "وساطة مجتمعية ناجحة".to_string(),
            trigger: EventTrigger::Random,
            probability_per_tick: 0.002,
            impacts: EventImpacts {
                material: None,
                emotional: Some(EmotionalDelta { anger: Some(-0.20), fear: Some(-0.10), solidarity: Some(0.20), hope: None, despair: None }),
                institutional: Some(InstitutionDelta { traditional_authority_trust: Some(0.08), government_trust: None, civil_society_trust: None, security_forces_trust: None }),
                belief: None,
            },
            target_groups: vec!["Adult".to_string(), "Elder".to_string()],
            geographic_scope: "local".to_string(),
        },
        RegionEvent {
            id: "hope_initiative".to_string(),
            name: "مبادرة أمل اجتماعية".to_string(),
            trigger: EventTrigger::Manual,
            probability_per_tick: 0.0,
            impacts: EventImpacts {
                material: None,
                emotional: Some(EmotionalDelta { hope: Some(0.25), solidarity: Some(0.20), fear: Some(-0.05), anger: None, despair: None }),
                institutional: Some(InstitutionDelta { civil_society_trust: Some(0.10), government_trust: None, traditional_authority_trust: None, security_forces_trust: None }),
                belief: Some(HashMap::from([("collective_agency".to_string(), 0.25)])),
            },
            target_groups: vec!["Youth".to_string(), "Teen".to_string()],
            geographic_scope: "widespread".to_string(),
        },
    ]
}
