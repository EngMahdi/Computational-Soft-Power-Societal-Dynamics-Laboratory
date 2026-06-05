use serde::{Deserialize, Serialize};

/// الفئات العمرية الأربع / The four age groups
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AgeGroup {
    Teen,    // 13–19 years
    Youth,   // 20–34 years
    Adult,   // 35–54 years
    Elder,   // 55+ years
}

impl AgeGroup {
    pub fn from_age(age: u8) -> Self {
        match age {
            13..=19 => AgeGroup::Teen,
            20..=34 => AgeGroup::Youth,
            35..=54 => AgeGroup::Adult,
            _ => AgeGroup::Elder,
        }
    }

    pub fn all() -> Vec<AgeGroup> {
        vec![AgeGroup::Teen, AgeGroup::Youth, AgeGroup::Adult, AgeGroup::Elder]
    }
}

impl std::fmt::Display for AgeGroup {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AgeGroup::Teen => write!(f, "Teen"),
            AgeGroup::Youth => write!(f, "Youth"),
            AgeGroup::Adult => write!(f, "Adult"),
            AgeGroup::Elder => write!(f, "Elder"),
        }
    }
}

/// الملف العُمري الكامل للوكيل / Full age profile of the agent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgeProfile {
    pub group: AgeGroup,
    pub age: u8,
}

impl AgeProfile {
    pub fn new(age: u8) -> Self {
        Self {
            group: AgeGroup::from_age(age),
            age,
        }
    }

    /// توليد عمر عشوائي ضمن فئة عمرية / Generate random age within age group
    pub fn random_in_group(group: &AgeGroup) -> u8 {
        match group {
            AgeGroup::Teen => 13 + rand::random::<u8>() % 7,
            AgeGroup::Youth => 20 + rand::random::<u8>() % 15,
            AgeGroup::Adult => 35 + rand::random::<u8>() % 20,
            AgeGroup::Elder => 55 + rand::random::<u8>() % 30,
        }
    }

    /// مدى القابلية للتأثر الإعلامي / Media influence susceptibility range
    pub fn influence_susceptibility(&self) -> f32 {
        match self.group {
            AgeGroup::Teen => 1.35,  // الأعلى — مرحلة تشكّل الهوية / Highest — Identity formation stage
            AgeGroup::Youth => 1.10, // مرتفع — لكن ينخفض مع التجربة / High — but decreases with experience
            AgeGroup::Adult => 0.85, // أكثر تثبيتاً في مواقفه / More stable in their positions
            AgeGroup::Elder => 0.70, // صعوبة في تغيير القناعات / Difficulty in changing convictions
        }
    }

    /// قوة التأثير على الآخرين (Outgoing Influence)
    pub fn social_authority(&self) -> f32 {
        match self.group {
            AgeGroup::Teen => 0.60,  // تأثير محدود على الكبار / Limited influence on adults
            AgeGroup::Youth => 0.95, // الأكثر تأثيراً في المحيط / Most influential in surroundings
            AgeGroup::Adult => 1.10, // تأثير مؤسسي وعائلي / Institutional and family influence
            AgeGroup::Elder => 1.25, // أعلى هيبة اجتماعية (prestige)
        }
    }

    /// نوع الشبكة الاجتماعية المُفضّلة / Preferred social network type
    pub fn preferred_network_type(&self) -> &'static str {
        match self.group {
            AgeGroup::Teen => "PeerGroup",
            AgeGroup::Youth => "Mixed",
            AgeGroup::Adult => "FamilyAndWork",
            AgeGroup::Elder => "TribeAndMosque",
        }
    }

    /// مصدر المعلومات الأساسي / Primary information source
    pub fn primary_info_source(&self) -> &'static str {
        match self.group {
            AgeGroup::Teen => "TikTokInstagram",
            AgeGroup::Youth => "TelegramTwitter",
            AgeGroup::Adult => "TVAndWhatsApp",
            AgeGroup::Elder => "MosqueAndOralNetworks",
        }
    }

    /// الخوف من الانهيار / Fear of collapse
    pub fn collapse_fear_baseline(&self) -> f32 {
        match self.group {
            AgeGroup::Teen => 0.25, // لم يعش الحرب مباشرة / Did not experience war directly
            AgeGroup::Youth => 0.45, // شهد صراعات سابقة / Witnessed previous conflicts
            AgeGroup::Adult => 0.70, // عاش الحروب / Lived through wars
            AgeGroup::Elder => 0.85, // ذاكرة متراكمة / Accumulated memory
        }
    }

    /// سرعة رد الفعل / Reaction speed
    pub fn reaction_speed(&self) -> f32 {
        match self.group {
            AgeGroup::Teen => 0.8,  // أسرع / Faster
            AgeGroup::Youth => 0.9,
            AgeGroup::Adult => 1.0,
            AgeGroup::Elder => 1.3, // أبطأ / Slower
        }
    }

    /// المقاومة للتضليل / Resistance to misinformation
    pub fn misinformation_resistance(&self) -> f32 {
        match self.group {
            AgeGroup::Teen => 0.25,  // الأقل مقاومة / Least resistant
            AgeGroup::Youth => 0.45,
            AgeGroup::Adult => 0.55,
            AgeGroup::Elder => 0.60, // الأكثر مقاومة للتغيير / Most resistant to change but affected by fear
        }
    }

    /// عدد سنوات الخبرة المتراكمة (للذاكرة الجماعية)
    pub fn years_of_experience(&self) -> u32 {
        match self.group {
            AgeGroup::Teen => (self.age as u32).saturating_sub(13),
            AgeGroup::Youth => (self.age as u32).saturating_sub(13),
            AgeGroup::Adult => (self.age as u32).saturating_sub(13),
            AgeGroup::Elder => (self.age as u32).saturating_sub(13),
        }
    }
}

/// التوزيع الديموغرافي للمنطقة / Demographic distribution of the region
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgeDemographic {
    pub teen: f32,
    pub youth: f32,
    pub adult: f32,
    pub elder: f32,
    pub population: u32,
}

impl AgeDemographic {
    pub fn new(teen: f32, youth: f32, adult: f32, elder: f32, population: u32) -> Self {
        Self { teen, youth, adult, elder, population }
    }

    /// توليد عمر عشوائي / Generate random age according to demographic distribution
    pub fn random_age(&self) -> u8 {
        let r: f32 = rand::random();
        let cumulative_teen = self.teen;
        let cumulative_youth = cumulative_teen + self.youth;
        let cumulative_adult = cumulative_youth + self.adult;

        if r < cumulative_teen {
            AgeProfile::random_in_group(&AgeGroup::Teen)
        } else if r < cumulative_youth {
            AgeProfile::random_in_group(&AgeGroup::Youth)
        } else if r < cumulative_adult {
            AgeProfile::random_in_group(&AgeGroup::Adult)
        } else {
            AgeProfile::random_in_group(&AgeGroup::Elder)
        }
    }
}