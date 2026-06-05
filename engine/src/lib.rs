pub mod agents;
pub mod core;
pub mod media;
pub mod network;
pub mod runtime;
pub mod statistics;
pub mod theories;
pub mod utils;

#[cfg(target_arch = "wasm32")]
pub mod wasm;

use wasm_bindgen::prelude::*;

// Re-export key types for external use
pub use agents::capital::Capital;
pub use agents::identity::IdentityMatrix;
pub use agents::mind::AgentMind;
pub use agents::age::{AgeProfile, AgeGroup};
pub use agents::emotional::{EmotionalState, EmotionLabel};
pub use agents::memory::{AgentMemory, EventId};
pub use core::scheduler::{Scheduler, SchedulerSpeed};
pub use core::signal::{Signal, EmotionalCharge, SignalPropagationResult};
pub use runtime::world::{Agent, BeliefSystem, World, WorldSnapshot, WorldStats, AgentState, ChangeDecision};
pub use runtime::region_context::RegionContext;

#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}