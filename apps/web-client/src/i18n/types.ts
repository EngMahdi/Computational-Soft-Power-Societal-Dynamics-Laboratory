/**
 * Core translation types for the Soft Power Lab.
 *
 * Every key here is TypeScript-enforced so that:
 *   - Adding a language forces all keys to be defined.
 *   - IDEs provide autocomplete for translation keys.
 *   - Missing keys are caught at compile time, not runtime.
 */

export type TheoryKey =
  | 'softPower'
  | 'culturalHegemony'
  | 'diffusionOfInnovations'
  | 'socialIdentity'
  | 'spiralOfSilence'
  | 'manufacturingConsent'
  | 'agendaSetting'
  | 'networkContagion'
  | 'memetic'
  | 'echoChamber'
  | 'radicalization'
  | 'prestigeInfluence'
  | 'attentionEconomy'
  | 'algorithmicAmplification';

/** Sub-tactics count per theory */
export const THEORY_TACTIC_COUNT: Record<TheoryKey, number> = {
  softPower: 3,
  culturalHegemony: 3,
  diffusionOfInnovations: 3,
  socialIdentity: 3,
  spiralOfSilence: 2,
  manufacturingConsent: 2,
  agendaSetting: 2,
  networkContagion: 3,
  memetic: 3,
  echoChamber: 2,
  radicalization: 2,
  prestigeInfluence: 3,
  attentionEconomy: 2,
  algorithmicAmplification: 3,
};

/**
 * قيمة intensity الافتراضية لكل نظرية — مُعايَرة تجريبياً.
 * 0.5 = ما قاسته الدراسات في ظروف طبيعية.
 * لا تُعدَّل هذه القيم بشكل اعتباطي؛ كل منها مستند لبحث.
 */
export const THEORY_DEFAULT_INTENSITY: Record<TheoryKey, number> = {
  networkContagion:       0.55, // Christakis & Fowler 2009 — موجود دائماً
  echoChamber:            0.45, // Bail et al. 2018 — إعلام متنوع لكن ضعيف
  radicalization:         0.20, // McCauley & Moskalenko — بطيء جداً، شهور لyears
  spiralOfSilence:        0.60, // Noelle-Neumann — أقوى في المجتمعات الجماعانية
  memetic:                0.50, // Vosoughi 2018 — نشط في شبكات التواصل
  softPower:              0.25, // Nye 2004 — بطيء، years لعقود
  culturalHegemony:       0.70, // Gramsci — خلفية دائمة وتراكمية
  diffusionOfInnovations: 0.35, // Rogers — يعمل فقط إذا كان هناك مبتكرون
  socialIdentity:         0.65, // Tajfel — قوية جداً في السياق الطائفي/القبلي
  manufacturingConsent:   0.50, // Herman & Chomsky — في أي بيئة إعلامية ذات نخب
  agendaSetting:          0.55, // McCombs & Shaw — فعّال في كل إعلام حديث
  prestigeInfluence:      0.60, // Henrich — قوي في المجتمعات الدينية/القبلية
  attentionEconomy:       0.50, // Simon — مرتفع في بيئات التواصل الاجتماعي
  algorithmicAmplification: 0.45, // FB Oversight Board — أقوى للشباب
};

/**
 * نطاق الـ intensity الموصوف بكلمات للباحث.
 * يُعرض في الـ UI بجانب الـ slider.
 */
export type IntensityLabel = 'latent' | 'normal' | 'high' | 'crisis';
export function intensityLabel(v: number): IntensityLabel {
  if (v < 0.25) return 'latent';
  if (v < 0.55) return 'normal';
  if (v < 0.80) return 'high';
  return 'crisis';
}
export function intensityColor(v: number): string {
  if (v < 0.25) return '#475569'; // رمادي
  if (v < 0.55) return '#22c55e'; // أخضر
  if (v < 0.80) return '#f59e0b'; // برتقالي
  return '#ef4444';               // أحمر
}

/**
 * البنية الكاملة لتطبيق نظرية في المحاكاة.
 * تحل محل { key, enabled } البسيطة السابقة.
 */
export interface TheoryApplication {
  key:              TheoryKey;
  enabled:          boolean;
  intensity:        number;        // 0.0–1.0
  subtactics:       boolean[];     // تفعيل التكتيكات الفرعية
}

export type AgentStateKey =
  | 'extremist'
  | 'conservative'
  | 'moderate'
  | 'liberal'
  | 'positiveInfluencer'
  | 'negativeInfluencer'
  | 'resistant'
  | 'gullible'
  | 'activist'
  | 'isolated';

export const AGENT_STATE_ORDER: AgentStateKey[] = [
  'extremist',
  'conservative',
  'moderate',
  'liberal',
  'positiveInfluencer',
  'negativeInfluencer',
  'resistant',
  'gullible',
  'activist',
  'isolated',
];

export type SpeedOptionKey = 'slow' | 'normal' | 'fast' | 'turbo';
export type MetricKey =
  | 'polarization'
  | 'cohesion'
  | 'identityFragmentation'
  | 'memeticVelocity'
  | 'eliteDominance'
  | 'resistanceStrength'
  | 'echoDensity'
  | 'narrativeVolatility'
  | 'algorithmicCapture'
  | 'ideologicalEntropy'
  | 'beliefAdoption';

export type StatusLevelKey = 'high' | 'medium' | 'low';
export type HealthKey = 'healthy' | 'warning' | 'critical';

export interface Translations {
  /** Application chrome */
  app: {
    title: string;
    subtitle: string;
    wasmEngine: string;
    jsFallback: string;
  };

  /** Simulation control panel */
  controls: {
    simulationControl: string;
    start: string;
    pause: string;
    paused: string;
    reset: string;
    tick: string;
    agents: string;
    status: string;
    running: string;
    stopped: string;
  };

  /** Theory toggles + sub-tactics */
  theories: {
    title: string;
    hint: string;
    names: Record<TheoryKey, string>;
    subtactics: Record<TheoryKey, string[]>;
    headerSubtactics: string;
    intensityLevels: Record<'latent' | 'normal' | 'high' | 'crisis', string>;
    whenToUse: string; affects: string; example: string; incompatibleWith: string; conflictWarning: string; notRecommendedWith: string; and: string; conflictConsequence: string; conflictDisclaimer: string; closeWarning: string; empiricalRef: string; conflictTooltip: string; infoTooltip: string; intensityTooltip: string;
  };

  /** Parameter sliders & selects */
  params: {
    title: string;
    agentCount: string;
    simSpeed: string;
    speedPreset: string;
    speedOptions: Record<SpeedOptionKey, string>;
    region: string;
    regionPlaceholder: string;
    agentLimitWarning: string;
  };

  /** Export section */
  reportModal: {
    subTitle: string; mainTitle: string; seed: string; agentsCount: string; periodSelected: string; to: string; health: string; keyMetrics: string; timeline: string; tabGeneral: string; tabStability: string; tabInfluence: string; tabStates: string; aiSummaryTitle: string; regenerate: string; genError: string;
    title: string; closeReport: string; overview: string; culturalStability: string; algorithmicInfluence: string; stateDistribution: string; tickRange: string; regenerateAI: string; generatingAI: string; insufficientData: string; printReport: string; downloadPDF: string; errorGenerating: string;
    shortStates: { moderate: string; extremist: string; conservative: string; liberal: string; positiveInfluencer: string; negativeInfluencer: string; resistant: string; gullible: string; activist: string; isolated: string; };
  };

  timeAgo: {
    justNow: string; days: string; weeks: string; months: string; years: string;
  };

  cycleControl: {
    title: string; maxLimit: string; unlimited: string; cycle: string;
  };

  aiPanel: {
    layerTitle: string;
    settingsTab: string;
    logTab: string;
    inferenceMode: string;
    local: string;
    online: string;
    auto: string;
    localDesc: string;
    onlineDesc: string;
    autoDesc: string;
    providerTitle: string;
    customProvider: string;
    localOption: string;
    oneMonthAgo: string;
    testConnection: string;
    advancedSettings: string;
    statusConnected: string;
    statusFailed: string;
    statusChecking: string;
    ollamaDesc: string;
    groqDesc: string;
    openrouterDesc: string;
    openrouterHint: string;
    geminiDesc: string;
    ollamaUrl: string;
    refreshModels: string;
    model: string;
    name: string;
    available: string;
    fetching: string;
    typeModel: string;
    customModel: string;
    apiInfo: string;
    apiKey: string;
    apiKeyRequired: string;
    optional: string;
    leaveBlankIfNotRequired: string;
    free: string;
    paid: string;
    customApiEndpoint: string;
    notSaved: string;
    customApiUrl: string;
    mustSupportOpenai: string;
    systemPrompts: string;
    localDebugOnly: string;
    mainSystemPrompt: string;
  };

  export: {
    title: string;
    exportJson: string;
    exportCsv: string;
    exportSummary: string;
    researchExport: string;
    timeSeriesCsv: string;
    snapshots: string;
    fullJson: string;
    agentsCsv: string;
    codebookBtn: string;
    aiSummaryBtn: string;
    exportAllAgents: string; allAgentsDesc: string; exportInjected: string; injectedAgentsDesc: string; exportInjectedSummary: string; injectedSummaryDesc: string;
  };

  /** External events */
  events: {
    title: string;
    hint: string;
    triggerPolitical: string;
    triggerEconomic: string;
    triggerCultural: string;
    triggerInformational: string;
    activeLabel: string;
    pendingLabel: string;
    names: Record<string, string>;
    descs: Record<string, string>;
  };

  /** Emotional states */
  emotional: {
    title: string;
    calm: string;
    anxious: string;
    angry: string;
    hopeful: string;
    fearful: string;
    neutral: string;
  };

  /** Agent States Legend */
  legend: {
    title: string;
    agentStates: Record<AgentStateKey, string>;
    aggressionAxis: string;
    influenceAxis: string;
  };

  /** Simulator canvas */
  simulator: {
    title: string;
    runningHint: string;
    stoppedHint: string;
    tick: string;
    agents: string;
    polarization: string;
    cohesion: string;
    aiPausedHint: string;
  };

  /** Metrics display */
  metrics: {
    title: string;
    placeholder: string;
    status: string;
    health: Record<HealthKey, string>;
    categories: {
      socialStructure: string;
      culturalDynamics: string;
      mediaAlgorithms: string;
    };
    names: Record<MetricKey, string>;
    levels: Record<StatusLevelKey, string>;
    summary: string;
    metric: string;
    value: string;
    statusCol: string;
  };

  /** Agent Inspector (فحص الوكلاء) */
  agentHistory: { title: string; aiAnalysis: string; generateBtn: string; generatingBtn: string; timelineTitle: string; noEvents: string; age: string; promptText: string; errorConnection: string; errorGeneric: string; }; inspector: {
    title: string;
    searchPlaceholder: string;
    noResults: string;
    agent: string;
    year: string;
    state: string;
    emotion: string;
    location: string;
    connections: string;
    emotionalState: string;
    psychologicalTraits: string;
    ledgerTitle: string;
    centerDistrict: string;
    viewLedgerBtn: string;
    inject: string;
    close: string;
    execute: string;
    duration: string;
    spread: string;
    narrativePlaceholder: string;
    injectionTypes: {
      info_exposure: string;
      emotional_trigger: string;
      trauma: string;
      resistance_boost: string;
      belief_shift: string;
    };
    emotionLabels: Record<string, string>;
    traitLabels: Record<string, string>;
  };
  archetypeCategories: Record<string, { label: string; description: string; }>;
  archetypes: Record<string, { label: string; description: string; researchNote: string; }>;
  builder: {
    title: string; count: string; region: string; ageGroup: string; label: string;
    customNamePlaceholder: string; addAgentsBtn: string; applyBtn: string;
    noGroups: string; total: string; custom: string; auto: string;
    teen: string; youth: string; adult: string; elder: string;
    editTraitsBtn: string; hideTraitsBtn: string; traitOverrideNote: string;
    removeBtn: string;
  };
  dataExport: {
    summaryTitle: string;
    seed: string;
    tick: string;
    agents: string;
    province: string;
    snapshotsRecorded: string;
    researchMetrics: string;
    giniCoefficient: string;
    shannonEntropy: string;
    healthScore: string;
    metricsLabel: string;
    injectedAgents: string;
    agentLabel: string;
    injectionsLabel: string;
    preState: string;
    postState: string;
    dominantEmotion: string;
    codebookTitle: string;
    versionLabel: string;
    generatedLabel: string;
    simParamsLabel: string;
    theoriesLabel: string;
    varDescLabel: string;
    agentStateDefs: string;
    theoreticalFramework: string;
    frameworkDesc: string;
    citation: string;
    citationText: string;
  };
}

/** All supported locales */
export type Locale = 'ar' | 'en' | 'pt' | 'fa' | 'tr' | 'zh' | 'hi' | 'ru' | 'de';

export const RTL_LOCALES: Locale[] = ['ar', 'fa'];

export const LOCALE_LABELS: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
  pt: 'Português',
  fa: 'فارسی',
  tr: 'Türkçe',
  zh: '中文',
  hi: 'हिन्दी',
  ru: 'Русский',
  de: 'Deutsch',
};
