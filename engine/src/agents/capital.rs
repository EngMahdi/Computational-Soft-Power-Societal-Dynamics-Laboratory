use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capital {
    pub economic: f32,
    pub social: f32,
    pub symbolic: f32,
    pub educational: f32,
}

impl Capital {
    pub fn new() -> Self {
        Self {
            economic: rand::random::<f32>(),
            social: rand::random::<f32>(),
            symbolic: rand::random::<f32>(),
            educational: rand::random::<f32>(),
        }
    }
}