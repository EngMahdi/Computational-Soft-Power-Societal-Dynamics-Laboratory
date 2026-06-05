use crate::network::relationship::{Relationship, RelationType};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DynamicNetwork {
    pub relationships: Vec<Relationship>,
    pub clusters: Vec<Vec<usize>>, // مجموعات من الوكلاء
    pub polarization_map: HashMap<usize, (f32, f32)>, // خريطة الاستقطاب (x, y)
}

impl DynamicNetwork {
    pub fn new() -> Self {
        Self {
            relationships: Vec::new(),
            clusters: Vec::new(),
            polarization_map: HashMap::new(),
        }
    }

    /// إضافة علاقة بين وكيلين
    pub fn add_relationship(&mut self, from: usize, to: usize, rel_type: RelationType, tick: u64) {
        // تجنب العلاقات المكررة
        if !self.relationships.iter().any(|r| r.from_agent == from && r.to_agent == to) {
            self.relationships.push(Relationship::new(from, to, rel_type, tick));
        }
    }

    /// إزالة علاقة ضعيفة جداً
    pub fn prune_weak_relationships(&mut self) {
        self.relationships.retain(|r| r.strength > 0.05);
    }

    /// تحديث الشبكة
    pub fn update(&mut self) {
        // تطبيق الاضمحلال على كل العلاقات
        for rel in &mut self.relationships {
            rel.apply_decay();
        }

        // حذف العلاقات الميتة
        self.prune_weak_relationships();

        // إعادة حساب المجموعات
        self.recalculate_clusters();
    }

    /// إعادة حساب المجموعات الأيديولوجية
    fn recalculate_clusters(&mut self) {
        // هذا تبسيط - في الواقع، ستحتاج إلى خوارزمية تجميع حقيقية
        // مثل Louvain أو Girvan-Newman
        self.clusters.clear();
        
        // مثال مبسط: تجميع بناءً على قوة العلاقات
        let mut visited = std::collections::HashSet::new();
        
        for rel in &self.relationships {
            if rel.strength > 0.7 && !visited.contains(&rel.from_agent) {
                let mut cluster = vec![rel.from_agent];
                let mut to_visit = vec![rel.from_agent];
                
                while let Some(agent) = to_visit.pop() {
                    for rel in self.relationships.iter().filter(|r| r.strength > 0.7) {
                        if rel.from_agent == agent && !visited.contains(&rel.to_agent) {
                            cluster.push(rel.to_agent);
                            to_visit.push(rel.to_agent);
                            visited.insert(rel.to_agent);
                        }
                    }
                }
                
                if !cluster.is_empty() {
                    self.clusters.push(cluster);
                }
            }
        }
    }

    /// حساب كثافة الشبكة
    pub fn network_density(&self, agent_count: usize) -> f32 {
        if agent_count <= 1 {
            return 0.0;
        }
        let max_connections = agent_count * (agent_count - 1);
        let active_connections = self.relationships.iter().filter(|r| r.is_active()).count();
        active_connections as f32 / max_connections as f32
    }

    /// حساب التجزئة
    pub fn fragmentation(&self) -> f32 {
        if self.clusters.is_empty() {
            return 1.0;
        }
        // تجزئة = عدد الكتل / إجمالي الوكلاء
        let total_agents: usize = self.clusters.iter().map(|c| c.len()).sum();
        if total_agents == 0 {
            return 1.0;
        }
        self.clusters.len() as f32 / total_agents.max(1) as f32
    }

    /// الحصول على جيران الوكيل
    pub fn neighbors(&self, agent_id: usize) -> Vec<usize> {
        self.relationships
            .iter()
            .filter(|r| (r.from_agent == agent_id || r.to_agent == agent_id) && r.is_active())
            .map(|r| {
                if r.from_agent == agent_id {
                    r.to_agent
                } else {
                    r.from_agent
                }
            })
            .collect()
    }

    /// حساب القرب المركزي لوكيل
    pub fn closeness_centrality(&self, agent_id: usize, all_agents: usize) -> f32 {
        if all_agents <= 1 {
            return 0.0;
        }
        
        let mut distances = vec![f32::INFINITY; all_agents];
        distances[agent_id] = 0.0;

        // BFS
        let mut queue = vec![agent_id];
        while let Some(current) = queue.pop() {
            for neighbor in self.neighbors(current) {
                if distances[neighbor] == f32::INFINITY {
                    distances[neighbor] = distances[current] + 1.0;
                    queue.push(neighbor);
                }
            }
        }

        let sum_distances: f32 = distances.iter().filter(|d| **d != f32::INFINITY).sum();
        if sum_distances == 0.0 {
            return 0.0;
        }
        (all_agents as f32 - 1.0) / sum_distances
    }
}
