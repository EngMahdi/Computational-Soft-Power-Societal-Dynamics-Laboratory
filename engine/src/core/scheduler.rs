use crate::runtime::world::World;
use crate::theories::r#trait::Theory;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

pub enum SchedulerSpeed {
    Normal,
    Fast,
    Slow,
}

/// Wrap a theory with an atomic enabled flag for runtime toggle
pub struct EnableableTheory {
    pub theory: Arc<dyn Theory>,
    pub enabled: AtomicBool,
}

impl EnableableTheory {
    pub fn new(theory: Arc<dyn Theory>) -> Self {
        Self {
            enabled: AtomicBool::new(true),
            theory,
        }
    }

    pub fn name(&self) -> &str {
        self.theory.name()
    }

    pub fn is_enabled(&self) -> bool {
        self.enabled.load(Ordering::Relaxed)
    }

    pub fn set_enabled(&self, val: bool) {
        self.enabled.store(val, Ordering::Relaxed);
    }

    pub fn apply(&self, world: &mut World) {
        if self.is_enabled() {
            self.theory.apply(world);
        }
    }
}

/// جدولة (Scheduler) تتحكم بتقدم المحاكاة — مُحسَّنة لـ Network Message Passing
pub struct Scheduler {
    pub max_tick: u64,
    pub speed: SchedulerSpeed,
    pub is_paused: bool,
    pub theories: Vec<EnableableTheory>,
    pub snapshot_interval: u64,
}

impl Scheduler {
    pub fn new(max_tick: u64) -> Self {
        Self {
            max_tick,
            speed: SchedulerSpeed::Normal,
            is_paused: false,
            theories: Vec::new(),
            snapshot_interval: 100,
        }
    }

    /// إضافة نظرية للمحاكاة
    pub fn add_theory(&mut self, theory: Arc<dyn Theory>) {
        self.theories.push(EnableableTheory::new(theory));
    }

    /// تعطيل/تفعيل نظرية بالاسم
    pub fn set_theory_enabled(&self, name: &str, enabled: bool) -> bool {
        for t in &self.theories {
            if t.name() == name {
                t.set_enabled(enabled);
                return true;
            }
        }
        false
    }

    /// الحصول على حالة النظريات
    pub fn get_theory_enabled(&self, name: &str) -> Option<bool> {
        self.theories.iter().find(|t| t.name() == name).map(|t| t.is_enabled())
    }

    /// تشغيل المحاكاة — كل خطوة تمر عبر Network Message Passing
    pub fn run(&mut self, world: &mut World) {
        while world.tick < self.max_tick {
            if !self.is_paused {
                self.step(world);

                // حفظ لقطة دورية
                if world.tick % self.snapshot_interval == 0 {
                    world.take_snapshot();
                }
            }
        }
        world.take_snapshot();
    }

    /// تنفيذ خطوة محاكاة واحدة — تقوم world.step() بكل شيء
    pub fn step(&self, world: &mut World) {
        // 1. Network Message Passing — العالم يمرر الإشارات
        world.step();

        // 2. تطبيق النظريات — كل نظرية تولد إشاراتها الخاصة (فقط المفعلة)
        for t in &self.theories {
            t.apply(world);
        }
    }

    /// إيقاف/استئناف المحاكاة
    pub fn toggle_pause(&mut self) {
        self.is_paused = !self.is_paused;
    }

    /// تغيير سرعة المحاكاة
    pub fn set_speed(&mut self, speed: SchedulerSpeed) {
        self.speed = speed;
    }
}