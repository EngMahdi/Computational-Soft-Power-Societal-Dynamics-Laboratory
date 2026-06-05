pub mod age;
pub mod emotional;
pub mod memory;
pub mod capital;
pub mod identity;
pub mod mind;

pub use age::{AgeProfile, AgeGroup, AgeDemographic};
pub use emotional::{EmotionalState, EmotionLabel, EmotionalDecay};
pub use memory::{AgentMemory, Belief, TraumaEvent, EventId};
pub use capital::Capital;
pub use identity::IdentityMatrix;
pub use mind::AgentMind;