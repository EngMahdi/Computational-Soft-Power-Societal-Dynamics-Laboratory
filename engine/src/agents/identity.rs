use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdentityMatrix {
    pub local_identity: f32,
    pub national_identity: f32,
    pub religious_identity: f32,
    pub digital_identity: f32,
    pub hybrid_identity: f32,
    pub ideological_identity: f32,
}

impl IdentityMatrix {
    pub fn new() -> Self {
        Self {
            local_identity: rand::random::<f32>(),
            national_identity: rand::random::<f32>(),
            religious_identity: rand::random::<f32>(),
            digital_identity: rand::random::<f32>(),
            hybrid_identity: rand::random::<f32>(),
            ideological_identity: rand::random::<f32>(),
        }
    }
}