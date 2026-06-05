# خطة التطوير الشاملة — النسخة 3.0
## من محاكي نظري إلى مختبر اجتماعي حي مرتبط بالعراق

**الإصدار المستهدف:** 3.0.0  
**تاريخ الوثيقة:** 2026-05-23  
**الحالة:** خطة إصلاح جذري + إضافة ميزات

---

## الجزء الأول — إصلاح المشاكل البنيوية الحرجة

> قبل أي ميزة جديدة، يجب إصلاح القلب الحسابي المكسور.
> النظام الحالي هو spreadsheet يتنكر بزي ABM.

---

### 1.1 استبدال Global Metric Loop بـ Network Message Passing

**المشكلة الحالية:**
```
tick → sum weights → update 11 global metrics → migrate agents by threshold
```

النتيجة: الوكلاء لا يتفاعلون مع بعضهم. الشبكة الاجتماعية ديكور.

**الإصلاح — البنية الجديدة لكل tick:**

```rust
// engine/src/core/world.rs — الحلقة الجديدة

pub fn step(&mut self) {
    // المرحلة 1: توليد الإشارات عبر حواف الشبكة
    let signals = self.network.propagate_signals(&self.agents, &self.active_theories);

    // المرحلة 2: كل وكيل يعالج إشاراته حسب سماته الشخصية
    for agent in self.agents.iter_mut() {
        let incoming = signals.for_agent(agent.id);
        agent.process_signals(incoming, &self.context);
    }

    // المرحلة 3: المقاييس الـ11 تُحسب كتجميع من حالات الوكلاء (لا العكس)
    self.metrics = Metrics::aggregate_from(&self.agents);

    // المرحلة 4: الأحداث الخارجية تُطبق كـ shocks على الوكلاء المتأثرين
    self.event_bus.dispatch(&mut self.agents, &self.geography);

    self.tick += 1;
}
```

**معالجة الإشارة داخل الوكيل (AgentMind المُصحح):**

```rust
impl Agent {
    pub fn process_signals(&mut self, signals: Vec<Signal>, ctx: &WorldContext) {
        for signal in signals {
            // السمات الشخصية تحدد الاستجابة — ليس العتبة العالمية
            let acceptance = self.calculate_acceptance(&signal);

            if acceptance > self.mind.resistance_threshold() {
                self.apply_belief_shift(signal.belief_delta * acceptance);
                self.memory.short_term.push(signal.source_id);
                self.emotional_state.update(signal.emotional_charge);
            }

            // الذاكرة الطويلة الأمد تؤثر على القرارات المستقبلية
            if self.memory.long_term.contains(&signal.source_id) {
                // مصدر موثوق مسبقاً → تخفيض عامل الشك
            }
        }

        // تحديث الحالة بناءً على الإشارات المعالجة
        self.state = self.derive_state_from_mind();
    }

    fn calculate_acceptance(&self, signal: &Signal) -> f32 {
        let base = signal.strength;

        // السمات النفسية تعمل فعلياً الآن
        let skepticism_penalty = self.mind.skepticism * signal.credibility_gap;
        let conformity_bonus = self.mind.conformity * signal.social_pressure;
        let fear_amplifier = if self.emotional_state.fear > 0.7 { 1.4 } else { 1.0 };
        let age_modifier = self.age_profile.influence_susceptibility();

        (base - skepticism_penalty + conformity_bonus) * fear_amplifier * age_modifier
    }
}
```

---

### 1.2 إصلاح مشكلة الحالة العاطفية المنهارة

**المشكلة:** في tick 1138 — جميع 1000 وكيل "fearful". النظام يسقط في attractor وحيد.

**الإصلاح — نموذج عاطفي متعدد الأبعاد:**

```rust
pub struct EmotionalState {
    // الأبعاد الأساسية الست
    pub fear: f32,          // 0.0 – 1.0
    pub anger: f32,
    pub hope: f32,
    pub pride: f32,
    pub despair: f32,
    pub solidarity: f32,

    // معدل الانتشار لكل بُعد (مختلف لكل عاطفة)
    // الخوف ينتشر أسرع من الأمل — هذا واقعي
    pub decay_rates: EmotionalDecay,
}

impl EmotionalState {
    pub fn update(&mut self, dt: f32) {
        // التعب العاطفي — لا يمكن البقاء خائفاً للأبد
        self.fear   *= 1.0 - (self.decay_rates.fear   * dt);
        self.anger  *= 1.0 - (self.decay_rates.anger  * dt);
        self.hope   *= 1.0 - (self.decay_rates.hope   * dt);
        self.despair *= 1.0 - (self.decay_rates.despair * dt);

        // العاطفة المهيمنة
        self.clamp_all();
    }

    /// العاطفة السائدة — المستخدمة في الواجهة
    pub fn dominant(&self) -> EmotionLabel {
        // يُعيد المشاعر المركّبة أيضاً:
        // fear + anger + low_hope → "rage_despair"
        // high_solidarity + high_fear → "collective_vigilance"
    }
}
```

---

### 1.3 جعل النظريات الـ14 وظيفية حقيقياً

**المشكلة:** كل نظرية = رقم مضاف إلى متغير عالمي.

**الإصلاح:** كل نظرية تعرّف كيف تتدفق الإشارات عبر الشبكة:

```rust
// theories/spiral_of_silence.rs
impl Theory for SpiralOfSilence {
    fn generate_signals(&self, world: &World) -> Vec<Signal> {
        // إذا كانت الرأي الأقلية تشعر بأنها محاصرة، تصمت
        // والصمت يُضخّم المنظور السائد لدى الآخرين
        world.agents.iter()
            .filter(|a| a.is_minority_opinion())
            .flat_map(|a| {
                a.neighbors(&world.network)
                    .map(|neighbor| Signal {
                        target: neighbor.id,
                        belief_delta: -a.opinion_strength * 0.01, // الصمت يُضعف رأيك
                        source_theory: TheoryType::SpiralOfSilence,
                        emotional_charge: EmotionCharge::Suppress,
                        ..Default::default()
                    })
                    .collect::<Vec<_>>()
            })
            .collect()
    }
}
```

---

## الجزء الثاني — نظام الأعمار (Age System)

### 2.1 تصنيف الأعمار — ملامح عراقية واقعية

```rust
pub enum AgeGroup {
    Teen,    // 13–19 سنة
    Youth,   // 20–34 سنة
    Adult,   // 35–54 سنة
    Elder,   // 55+ سنة
}

pub struct AgeProfile {
    pub group: AgeGroup,
    pub age: u8,
}

impl AgeProfile {
    /// مدى القابلية للتأثر الإعلامي
    pub fn influence_susceptibility(&self) -> f32 {
        match self.group {
            AgeGroup::Teen  => 1.35,  // الأعلى — مرحلة تشكّل الهوية
            AgeGroup::Youth => 1.10,  // مرتفع — لكن ينخفض مع التجربة
            AgeGroup::Adult => 0.85,  // أكثر تثبيتاً في مواقفه
            AgeGroup::Elder => 0.70,  // صعوبة في تغيير القناعات
        }
    }

    /// قوة التأثير على الآخرين (Outgoing Influence)
    pub fn social_authority(&self) -> f32 {
        match self.group {
            AgeGroup::Teen  => 0.60,  // تأثير محدود على الكبار
            AgeGroup::Youth => 0.95,  // الأكثر تأثيراً في المحيط
            AgeGroup::Adult => 1.10,  // تأثير مؤسسي وعائلي
            AgeGroup::Elder => 1.25,  // أعلى هيبة اجتماعية (prestige)
        }
    }

    /// نوع الشبكة الاجتماعية المُفضّلة
    pub fn preferred_network(&self) -> NetworkType {
        match self.group {
            AgeGroup::Teen  => NetworkType::PeerGroup,      // أصدقاء المدرسة
            AgeGroup::Youth => NetworkType::Mixed,          // أصدقاء + سوشال ميديا
            AgeGroup::Adult => NetworkType::FamilyAndWork,  // العائلة والزملاء
            AgeGroup::Elder => NetworkType::TribeAndMosque, // العشيرة والمرجعية
        }
    }

    /// مصدر المعلومات الأساسي
    pub fn primary_info_source(&self) -> InfoSource {
        match self.group {
            AgeGroup::Teen  => InfoSource::TikTokInstagram,
            AgeGroup::Youth => InfoSource::TelegramTwitter,
            AgeGroup::Adult => InfoSource::TVAndWhatsApp,
            AgeGroup::Elder => InfoSource::MosqueAndOralNetworks,
        }
    }

    /// الخوف من الانهيار — نابع من التجربة التاريخية
    pub fn collapse_fear_baseline(&self) -> f32 {
        match self.group {
            AgeGroup::Teen  => 0.25, // لم يعش الحرب مباشرة
            AgeGroup::Youth => 0.45, // شهد 2006–2008 أو 2014
            AgeGroup::Adult => 0.70, // عاش الحرب والاحتلال
            AgeGroup::Elder => 0.85, // ذاكرة متراكمة من 1980 فصاعداً
        }
    }
}
```

---

### 2.2 توزيع الأعمار في المحافظات العراقية

```typescript
// إحصاءات واقعية تقريبية مستندة إلى الهيكل الديموغرافي العراقي

const IRAQ_PROVINCE_DEMOGRAPHICS: Record<string, AgeDemographic> = {
    "بغداد":    { teen: 0.18, youth: 0.32, adult: 0.30, elder: 0.20, population: 8_500_000 },
    "البصرة":   { teen: 0.20, youth: 0.33, adult: 0.28, elder: 0.19, population: 3_200_000 },
    "الموصل":   { teen: 0.22, youth: 0.31, adult: 0.27, elder: 0.20, population: 1_800_000 },
    "النجف":    { teen: 0.19, youth: 0.29, adult: 0.31, elder: 0.21, population: 1_500_000 },
    "كربلاء":   { teen: 0.18, youth: 0.30, adult: 0.32, elder: 0.20, population: 1_200_000 },
    "ميسان":    { teen: 0.21, youth: 0.30, adult: 0.29, elder: 0.20, population: 1_000_000 },
    "ذي قار":   { teen: 0.23, youth: 0.31, adult: 0.27, elder: 0.19, population: 2_100_000 },
    "الأنبار":  { teen: 0.24, youth: 0.33, adult: 0.26, elder: 0.17, population: 1_700_000 },
    "السليمانية":{ teen: 0.17, youth: 0.30, adult: 0.32, elder: 0.21, population: 2_000_000 },
    "أربيل":    { teen: 0.16, youth: 0.31, adult: 0.32, elder: 0.21, population: 2_200_000 },
};
```

---

## الجزء الثالث — نظام اختيار الوكلاء وحقن المعلومات

### 3.1 Agent Inspector — واجهة الاختيار والبحث

**الاختيار من الشاشة (Canvas Interaction):**

```typescript
// components/AgentInspector.tsx

const AgentInspector: React.FC = () => {
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // النقر على أي وكيل في الـ Canvas
    const handleCanvasClick = (e: MouseEvent) => {
        const agent = findAgentAtPosition(e.offsetX, e.offsetY, agentPositions);
        if (agent) setSelectedAgent(agent);
    };

    // البحث المتقدم
    const searchAgents = (query: string): Agent[] => {
        return agents.filter(a =>
            a.id.toString().includes(query)        ||
            a.state.includes(query)                ||
            a.age_profile.group.includes(query)    ||
            a.location.district.includes(query)    ||
            a.mind.dominant_trait().includes(query)
        );
    };

    return (
        <div className="agent-inspector-panel">
            {/* شريط البحث */}
            <AgentSearchBar
                onSearch={searchAgents}
                placeholder="ابحث: ID، حالة، منطقة، عمر، سمة..."
            />

            {/* نتائج البحث */}
            <AgentSearchResults agents={searchResults} onSelect={setSelectedAgent} />

            {/* بطاقة الوكيل المختار */}
            {selectedAgent && (
                <AgentDetailCard
                    agent={selectedAgent}
                    onInject={(injection) => injectAgent(selectedAgent.id, injection)}
                />
            )}
        </div>
    );
};
```

---

### 3.2 بطاقة الوكيل التفصيلية

```typescript
// AgentDetailCard — تعرض كل شيء عن الوكيل في الوقت الحقيقي

interface AgentDetailCard {
    // المعلومات الأساسية
    id: number;
    age: number;
    ageGroup: AgeGroup;
    location: { province: string; district: string };
    state: AgentState;

    // السمات النفسية (الـ12 — تتغير الآن فعلياً)
    mind: {
        openness: number;         // 0–1 مع مؤشر الاتجاه ↑↓
        skepticism: number;
        conformity: number;
        tribalism: number;
        aggression: number;
        prestige_seeking: number;
        fear_sensitivity: number;
        emotionality: number;
        cognitive_flexibility: number;
        ideological_rigidity: number;
        attention_span: number;
        trust_in_institutions: number;
    };

    // الحالة العاطفية الحالية (6 أبعاد)
    emotional_state: {
        dominant: EmotionLabel;
        fear: number;
        anger: number;
        hope: number;
        pride: number;
        despair: number;
        solidarity: number;
    };

    // الذاكرة
    memory: {
        short_term: AgentId[];    // آخر 10 مصادر تفاعل معها
        long_term_beliefs: Belief[];
        trauma_events: EventId[]; // أحداث صادمة مرت عليها
    };

    // الشبكة الاجتماعية
    network: {
        family: AgentId[];
        friends: AgentId[];
        tribe_cluster: ClusterId;
        religious_affiliation: string;
    };

    // سجل الحقن السابقة
    injection_history: InjectionRecord[];
}
```

---

### 3.3 نظام حقن الوكلاء (Agent Injection System)

```typescript
// نظام حقن المعلومات أو السلوك في وكيل محدد

interface AgentInjection {
    type: InjectionType;
    target_agent_id: number;
    payload: InjectionPayload;
    duration_ticks: number;     // كم tick يستمر التأثير
    spread_to_network: boolean; // هل يتسرب إلى شبكة الوكيل؟
    spread_radius: number;      // عدد القفزات الشبكية للانتشار
}

type InjectionType =
    | 'belief_shift'          // تغيير معتقد محدد
    | 'emotional_trigger'     // إثارة عاطفة معينة
    | 'info_exposure'         // تعريض لمعلومة/سردية
    | 'trauma_event'          // إدخال حدث صادم في الذاكرة
    | 'social_bond'           // ربط الوكيل بوكيل آخر
    | 'behavioral_directive'  // توجيه سلوكي مباشر (للمؤثرين)
    | 'resistance_boost'      // تعزيز المناعة الثقافية
    | 'fear_amplification';   // تضخيم الخوف من حدث

// مثال عملي: حقن سردية في وكيل شاب في بغداد
const injection: AgentInjection = {
    type: 'info_exposure',
    target_agent_id: 442,
    payload: {
        narrative: 'الحكومة فاشلة في الكهرباء منذ 20 سنة',
        credibility_score: 0.85,    // مصدر موثوق
        emotional_charge: {
            anger: +0.3,
            despair: +0.2,
            hope: -0.1,
        },
        belief_impact: {
            trust_in_institutions: -0.15,
            ideological_rigidity: +0.05,
        }
    },
    duration_ticks: 50,
    spread_to_network: true,
    spread_radius: 2,  // ينتشر لجيرانه المباشرين وجيران جيرانه
};
```

**واجهة حقن مرئية في لوحة التحكم:**

```typescript
// InjectionPanel.tsx — نموذج الحقن التفاعلي

const InjectionPanel: React.FC<{ agent: Agent }> = ({ agent }) => (
    <div className="injection-panel">
        <h3>حقن وكيل #{agent.id} — {agent.age_profile.group}</h3>

        {/* اختيار نوع الحقن */}
        <InjectionTypeSelector />

        {/* سردية أو معلومة نصية */}
        <textarea placeholder="أدخل السردية أو المعلومة المراد حقنها..." />

        {/* شدة التأثير */}
        <ImpactSlider label="شدة التأثير" min={0.1} max={1.0} step={0.05} />

        {/* مدة التأثير */}
        <DurationSlider label="عدد الـ ticks" min={10} max={500} />

        {/* خيار الانتشار الشبكي */}
        <Toggle
            label="انشر في شبكة الوكيل"
            subLabel={`سيصل إلى ~${agent.network.friends.length + agent.network.family.length} وكيل`}
        />

        {/* معاينة التأثير المتوقع */}
        <InjectionPreview agent={agent} currentSettings={injectionSettings} />

        <button onClick={executeInjection}>تنفيذ الحقن</button>
    </div>
);
```

---

## الجزء الرابع — ربط المحاكاة بالعراق الحقيقي

### 4.1 ملف السياق العراقي (Iraq Context Profile)

```typescript
// context/iraq_context.ts — الملف الأساسي لتهيئة البيئة العراقية

export const IRAQ_BASELINE_CONTEXT: WorldContext = {

    // البنية المؤسسية
    institutions: {
        government_trust: 0.14,        // ثقة منخفضة جداً — مستند لاستطلاعات
        religious_authority_trust: 0.72, // المرجعية — ثقة عالية
        tribal_authority_trust: 0.65,
        security_forces_trust: 0.38,
        media_trust: 0.22,
    },

    // المؤشرات المادية (المحرك الرابع الغائب)
    material: {
        electricity_hours_daily: 8,     // وسطي وطني حقيقي
        unemployment_rate: 0.16,
        youth_unemployment_rate: 0.36,  // الأعلى تأثيراً
        inflation_rate: 0.06,
        poverty_rate: 0.23,
        monthly_salary_usd: 420,        // وسطي موظف دولة
    },

    // الذاكرة الجماعية (الصدمات التاريخية المتراكمة)
    collective_memory: {
        iran_iraq_war: { year: 1980, trauma_weight: 0.90 },
        gulf_war_1991:  { year: 1991, trauma_weight: 0.75 },
        sanctions_era:  { year: 1990, trauma_weight: 0.80 },
        invasion_2003:  { year: 2003, trauma_weight: 0.95 },
        sectarian_war:  { year: 2006, trauma_weight: 0.88 },
        isis_2014:      { year: 2014, trauma_weight: 0.92 },
        tishreen_2019:  { year: 2019, trauma_weight: 0.70 }, // انتفاضة تشرين
    },

    // الشبكات المؤسسية الحقيقية
    power_networks: {
        militia_influence:       0.55, // تأثير الفصائل المسلحة
        iran_soft_power:         0.60,
        western_soft_power:      0.28,
        gulf_media_influence:    0.35,
        tribal_arbitration:      0.50,
        religious_jurisprudence: 0.72,
    },
};
```

---

### 4.2 ملفات المحافظات القابلة للاختيار

```typescript
// يمكن المستخدم اختيار محافظة عند بدء المحاكاة أو تغييرها لاحقاً

export const PROVINCE_PROFILES: Record<string, ProvinceProfile> = {

    "ميسان": {
        name: "محافظة ميسان",
        population_sample: 1000,
        dominant_identity: "tribal_shia",
        tribal_structure_strength: 0.85,  // قوي جداً
        religious_practice_level: 0.80,
        urban_rural_ratio: 0.45,          // أكثر ريفية
        youth_frustration_index: 0.72,    // مرتفع
        collective_memory_weight: 0.88,
        special_factors: [
            "اقتصاد نفطي مع فقر متناقض",
            "قرب الحدود الإيرانية",
            "ضعف مؤسسات الدولة",
            "قوة التنظيم العشائري",
        ],
    },

    "بغداد": {
        name: "محافظة بغداد",
        population_sample: 1000,
        dominant_identity: "mixed_urban",
        tribal_structure_strength: 0.40,
        religious_practice_level: 0.60,
        urban_rural_ratio: 0.92,
        youth_frustration_index: 0.65,
        collective_memory_weight: 0.90,
        special_factors: [
            "تعددية طائفية عالية",
            "تركيز الإعلام والنخب",
            "حركة احتجاجية تشرين",
            "شباب متعلم وعاطل",
        ],
    },

    "الموصل": {
        name: "محافظة نينوى",
        population_sample: 1000,
        dominant_identity: "sunni_arab",
        tribal_structure_strength: 0.70,
        religious_practice_level: 0.75,
        urban_rural_ratio: 0.65,
        youth_frustration_index: 0.78, // ما بعد داعش
        collective_memory_weight: 0.98, // أعلى صدمة تاريخية
        special_factors: [
            "صدمة الاحتلال الداعشي 2014-2017",
            "صعوبة إعادة الإعمار",
            "أزمة ثقة عميقة بالحكومة",
            "انقسام بين أجيال ما قبل وبعد داعش",
        ],
    },
};
```

---

### 4.3 بنك الأحداث العراقية الحقيقية

```typescript
// بنك أحداث قابلة للتفعيل في أي tick — مستوحاة من الواقع

export const IRAQ_EVENT_BANK: ExternalEvent[] = [

    {
        id: "electricity_crisis",
        name: "أزمة كهرباء صيفية",
        trigger: "manual_or_random",
        probability_per_tick: 0.002,
        impacts: {
            material: { electricity_hours_daily: -3 },
            emotional: { anger: +0.25, despair: +0.15 },
            institutional: { government_trust: -0.08 },
        },
        target_groups: ["Adult", "Elder"],       // الأكثر تضرراً
        geographic_scope: "province_wide",
    },

    {
        id: "marja_statement",
        name: "بيان من المرجعية الدينية",
        trigger: "manual",
        impacts: {
            emotional: { fear: -0.15, solidarity: +0.30 },
            institutional: { religious_authority_trust: +0.10 },
            belief: { collective_resistance: +0.20 },
        },
        target_groups: ["Adult", "Elder", "Youth"],
        geographic_scope: "national",
        age_weight: {
            Teen:  0.40,  // أقل تأثراً بالمرجعية
            Youth: 0.65,
            Adult: 0.90,
            Elder: 1.00,
        },
    },

    {
        id: "militia_checkpoint",
        name: "نقطة تفتيش فصائل مسلحة",
        trigger: "random",
        probability_per_tick: 0.003,
        impacts: {
            emotional: { fear: +0.20, anger: +0.15 },
            institutional: { security_forces_trust: -0.05 },
        },
        target_groups: ["Youth", "Adult"],
        geographic_scope: "district",
    },

    {
        id: "viral_protest_video",
        name: "انتشار فيديو احتجاجي",
        trigger: "random_or_injection",
        probability_per_tick: 0.004,
        impacts: {
            emotional: { anger: +0.30, solidarity: +0.25 },
            belief: { protest_legitimacy: +0.35 },
            network: { information_velocity: +0.50 },
        },
        target_groups: ["Teen", "Youth"],
        primary_channel: "TikTokTelegram",
        geographic_scope: "national_with_local_peak",
    },

    {
        id: "tribal_mediation_success",
        name: "وساطة عشائرية ناجحة",
        trigger: "random",
        probability_per_tick: 0.002,
        impacts: {
            emotional: { anger: -0.20, fear: -0.10, solidarity: +0.15 },
            institutional: { tribal_authority_trust: +0.08 },
        },
        target_groups: ["Adult", "Elder"],
        geographic_scope: "district",
    },

    {
        id: "economic_shock_salary_delay",
        name: "تأخر صرف الرواتب الحكومية",
        trigger: "random",
        probability_per_tick: 0.003,
        impacts: {
            material: { monthly_purchasing_power: -0.20 },
            emotional: { despair: +0.25, anger: +0.20 },
            institutional: { government_trust: -0.12 },
        },
        target_groups: ["Adult"],
        geographic_scope: "province_wide",
    },

    {
        id: "foreign_media_campaign",
        name: "حملة إعلامية خارجية",
        trigger: "manual",
        source: "configurable",  // إيراني / خليجي / غربي
        impacts: {
            // يختلف حسب المصدر والمحافظة
            belief: { foreign_narrative_adoption: +0.15 },
            emotional: { variable: true },
        },
        target_groups: ["Teen", "Youth"],
        primary_channel: "SocialMedia",
    },
];
```

---

## الجزء الخامس — نظام البيانات الحية

### 5.1 Real-Time Agent State Engine

المشكلة الأساسية: البيانات جامدة لأن الوكلاء يُحدَّثون بطريقة batch.

**الحل — نموذج التحديث المتدرج:**

```typescript
// simulation/realtime_engine.ts

class RealTimeEngine {
    private agents: Map<AgentId, Agent>;
    private signalQueue: PriorityQueue<Signal>;
    private activeAnimations: Map<AgentId, AgentAnimation>;

    // كل وكيل له توقيت تحديث مختلف — لا يتحرك الجميع معاً
    scheduleAgentUpdates() {
        this.agents.forEach((agent, id) => {
            const update_interval = this.calculateUpdateInterval(agent);
            setTimeout(() => this.updateAgent(id), update_interval * Math.random());
        });
    }

    // الوكلاء الأكثر تعرضاً للإشارات يتغيرون أسرع
    calculateUpdateInterval(agent: Agent): number {
        const base = 100; // ms
        const signal_load = this.signalQueue.countFor(agent.id);
        const age_modifier = agent.age_profile.reaction_speed();

        return base / (1 + signal_load * 0.1) * age_modifier;
    }

    // تحريك الوكيل مرئياً عند تلقي إشارة قوية
    triggerVisualResponse(agent: Agent, signal: Signal) {
        if (signal.strength > 0.5) {
            this.activeAnimations.set(agent.id, {
                type: 'pulse',
                color: signal.emotional_charge.dominant_color(),
                duration: 800,
            });
        }
    }
}
```

---

### 5.2 مقاييس إضافية لم تكن موجودة

```typescript
// metrics الجديدة — ضرورية للواقعية

interface ExtendedMetrics extends CurrentMetrics {

    // المقاييس الـ11 الحالية + الإضافات التالية:

    // مقاييس المحرك المادي (كانت غائبة تماماً)
    material_stress_index: number;     // مجموع ضغوط الكهرباء/الراتب/البطالة
    economic_despair_rate: number;     // نسبة من وصلوا لليأس الاقتصادي

    // مقاييس مؤسسية
    state_legitimacy_score: number;    // تراجع تدريجي أو صعود
    militia_influence_reach: number;   // مدى تأثير الفصائل في الشبكة
    religious_authority_pull: number;  // قوة جذب المرجعية

    // مقاييس الأجيال
    generational_divide: number;       // الفجوة بين كبار وشباب
    youth_mobilization_potential: number; // احتمال تحرك الشباب

    // مقاييس الذاكرة الجماعية
    collective_trauma_activation: number; // هل الأحداث أيقظت ذاكرة الحرب؟
    historical_pattern_resonance: number; // تشابه الحدث الحالي مع ماضٍ مؤلم

    // مقياس الاستقرار الهش
    stability_preference_index: number;   // الأهم: هل يفضل المجتمع الوضع السيئ على المجهول؟
    collapse_fear_aggregate: number;      // الخوف الجمعي من الانهيار
}
```

---

## الجزء السادس — ميزات لم تكن مقترحة وأضفتها

### 6.1 نظام الذاكرة الجماعية التراكمية

أعمق ميزة غائبة في أي تصور سابق:

```typescript
class CollectiveMemory {
    // الأحداث الصادمة تترك "ندوباً" تُفعَّل عند تشابه الظروف
    private trauma_scars: Map<EventType, ScarProfile>;

    // كل وكيل كبير يحمل ذاكرة أكثر
    loadAgentMemory(agent: Agent): void {
        const years_of_experience = agent.age - 13; // من سن التمييز
        const events_lived_through = IRAQ_EVENTS
            .filter(e => e.year >= (2026 - years_of_experience))
            .map(e => ({
                event: e,
                personal_impact: this.calculatePersonalImpact(agent, e),
                memory_strength: this.calculateMemoryDecay(e.year, agent.age),
            }));

        agent.memory.long_term = events_lived_through;
    }

    // عندما يحدث شيء مشابه لحدث تاريخي — يُفعّل الخوف الكامن
    checkResonance(current_event: ExternalEvent, agent: Agent): number {
        return agent.memory.long_term
            .filter(m => m.event.type === current_event.type)
            .reduce((acc, m) => acc + m.memory_strength * m.personal_impact, 0);
    }
}
```

---

### 6.2 نظام الفقاعات الفكرية الديناميكية

تظهر وتختفي تلقائياً بناءً على شبكة التفاعلات:

```typescript
class EchoChamberDetector {
    // يكشف تلقائياً عن تشكّل فقاعات في الشبكة
    detectChambers(network: SocialNetwork): EchoChamber[] {
        // خوارزمية Louvain للكشف عن المجتمعات
        const communities = network.louvain_communities();

        return communities
            .filter(c => c.internal_agreement > 0.75)
            .filter(c => c.cross_cluster_links < 0.1)
            .map(c => ({
                agents: c.members,
                dominant_narrative: c.majority_belief(),
                isolation_score: c.isolation(),
                formation_tick: this.tick,
            }));
    }

    // تصوير بصري للفقاعات على الـ Canvas
    visualize(chambers: EchoChamber[], ctx: CanvasRenderingContext2D): void {
        chambers.forEach(chamber => {
            const hull = computeConvexHull(chamber.agents.map(a => a.position));
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 100, 50, ${chamber.isolation_score})`;
            ctx.setLineDash([5, 3]);
            ctx.stroke(hull);
        });
    }
}
```

---

### 6.3 نظام "التفضيل الاستقراري" — المبدأ المعماري الغائب

هذا التطوير غائب في كل الوثائق السابقة وفي نقد الذكاء الآخر — لكنه مهم جداً:

```rust
// مبدأ: المجتمع أحياناً يفضل وضعاً سيئاً مستقراً على انهيار مجهول

impl Agent {
    /// هل سيدعم التغيير أم يتمسك بالوضع القائم؟
    pub fn evaluate_change_tolerance(&self, proposed_change: &Change) -> ChangeDecision {
        let collapse_fear = self.emotional_state.fear
            * self.age_profile.collapse_fear_baseline()
            * self.collective_memory_resonance;

        let current_status_satisfaction = self.calculate_status_quo_utility();
        let change_expected_utility = proposed_change.expected_benefit
            - (proposed_change.uncertainty * collapse_fear);

        // حتى لو التغيير أفضل نظرياً — الخوف يُشوّه الحساب
        if change_expected_utility > current_status_satisfaction + collapse_fear {
            ChangeDecision::Support
        } else if collapse_fear > 0.7 {
            ChangeDecision::ActivelyOppose  // يُحارب التغيير خوفاً من الفوضى
        } else {
            ChangeDecision::Passive         // لا يتحرك في أي اتجاه
        }
    }
}
```

---

### 6.4 نظام المعلومات الكاذبة وقياس أثرها

```typescript
interface MisinformationCampaign {
    narrative: string;
    credibility_mask: number;    // مدى قدرتها على التنكر كمعلومة حقيقية
    emotional_charge: number;    // كلما كانت مُثيرة، انتشرت أسرع
    target_age_groups: AgeGroup[];
    platform: InfoSource;

    // يُقيس التأثير الفعلي بعد N tick
    measure_impact_after(ticks: number): MisinformationImpact;
}

// مقاوم للتضليل — يختلف حسب الفئة العمرية
const MISINFORMATION_RESISTANCE: Record<AgeGroup, number> = {
    Teen:  0.25,  // الأقل مقاومة
    Youth: 0.45,
    Adult: 0.55,
    Elder: 0.60,  // الأكثر مقاومة للتغيير لكن الأكثر تأثراً بالخوف
};
```

---

## الجزء السابع — خارطة التطوير التنفيذية

### أولوية التنفيذ (مُرتّبة استراتيجياً)

```
المرحلة صفر — قبل أي إضافة                           (أسبوع 1-2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ استبدال Global Loop بـ Network Message Passing
✦ إصلاح الحالة العاطفية (6 أبعاد + decay)
✦ جعل AgentMind مؤثرة فعلياً في معالجة الإشارات
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

المرحلة الأولى — العمق الواقعي                        (أسبوع 3-5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ نظام الأعمار الأربعة مع ميزاتهم الكاملة
✦ ملف السياق العراقي (institutions + material + memory)
✦ اختيار محافظة عند بدء المحاكاة
✦ نظام الأحداث العراقية (بنك الأحداث)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

المرحلة الثانية — التفاعلية                           (أسبوع 6-8)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ Agent Inspector (اختيار + بحث + بطاقة تفصيلية)
✦ نظام حقن الوكلاء الكامل
✦ لوحة Agent Timeline (سجل تغيرات الوكيل عبر الوقت)
✦ المقاييس الموسعة (المادية + المؤسسية + الجيلية)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

المرحلة الثالثة — العمق العلمي                        (أسبوع 9-12)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ نظام الذاكرة الجماعية التراكمية
✦ نظام التفضيل الاستقراري (مبدأ "الوضع السيئ المستقر")
✦ كشف الفقاعات الفكرية الديناميكي مع تصوير بصري
✦ نظام قياس المعلومات الكاذبة
✦ نظام التحقق والمعايرة (استيراد بيانات حقيقية)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## الجزء الثامن — النتائج المتوقعة والظاهرات الناشئة

إذا طُبّقت هذه التطويرات بشكل صحيح، يجب أن يُنتج النظام تلقائياً الظواهر التالية دون برمجة مباشرة لها:

```
1. موجات غضب شبابية متقطعة
   — الشباب (20-34) يحتقن غضبه وينفجر كل 150-200 tick
   — ثم يعود للتعب والسكون

2. تعزيز دور المرجعية وقت الأزمات
   — العواطف الجماعية ترتفع → الكبار يلجؤون للمرجعية
   — ثقة المؤسسات الدينية ترتفع عكسياً مع تراجع ثقة الدولة

3. صمت الأقلية الرأيية
   — دوامة الصمت (Spiral of Silence) تظهر تلقائياً
   — الآراء غير الشائعة تختفي من الشبكة العامة وتبقى خاصة

4. انشطار جيلي في الأزمات
   — Elders و Adults يُفضّلون الاستقرار
   — Teens و Youth يُفضّلون المواجهة
   — الفجوة تتسع في الأحداث الكبرى

5. فقاعات طائفية-عشائرية ديناميكية
   — تنشأ وتتلاشى تلقائياً حسب قوة الأحداث الخارجية

6. مناعة ثقافية تراكمية
   — بعد حملات تضليل متكررة، يرتفع الشك الجماعي تدريجياً
   — نقطة انعكاس غير متوقعة (حملة فاشلة بعد 10 ناجحات)
```

---

*نهاية وثيقة upgrade 3.0*

---
> النظام يجب أن يُفاجئك.  
> إذا كانت نتائجه متوقعة دائماً — فأنت لم تبنِ محاكاة، بل بنيت رأيك مُجسَّماً في كود.
