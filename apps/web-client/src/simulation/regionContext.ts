import { randGaussian, randInt, rand } from './seedRNG';
import type { AgeGroup } from '../types/age';
import {
  getArchetypeById,
  archetypeToTraitRecord,
  archetypeToEmotionRecord,
} from './agentArchetypes';

export interface RegionContext {
  institutions: {
    government_trust:          number; // 0–1
    religious_authority_trust: number;
    tribal_authority_trust:    number;
    security_forces_trust:     number;
    media_trust:               number;
  };
  material: {
    electricity_hours_daily:   number;
    unemployment_rate:         number;
    youth_unemployment_rate:   number;
    inflation_rate:            number;
    poverty_rate:              number;
  };
  power_networks: {
    militia_influence:         number;
    foreign_soft_power:        number;
    media_influence:           number;
    tribal_arbitration:        number;
    religious_jurisprudence:   number;
  };
}

export const REGION_BASELINE: RegionContext = {
  institutions: {
    government_trust:          0.30,
    religious_authority_trust: 0.50,
    tribal_authority_trust:    0.50,
    security_forces_trust:     0.60,
    media_trust:               0.40,
  },
  material: {
    electricity_hours_daily:   18,
    unemployment_rate:         0.10,
    youth_unemployment_rate:   0.20,
    inflation_rate:            0.05,
    poverty_rate:              0.15,
  },
  power_networks: {
    militia_influence:         0.20,
    foreign_soft_power:        0.40,
    media_influence:           0.60,
    tribal_arbitration:        0.30,
    religious_jurisprudence:   0.40,
  },
};

export interface AgentProfile {
  province:  string;
  district:  string;
  ageGroup:  AgeGroup;
  age:       number;
  infoSource: string;
  traits:    Record<string, number>;
  emotionalBaseline: {
    fear:       number;
    anger:      number;
    hope:       number;
    pride:      number;
    despair:    number;
    solidarity: number;
  };
}

export function createAgentProfile(
  province: string,
  ageGroup: AgeGroup,
  age: number
): AgentProfile {
  const baseTrust = REGION_BASELINE.institutions.government_trust;
  const youthFrust = REGION_BASELINE.material.youth_unemployment_rate * 2;

  const ageModifiers: Record<AgeGroup, Record<string, number>> = {
    teen: {
      openness: 0.70, skepticism: 0.35, conformity: 0.55, tribalism: 0.50,
      aggression: 0.45, prestige_seeking: 0.60, fear_sensitivity: 0.65,
      emotionality: 0.75, cognitive_flexibility: 0.70, ideological_rigidity: 0.20,
      attention_span: 0.45, trust_in_institutions: 0.50,
    },
    youth: {
      openness: 0.60, skepticism: 0.50, conformity: 0.50, tribalism: 0.55,
      aggression: 0.50, prestige_seeking: 0.65, fear_sensitivity: 0.55,
      emotionality: 0.65, cognitive_flexibility: 0.60, ideological_rigidity: 0.35,
      attention_span: 0.55, trust_in_institutions: 0.35,
    },
    adult: {
      openness: 0.45, skepticism: 0.60, conformity: 0.55, tribalism: 0.65,
      aggression: 0.40, prestige_seeking: 0.55, fear_sensitivity: 0.65,
      emotionality: 0.55, cognitive_flexibility: 0.45, ideological_rigidity: 0.55,
      attention_span: 0.60, trust_in_institutions: 0.30,
    },
    elder: {
      openness: 0.30, skepticism: 0.70, conformity: 0.65, tribalism: 0.80,
      aggression: 0.30, prestige_seeking: 0.45, fear_sensitivity: 0.80,
      emotionality: 0.50, cognitive_flexibility: 0.30, ideological_rigidity: 0.75,
      attention_span: 0.65, trust_in_institutions: 0.25,
    },
  };

  const base = ageModifiers[ageGroup];

  const traits: Record<string, number> = {
    openness:              clamp(randGaussian(base.openness, 0.10)),
    skepticism:            clamp(randGaussian(base.skepticism + (1 - baseTrust) * 0.2, 0.10)),
    conformity:            clamp(randGaussian(base.conformity, 0.10)),
    tribalism:             clamp(randGaussian(base.tribalism, 0.12)),
    aggression:            clamp(randGaussian(base.aggression + youthFrust * 0.15, 0.10)),
    prestige_seeking:      clamp(randGaussian(base.prestige_seeking, 0.10)),
    fear_sensitivity:      clamp(randGaussian(base.fear_sensitivity, 0.10)),
    emotionality:          clamp(randGaussian(base.emotionality, 0.10)),
    cognitive_flexibility: clamp(randGaussian(base.cognitive_flexibility, 0.10)),
    ideological_rigidity:  clamp(randGaussian(base.ideological_rigidity, 0.10)),
    attention_span:        clamp(randGaussian(base.attention_span, 0.10)),
    trust_in_institutions: clamp(randGaussian(baseTrust + 0.05, 0.08)),
  };

  const emotionalBaseline = {
    fear:       clamp(randGaussian(0.3, 0.08)),
    anger:      clamp(randGaussian(0.3, 0.08)),
    hope:       clamp(randGaussian(0.4, 0.08)),
    pride:      clamp(randGaussian(0.4, 0.07)),
    despair:    clamp(randGaussian(0.2, 0.07)),
    solidarity: clamp(randGaussian(0.4, 0.08)),
  };

  const infoSourceMap: Record<AgeGroup, string> = {
    teen:  'tiktok_instagram',
    youth: 'telegram_twitter',
    adult: 'tv_whatsapp',
    elder: 'mosque_oral',
  };

  const districtList = ['Center', 'Suburbs', 'Rural'];
  const district = districtList[randInt(0, districtList.length - 1)];

  return {
    province,
    district,
    ageGroup,
    age,
    infoSource: infoSourceMap[ageGroup],
    traits,
    emotionalBaseline,
  };
}

export interface RegionEvent {
  id:                  string;
  nameAr:              string;
  nameEn:              string;
  type:                'political' | 'economic' | 'cultural' | 'informational';
  probabilityPerTick:  number;
  durationTicks:       number;
  metricEffects: Partial<Record<string, number>>;
  emotionalImpact: {
    fear?:       number;
    anger?:      number;
    hope?:       number;
    solidarity?: number;
    despair?:    number;
    pride?:      number;
  };
  targetAgeGroups: AgeGroup[];
  geographicScope: 'national' | 'province_wide' | 'district';
}

export const REGION_EVENT_BANK: RegionEvent[] = [
  {
    id: 'economic_crisis',
    nameAr: 'أزمة اقتصادية',
    nameEn: 'Economic Crisis',
    type: 'economic',
    probabilityPerTick: 0.003,
    durationTicks: 250,
    metricEffects: { polarization: +0.10, cohesion: -0.08 },
    emotionalImpact: { anger: +0.25, despair: +0.15, hope: -0.10 },
    targetAgeGroups: ['adult', 'elder'],
    geographicScope: 'province_wide',
  },
  {
    id: 'viral_protest_video',
    nameAr: 'انتشار فيديو احتجاجي',
    nameEn: 'Viral Protest Video',
    type: 'informational',
    probabilityPerTick: 0.004,
    durationTicks: 80,
    metricEffects: { narrative_volatility: +0.20, polarization: +0.08 },
    emotionalImpact: { anger: +0.30, solidarity: +0.25, fear: -0.05 },
    targetAgeGroups: ['teen', 'youth'],
    geographicScope: 'national',
  },
];

export function selectRandomEvents(tick: number): RegionEvent[] {
  return REGION_EVENT_BANK.filter(event => rand() < event.probabilityPerTick);
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, isNaN(v) ? 0.5 : v));
}

export type AgentPreset =
  | 'angry_youth'
  | 'conservative_elder'
  | 'educated_liberal'
  | 'tribal_leader'
  | 'isolated_poor'
  | 'religious_activist'
  | 'moderate_professional'
  | 'custom';

export interface AgentPresetDoc {
  key: AgentPreset;
  nameAr: string;
  descAr: string;
  baseTraits: Record<string, number>;
  baseEmotions: Record<string, number>;
  typicalAgeGroup: AgeGroup;
}

export const AGENT_PRESETS: Record<AgentPreset, AgentPresetDoc> = {
  angry_youth: {
    key: 'angry_youth', nameAr: 'شاب غاضب / عاطل', descAr: 'شاب بين 18-30 يعاني البطالة.',
    baseTraits: {
      openness: 0.65, skepticism: 0.70, conformity: 0.30, tribalism: 0.45,
      aggression: 0.72, prestige_seeking: 0.55, fear_sensitivity: 0.50,
      emotionality: 0.80, cognitive_flexibility: 0.55, ideological_rigidity: 0.30,
      attention_span: 0.40, trust_in_institutions: 0.10,
    },
    baseEmotions: { fear: 0.30, anger: 0.65, hope: 0.25, pride: 0.35, despair: 0.45, solidarity: 0.40 },
    typicalAgeGroup: 'youth',
  },
  conservative_elder: {
    key: 'conservative_elder', nameAr: 'كبير محافظ', descAr: 'رجل يحمل سلطة اجتماعية ويقدّم التقليد.',
    baseTraits: {
      openness: 0.20, skepticism: 0.65, conformity: 0.75, tribalism: 0.85,
      aggression: 0.25, prestige_seeking: 0.60, fear_sensitivity: 0.80,
      emotionality: 0.45, cognitive_flexibility: 0.20, ideological_rigidity: 0.85,
      attention_span: 0.70, trust_in_institutions: 0.30,
    },
    baseEmotions: { fear: 0.50, anger: 0.35, hope: 0.30, pride: 0.60, despair: 0.25, solidarity: 0.55 },
    typicalAgeGroup: 'elder',
  },
  educated_liberal: {
    key: 'educated_liberal', nameAr: 'مثقف ليبرالي', descAr: 'خريج جامعي يتبنى قيم الحرية والتفكير النقدي.',
    baseTraits: {
      openness: 0.85, skepticism: 0.75, conformity: 0.25, tribalism: 0.25,
      aggression: 0.25, prestige_seeking: 0.50, fear_sensitivity: 0.35,
      emotionality: 0.50, cognitive_flexibility: 0.85, ideological_rigidity: 0.15,
      attention_span: 0.75, trust_in_institutions: 0.20,
    },
    baseEmotions: { fear: 0.25, anger: 0.45, hope: 0.55, pride: 0.40, despair: 0.30, solidarity: 0.45 },
    typicalAgeGroup: 'adult',
  },
  tribal_leader: {
    key: 'tribal_leader', nameAr: 'زعيم مجتمعي / وجيه', descAr: 'يمتلك شبكة نفوذ واسعة.',
    baseTraits: {
      openness: 0.30, skepticism: 0.60, conformity: 0.45, tribalism: 0.92,
      aggression: 0.45, prestige_seeking: 0.90, fear_sensitivity: 0.55,
      emotionality: 0.40, cognitive_flexibility: 0.35, ideological_rigidity: 0.70,
      attention_span: 0.65, trust_in_institutions: 0.20,
    },
    baseEmotions: { fear: 0.35, anger: 0.40, hope: 0.40, pride: 0.75, despair: 0.20, solidarity: 0.70 },
    typicalAgeGroup: 'elder',
  },
  isolated_poor: {
    key: 'isolated_poor', nameAr: 'فقير معزول', descAr: 'يعيش تحت خط الفقر وانقطع عن الحياة العامة.',
    baseTraits: {
      openness: 0.30, skepticism: 0.45, conformity: 0.60, tribalism: 0.55,
      aggression: 0.40, prestige_seeking: 0.20, fear_sensitivity: 0.75,
      emotionality: 0.65, cognitive_flexibility: 0.30, ideological_rigidity: 0.50,
      attention_span: 0.25, trust_in_institutions: 0.08,
    },
    baseEmotions: { fear: 0.60, anger: 0.50, hope: 0.10, pride: 0.20, despair: 0.70, solidarity: 0.30 },
    typicalAgeGroup: 'adult',
  },
  religious_activist: {
    key: 'religious_activist', nameAr: 'ناشط محافظ', descAr: 'نشط في التعبئة والتأثير على المجتمع بخطاب تقليدي.',
    baseTraits: {
      openness: 0.20, skepticism: 0.50, conformity: 0.70, tribalism: 0.65,
      aggression: 0.50, prestige_seeking: 0.55, fear_sensitivity: 0.65,
      emotionality: 0.75, cognitive_flexibility: 0.20, ideological_rigidity: 0.88,
      attention_span: 0.60, trust_in_institutions: 0.15,
    },
    baseEmotions: { fear: 0.40, anger: 0.55, hope: 0.45, pride: 0.70, despair: 0.25, solidarity: 0.75 },
    typicalAgeGroup: 'adult',
  },
  moderate_professional: {
    key: 'moderate_professional', nameAr: 'موظف معتدل / مهني', descAr: 'يتجنب الصراعات ويبحث عن الاستقرار.',
    baseTraits: {
      openness: 0.50, skepticism: 0.55, conformity: 0.55, tribalism: 0.50,
      aggression: 0.25, prestige_seeking: 0.45, fear_sensitivity: 0.50,
      emotionality: 0.45, cognitive_flexibility: 0.50, ideological_rigidity: 0.40,
      attention_span: 0.60, trust_in_institutions: 0.28,
    },
    baseEmotions: { fear: 0.35, anger: 0.30, hope: 0.40, pride: 0.40, despair: 0.30, solidarity: 0.45 },
    typicalAgeGroup: 'adult',
  },
  custom: {
    key: 'custom', nameAr: 'مخصص يدوياً', descAr: 'تحديد القيم يدوياً.',
    baseTraits: {
      openness: 0.50, skepticism: 0.50, conformity: 0.50, tribalism: 0.50,
      aggression: 0.30, prestige_seeking: 0.50, fear_sensitivity: 0.50,
      emotionality: 0.50, cognitive_flexibility: 0.50, ideological_rigidity: 0.40,
      attention_span: 0.55, trust_in_institutions: 0.30,
    },
    baseEmotions: { fear: 0.30, anger: 0.30, hope: 0.35, pride: 0.35, despair: 0.25, solidarity: 0.40 },
    typicalAgeGroup: 'adult',
  },
};

export function createAgentFromPreset(
  preset: AgentPreset,
  province: string,
  customTraits?: Partial<Record<string, number>>,
  customEmotions?: Partial<Record<string, number>>,
  ageGroup?: AgeGroup,
  age?: number,
): AgentProfile {
  const doc = AGENT_PRESETS[preset];
  const resolvedAgeGroup = ageGroup ?? doc.typicalAgeGroup;
  const resolvedAge = age ?? {
    teen: randInt(14, 17),
    youth: randInt(18, 30),
    adult: randInt(31, 54),
    elder: randInt(55, 75),
  }[resolvedAgeGroup];

  const noiseStd = (base: number) => base > 0.75 || base < 0.25 ? 0.08 : 0.12;

  const base = preset === 'custom' && customTraits
    ? { ...doc.baseTraits, ...customTraits }
    : doc.baseTraits;

  const traits: Record<string, number> = {};
  for (const [k, v] of Object.entries(base)) {
    traits[k] = clamp(randGaussian(v, noiseStd(v)));
  }

  const baseEmotions = preset === 'custom' && customEmotions
    ? { ...doc.baseEmotions, ...customEmotions }
    : doc.baseEmotions;

  const emotionalBaseline = {
    fear:       clamp(randGaussian(baseEmotions.fear,       0.07)),
    anger:      clamp(randGaussian(baseEmotions.anger,      0.07)),
    hope:       clamp(randGaussian(baseEmotions.hope,       0.07)),
    pride:      clamp(randGaussian(baseEmotions.pride,      0.07)),
    despair:    clamp(randGaussian(baseEmotions.despair,    0.07)),
    solidarity: clamp(randGaussian(baseEmotions.solidarity, 0.07)),
  };

  const districtList = ['Center', 'Suburbs', 'Rural'];
  const district = districtList[randInt(0, districtList.length - 1)];

  const infoSourceMap: Record<AgeGroup, string> = {
    teen: 'tiktok_instagram', youth: 'telegram_twitter',
    adult: 'tv_whatsapp', elder: 'mosque_oral',
  };

  return {
    province,
    district,
    ageGroup: resolvedAgeGroup,
    age: resolvedAge,
    infoSource: infoSourceMap[resolvedAgeGroup],
    traits,
    emotionalBaseline,
  };
}

export interface AgentGroup {
  id: string;
  preset: AgentPreset;
  count: number;
  province: string;
  ageGroup?: AgeGroup;
  label: string;
  customTraits?: Partial<Record<string, number>>;
  customEmotions?: Partial<Record<string, number>>;
  /** معرف النمط من نظام agentArchetypes الجديد (اختياري — يتغلب على preset إذا وُجد) */
  archetypeId?: string;
}

/**
 * إنشاء وكيل من archetype جديد
 * يتغلب على createAgentFromPreset عند توفر archetypeId
 */
export function createAgentFromArchetype(
  archetypeId: string,
  province: string,
  customTraits?: Partial<Record<string, number>>,
  customEmotions?: Partial<Record<string, number>>,
  ageGroup?: AgeGroup,
  age?: number,
): AgentProfile {
  const archetype = getArchetypeById(archetypeId);
  // fallback to moderate_professional if not found
  if (!archetype) {
    return createAgentFromPreset('moderate_professional', province, customTraits, customEmotions, ageGroup, age);
  }

  const resolvedAgeGroup = ageGroup ?? archetype.typicalAgeGroup;
  const resolvedAge = age ?? (
    resolvedAgeGroup === 'teen' ? 15 + Math.floor(rand() * 4) :
    resolvedAgeGroup === 'youth' ? 18 + Math.floor(rand() * 13) :
    resolvedAgeGroup === 'adult' ? 31 + Math.floor(rand() * 24) :
    55 + Math.floor(rand() * 20)
  );

  const baseTraits = archetypeToTraitRecord(archetype);
  const baseEmotions = archetypeToEmotionRecord(archetype);

  // تشتت طبيعي (±12%)
  const traits: Record<string, number> = {};
  for (const [k, v] of Object.entries(baseTraits)) {
    const override = customTraits?.[k];
    const scattered = clamp((override ?? v) + (rand() - 0.5) * 0.24);
    traits[k] = scattered;
  }

  const emotionalBaseline: Record<string, number> = {};
  for (const [k, v] of Object.entries(baseEmotions)) {
    const override = customEmotions?.[k];
    emotionalBaseline[k] = clamp((override ?? v) + (rand() - 0.5) * 0.18);
  }

  const infoSourceMap: Record<AgeGroup, string> = {
    teen: 'tiktok_instagram', youth: 'telegram_twitter',
    adult: 'tv_whatsapp', elder: 'mosque_oral',
  };

  return {
    province,
    district: province,
    ageGroup: resolvedAgeGroup,
    age: resolvedAge,
    infoSource: infoSourceMap[resolvedAgeGroup],
    traits,
    emotionalBaseline: emotionalBaseline as any,
  };
}
