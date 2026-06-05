use std::collections::HashMap;

pub struct EventBus {
    subscribers: HashMap<String, Vec<Box<dyn Fn(&str) + Send + Sync>>>,
}

impl EventBus {
    pub fn new() -> Self {
        Self { subscribers: HashMap::new() }
    }

    pub fn subscribe<F>(&mut self, topic: &str, cb: F)
    where
        F: Fn(&str) + Send + Sync + 'static,
    {
        self.subscribers.entry(topic.to_string()).or_default().push(Box::new(cb));
    }

    pub fn publish(&self, topic: &str, payload: &str) {
        if let Some(callbacks) = self.subscribers.get(topic) {
            for cb in callbacks {
                cb(payload);
            }
        }
    }
}
