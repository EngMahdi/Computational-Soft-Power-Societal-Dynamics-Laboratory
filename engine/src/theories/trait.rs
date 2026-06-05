use crate::runtime::world::World;

pub trait Theory: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn apply(&self, world: &mut World);
    fn enabled(&self) -> bool {
        true
    }
}
