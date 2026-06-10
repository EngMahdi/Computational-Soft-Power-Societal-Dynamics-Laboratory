import { useState, useEffect, useCallback, useRef } from 'react';
import Simulator from './components/Simulator';
import ControlPanel from './components/ControlPanel';
import MetricsDisplay from './components/MetricsDisplay';
import AgentInspector from './components/AgentInspector';
import AgentGroupBuilder from './components/AgentGroupBuilder';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from './i18n';
import type { TheoryKey, AgentStateKey } from './i18n/types';
import { THEORY_TACTIC_COUNT, AGENT_STATE_ORDER, THEORY_DEFAULT_INTENSITY } from './i18n/types';
import { applyTheoriesToMetrics } from './simulation/theoryEffects';
import { EmotionalState, defaultEmotionalState, dominantEmotion, InjectionRecord } from './types/agent';
import { InspectableAgent, AgentInjection } from './components/AgentInspector';
import { computeMetricsFromStates, safeClamp } from './utils/metrics';
import { AgeProfile, randomAgeProfile, tickToTimeLabel } from './types/age';
import { createEvent, processEvents, SimEvent } from './simulation/eventSystem';
import { evolveAgent, TICK_YEARS, DynamicAgent as EvoAgent, AgentTrait } from './simulation/agentEvolution';
import { deriveAgentState } from './simulation/agentStateMachine';
import type { GlobalContext } from './simulation/agentStateMachine';
import { generateSignals, applySignals, buildSocialNetwork } from './simulation/socialNetwork';
import type { SocialAgent, NetworkEdge } from './simulation/socialNetwork';
import { initGlobalRNG, rand } from './simulation/seedRNG';
import { createAgentProfile, createAgentFromPreset, createAgentFromArchetype, type AgentGroup } from './simulation/regionContext';
import { Ledger } from './simulation/research/LedgerSystem';
import {
  TimeSeriesRecorder,
  downloadCSV, downloadJSON, downloadAgentsCSV, downloadCodebook,
  computeGini, computeShannonEntropy, PanelDataRecorder, downloadPanelCSV
} from './utils/dataExport';
import AIPanel    from './components/AIPanel';
import ReportModal from './components/ReportModal';

import {
  detectAnomalies, applyLocalAIReasoning, updateAgentMemory, createAgentAIProfile,
  defaultEnrichedMemory,
} from './simulation/agentAI';
import type { Anomaly, AgentAIProfile } from './simulation/agentAI';
import {
  defaultAIConfig, processAnomaliesWithRouter, callAIWithManager,
  getAIManagerSummary, resetAIManagerSession, updateAIManagerConfig, setAIParallelEnabled,
} from './simulation/aiRouter';
import type { AIConfig, AIAlert, AICallRecord } from './simulation/aiRouter';
import './App.css';

interface Metrics {
  polarization: number; cohesion: number; identity_fragmentation: number;
  memetic_velocity: number; elite_dominance: number; resistance_strength: number;
  echo_density: number; narrative_volatility: number; algorithmic_capture: number;
  ideological_entropy: number; belief_adoption: number;
}
interface TheoryInfo { key: TheoryKey; enabled: boolean; intensity: number; }
interface AgentStateStats { state: AgentStateKey; count: number; percentage: number; }
type SimStatus = 'stopped' | 'running' | 'paused';

interface AgentMemory {
  recentEvents: string[];
  longTermBeliefs: string[];
  exposureCount: Record<string, number>;
}

interface DynamicAgent extends EvoAgent {
  state: AgentStateKey;
  injectionHistory: InjectionRecord[];
  activeInjection?: {
    type: string; remainingTicks: number; narrative?: string;
    spreadToNetwork?: boolean; spreadRadius?: number; durationTicks?: number;
  };
  connections: NetworkEdge[];     // ← الشبكة الاجتماعية الحقيقية
  province?: string;
  district?: string;
  infoSource?: string;
  // ── حقول AI ──
  aiProfile?: AgentAIProfile;
}

interface EmotionalCounts {
  calm: number; anxious: number; angry: number;
  hopeful: number; fearful: number; neutral: number;
  fearCount: number; angerCount: number; hopeCount: number;
  prideCount: number; despairCount: number; solidarityCount: number;
}

interface SimulationState {
  status: SimStatus; isRunning: boolean; tick: number; agentCount: number;
  metrics: Metrics; theories: TheoryInfo[];
  subtactics: Record<TheoryKey, boolean[]>;
  agentStateStats: AgentStateStats[];
  agentStateCounts: Record<AgentStateKey, number>;
  useWasm: boolean; events: SimEvent[];
  eventHistory: { type: string; startTick: number; name?: string; duration: number }[];
  agentTraits: DynamicAgent[];
  emotionalCounts: EmotionalCounts;
  seed: number;
  province: string;
  snapshotCount: number;
  networkStats: { avgDegree: number; density: number };
}

/* ────────────── CONSTANTS ────────────── */
const THEORY_KEY_ORDER: TheoryKey[] = [
  'softPower','culturalHegemony','diffusionOfInnovations','socialIdentity',
  'spiralOfSilence','manufacturingConsent','agendaSetting','networkContagion',
  'memetic','echoChamber','radicalization','prestigeInfluence',
  'attentionEconomy','algorithmicAmplification'
];

const SNAPSHOT_INTERVAL = 50; // تسجيل every 50 ticks

/* ────────────── HELPERS ────────────── */
function defSubtactics(): Record<TheoryKey, boolean[]> {
  const s: Record<string, boolean[]> = {};
  for (const k of THEORY_KEY_ORDER) s[k] = Array(THEORY_TACTIC_COUNT[k]).fill(true);
  return s as Record<TheoryKey, boolean[]>;
}

function defCounts(): Record<AgentStateKey, number> {
  const c: Record<string, number> = {};
  for (const k of AGENT_STATE_ORDER) c[k] = 0;
  c.moderate = 100;
  return c as Record<AgentStateKey, number>;
}

function computeStats(cnt: Record<AgentStateKey, number>, t: number): AgentStateStats[] {
  return AGENT_STATE_ORDER.map(s => ({ state: s, count: cnt[s], percentage: t > 0 ? (cnt[s] / t) * 100 : 0 }));
}

function defTraits(): AgentTrait {
  return {
    openness: .5, skepticism: .5, conformity: .5, tribalism: .5, aggression: .3,
    prestige_seeking: .5, fear_sensitivity: .5, emotionality: .5,
    cognitive_flexibility: .5, ideological_rigidity: .4, attention_span: .5, trust_in_institutions: .6
  };
}

function defMemory(): AgentMemory {
  return { recentEvents: [], longTermBeliefs: [], exposureCount: {} };
}

/** إنشاء وكلاء مع سياق عراقي وشبكة اجتماعية */
function makeAgents(n: number, province: string, connections: NetworkEdge[][]): DynamicAgent[] {
  const agentList: DynamicAgent[] = [];
  
  const initGlobalCtx: GlobalContext = {
    polarization: 0.2, cohesion: 0.6, echo_density: 0.2,
    narrative_volatility: 0.2, memetic_velocity: 0.3,
    resistance_strength: 0.3, algorithmic_capture: 0.1,
    elite_dominance: 0.2
  };

  for (let i = 0; i < n; i++) {
    const ageProfile = randomAgeProfile();
    const agentProfile = createAgentProfile(province, ageProfile.group, ageProfile.age);
    
    const initialState = deriveAgentState(
      agentProfile.traits,
      agentProfile.emotionalBaseline as EmotionalState,
      initGlobalCtx,
      'moderate',
      ageProfile.group
    );

    agentList.push({
      traits: agentProfile.traits as AgentTrait,
      memory: defMemory(),
      emotionalState: agentProfile.emotionalBaseline as EmotionalState,
      state: initialState as AgentStateKey,
      ageProfile,
      injectionHistory: [],
      connections: connections[i] || [],
      province: province,
    });
  }
  return agentList;
}

function countEmotions(agents: DynamicAgent[]): EmotionalCounts {
  const ec: EmotionalCounts = {
    calm: 0, anxious: 0, angry: 0, hopeful: 0, fearful: 0, neutral: 0,
    fearCount: 0, angerCount: 0, hopeCount: 0, prideCount: 0, despairCount: 0, solidarityCount: 0,
  };
  for (const a of agents) {
    if (!a) continue;
    const dom = dominantEmotion(a.emotionalState);
    // עדכון counts לפי dominant
    if (dom === 'fear')        { ec.fearful++; }
    else if (dom === 'anger')  { ec.angry++; }
    else if (dom === 'hope')   { ec.hopeful++; }
    else if (dom === 'despair'){ ec.fearful++; }
    else if (dom === 'solidarity') { ec.calm++; }
    else if (dom === 'pride')  { ec.hopeful++; }
    else                       { ec.neutral++; }
    // تفاصيل كل عاطفة
    if (a.emotionalState) {
      ec.fearCount      += a.emotionalState.fear       || 0;
      ec.angerCount     += a.emotionalState.anger      || 0;
      ec.hopeCount      += a.emotionalState.hope       || 0;
      ec.prideCount     += a.emotionalState.pride      || 0;
      ec.despairCount   += a.emotionalState.despair    || 0;
      ec.solidarityCount+= a.emotionalState.solidarity || 0;
    }
  }
  return ec;
}

async function loadWasm(): Promise<any> {
  try {
    // نُحمّل الـ JS wrapper كـ script ثم نُهيئ الـ WASM بالـ fetch
    const script = document.createElement('script');
    script.type = 'module';
    await new Promise<void>((resolve, reject) => {
      script.src = '/wasm/soft_power_engine.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // بعد تحميل الـ script، الدوال تكون في window بشكل غير مباشر
    // نستخدم dynamic fetch لتحميل الـ WASM binary مباشرة
    const wasmRes = await fetch('/wasm/soft_power_engine_bg.wasm');
    if (!wasmRes.ok) throw new Error('WASM fetch failed');

    // نحاول استخدام الـ module من window أو نُعيد null
    const w = (window as any).__soft_power_engine__;
    if (w) return w;

    // Fallback: نُعيد كائن يدل على WASM تم تحميله
    return { __wasmLoaded: true };
  } catch (e) {
    console.warn('[WASM] Failed to load WASM engine, falling back to JS simulation:', e);
    return null;
  }
}

/* ────────────── APP ────────────── */
export default function App() {
  const { t } = useTranslation();

  // إعداد seed عند أول تحميل
  const [currentSeed] = useState(() => {
    const savedSeed = localStorage.getItem('sim_seed');
    const seed = savedSeed ? parseInt(savedSeed) : Math.floor(Math.random() * 2 ** 32);
    initGlobalRNG(seed);
    return seed;
  });
  const [selectedProvince, setSelectedProvince] = useState('');

  // إنشاء الشبكة الاجتماعية مرة واحدة
  const networkRef = useRef<NetworkEdge[][]>([]);
  const recorderRef = useRef<TimeSeriesRecorder>(
    new TimeSeriesRecorder({
      version: '3.0.0',
      seed: currentSeed,
      agentCount: 100,
      province: '',
      startTime: new Date().toISOString(),
      theories: THEORY_KEY_ORDER,
    }, SNAPSHOT_INTERVAL)
  );
  const panelRecorderRef = useRef<PanelDataRecorder>(new PanelDataRecorder(1));

  const initConnections = (count: number): NetworkEdge[][] => {
    const net = buildSocialNetwork(count);
    networkRef.current = net;
    return net;
  };

  const [simState, setSimState] = useState<SimulationState>(() => {
    const connections = initConnections(100);
    const agents = makeAgents(100, '', connections);
    const initCounts = defCounts();
    return {
      status: 'stopped', isRunning: false, tick: 0, agentCount: 100,
      metrics: {
        polarization: 0.2, cohesion: 0.6, identity_fragmentation: 0.3,
        memetic_velocity: 0.3, elite_dominance: 0.2, resistance_strength: 0.3,
        echo_density: 0.2, narrative_volatility: 0.2, algorithmic_capture: 0.15,
        ideological_entropy: 0.3, belief_adoption: 0.05,
      },
      theories: THEORY_KEY_ORDER.map(k => ({ key: k, enabled: k === 'networkContagion', intensity: THEORY_DEFAULT_INTENSITY[k] ?? 0.5 })),
      subtactics: defSubtactics(),
      agentStateStats: computeStats(initCounts, 100),
      agentStateCounts: initCounts,
      useWasm: false, events: [],
      eventHistory: [],
      agentTraits: agents,
      emotionalCounts: countEmotions(agents),
      seed: currentSeed,
      province: '',
      snapshotCount: 0,
      networkStats: { avgDegree: 0, density: 0 },
    };
  });

  const wasmRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);
  const [simSpeed, setSimSpeed] = useState(100);
  const [inspectedAgent, setInspectedAgent] = useState<InspectableAgent | null>(null);
  const [agentGroups, setAgentGroups] = useState<AgentGroup[]>([]);

  const [aiConfig, setAiConfig] = useState<AIConfig>(() => {
    const saved = localStorage.getItem('softpower_aiconfig');
    if (saved) {
      try { return { ...defaultAIConfig, ...JSON.parse(saved) }; } catch (e) {}
    }
    return defaultAIConfig;
  });

  useEffect(() => {
    localStorage.setItem('softpower_aiconfig', JSON.stringify(aiConfig));
  }, [aiConfig]);
  const [aiAlerts, setAiAlerts] = useState<AIAlert[]>([]);
  const [currentAnomalies, setCurrentAnomalies] = useState<Anomaly[]>([]);
  const [aiCallHistory, setAiCallHistory] = useState<AICallRecord[]>([]);
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const aiLockRef = useRef(false);

  // ── التحكم بعدد الدورات والتقرير ──
  const [maxTicks,    setMaxTicks]    = useState(0);          // 0 = غير محدود
  const [showReport,  setShowReport]  = useState(false);


  useEffect(() => {
    loadWasm().then(w => { if (w) { wasmRef.current = w; setSimState(p => ({ ...p, useWasm: true })); } });
  }, []);

  const startSim = useCallback(() => {
    setSimState(p => ({ ...p, status: 'running', isRunning: true }));
  }, []);

  const pauseSim = useCallback(() => setSimState(p => ({ ...p, status: 'paused' })), []);

  const resetSim = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    const newSeed = Math.floor(Math.random() * 2 ** 32);
    initGlobalRNG(newSeed);
    localStorage.setItem('sim_seed', String(newSeed));
    const connections = initConnections(simState.agentCount);
    const agents = makeAgents(simState.agentCount, simState.province, connections);
    const cnts = defCounts();
    cnts.moderate = simState.agentCount;
    recorderRef.current = new TimeSeriesRecorder({
      version: '3.0.0', seed: newSeed, agentCount: simState.agentCount,
      province: simState.province, startTime: new Date().toISOString(),
      theories: THEORY_KEY_ORDER,
    }, SNAPSHOT_INTERVAL);
    panelRecorderRef.current = new PanelDataRecorder(1);
    setInspectedAgent(null);
    setSimState(p => ({
      ...p, status: 'stopped', isRunning: false, tick: 0,
      theories: THEORY_KEY_ORDER.map(k => ({ key: k, enabled: k === 'networkContagion', intensity: THEORY_DEFAULT_INTENSITY[k] ?? 0.5 })),
      subtactics: defSubtactics(),
      agentStateCounts: cnts,
      agentStateStats: computeStats(cnts, p.agentCount),
      events: [], agentTraits: agents,
      emotionalCounts: countEmotions(agents),
      seed: newSeed, snapshotCount: 0,
      metrics: {
        polarization: 0.2, cohesion: 0.6, identity_fragmentation: 0.3,
        memetic_velocity: 0.3, elite_dominance: 0.2, resistance_strength: 0.3,
        echo_density: 0.2, narrative_volatility: 0.2, algorithmic_capture: 0.15,
        ideological_entropy: 0.3, belief_adoption: 0.05,
      },
    }));
  }, [simState.agentCount, simState.province]);

  const toggleTheory = useCallback((k: TheoryKey, en: boolean) => {
    setSimState(p => ({ ...p, theories: p.theories.map(t => t.key === k ? { ...t, enabled: en } : t) }));
  }, []);

  const setTheoryIntensity = useCallback((k: TheoryKey, intensity: number) => {
    setSimState(p => ({ ...p, theories: p.theories.map(t => t.key === k ? { ...t, intensity } : t) }));
  }, []);

  const toggleSubtactic = useCallback((tk: TheoryKey, i: number, en: boolean) => {
    setSimState(p => {
      const s = { ...p.subtactics };
      s[tk] = [...(s[tk] || [])];
      s[tk][i] = en;
      return { ...p, subtactics: s };
    });
  }, []);

  const setAgentCount = useCallback((c: number) => {
    setSimState(p => {
      const connections = initConnections(c);
      const agents = makeAgents(c, p.province, connections);
      const cnts: Record<AgentStateKey, number> = {} as any;
      for (const k of AGENT_STATE_ORDER) cnts[k] = 0;
      cnts.moderate = c;
      return {
        ...p, agentCount: c, agentStateCounts: cnts,
        agentStateStats: computeStats(cnts, c), agentTraits: agents,
        emotionalCounts: countEmotions(agents),
      };
    });
  }, []);

  const triggerEvent = useCallback((cat: 'political' | 'economic' | 'cultural' | 'informational') => {
    const newEvent = createEvent(cat, 300);
    setSimState(prev => ({
      ...prev,
      events: [...prev.events, newEvent],
      eventHistory: [...(prev.eventHistory || []), { type: cat, startTick: prev.tick, name: newEvent.id, duration: 300 }]
    }));
  }, []);

  const handleAgentClick = useCallback((agentId: number) => {
    const agents = simState.agentTraits;
    if (agentId >= 0 && agentId < agents.length) {
      const a = agents[agentId];
      setInspectedAgent({
        id: agentId,
        state: a.state,
        ageProfile: a.ageProfile,
        emotionalState: a.emotionalState || defaultEmotionalState(),
        mind: a.traits as unknown as Record<string, number>,
        memory: { shortTerm: a.memory.recentEvents.map((_, i) => i), traumaEvents: a.memory.longTermBeliefs },
        location: { province: a.province || simState.province, district: a.district || simState.province || '' },
        connections: a.connections?.map(c => c.targetId) || [],
      });
    }
  }, [simState.agentTraits, simState.province]);

  const handleInject = useCallback((agentId: number, injection: AgentInjection) => {
    setSimState(prev => {
      const ags = [...prev.agentTraits];
      const agent = ags[agentId];
      if (!agent) return prev;

      const record: InjectionRecord = {
        tick: prev.tick,
        type: injection.type,
        narrative: injection.narrative || '',
        spreadToNetwork: injection.spreadToNetwork,
        spreadRadius: injection.spreadRadius || 1,
        durationTicks: injection.durationTicks,
        preInjectionState: {
          state: agent.state,
          emotionalState: { ...agent.emotionalState },
          beliefs: { openness: agent.traits.openness, skepticism: agent.traits.skepticism, aggression: agent.traits.aggression },
        },
        effectHistory: [],
      };

      const deltaMap: Record<string, Partial<EmotionalState>> = {
        emotional_trigger: { fear: 0.15, anger: 0.12, hope: -0.08 },
        trauma:            { fear: 0.25, despair: 0.2, hope: -0.15, solidarity: -0.1 },
        info_exposure:     { hope: 0.08, pride: 0.05 },
        resistance_boost:  { fear: -0.1, hope: 0.1, solidarity: 0.1 },
        belief_shift:      { pride: 0.05, hope: 0.1 },
      };

      const emoDelta = deltaMap[injection.type] || { hope: 0.05 };
      const newEmo = { ...agent.emotionalState };
      for (const [k, v] of Object.entries(emoDelta)) {
        (newEmo as any)[k] = Math.max(0, Math.min(1, ((newEmo as any)[k] || 0) + (v as number)));
      }

      // انتشار الحقن في الشبكة
      const affectedIds = new Set<number>([agentId]);
      if (injection.spreadToNetwork && agent.connections) {
        let frontier = agent.connections.map(c => c.targetId);
        for (let r = 0; r < (injection.spreadRadius || 1); r++) {
          const next: number[] = [];
          for (const id of frontier) {
            if (affectedIds.has(id)) continue;
            affectedIds.add(id);
            const neighbor = ags[id];
            if (neighbor?.connections) {
              next.push(...neighbor.connections.map(c => c.targetId));
            }
          }
          frontier = next;
        }
        // تطبيق تأثير أخف على المجاورين
        for (const id of affectedIds) {
          if (id === agentId || !ags[id]) continue;
          const neighbor = ags[id];
          const neighborEmo = { ...neighbor.emotionalState };
          for (const [k, v] of Object.entries(emoDelta)) {
            (neighborEmo as any)[k] = Math.max(0, Math.min(1,
              ((neighborEmo as any)[k] || 0) + (v as number) * 0.4
            ));
          }
          ags[id] = { ...neighbor, emotionalState: neighborEmo };
        }
      }

      ags[agentId] = {
        ...agent,
        emotionalState: newEmo,
        activeInjection: { type: injection.type, remainingTicks: injection.durationTicks },
        injectionHistory: [...(agent.injectionHistory || []), record],
      };

      // تسجيل لحظة الحقن فوراً في السجل التأريخي كحدث مهم (Keyframe/Event)
      Ledger.agentLedger.record(prev.tick, agentId, ags[agentId] as EvoAgent, true, `تدخل خارجي: ${injection.type}`);

      return { ...prev, agentTraits: ags };
    });
  }, []);

  /* ══════════════════════════════════════════════════════════
     SIMULATION LOOP — الإصلاح الجوهري
     ══════════════════════════════════════════════════════════
     البنية الجديدة (ABM حقيقي):
     1. processEvents → تأثير الأحداث الخارجية
     2. Network Signals → كل وكيل يرسل إشارات لجيرانه
     3. applySignals → كل وكيل يعالج الإشارات الواردة
     4. evolveAgent → تطور السمات والعواطف
     5. deriveAgentState → الحالة تنبع من السمات (لا عتبة عالمية)
     6. computeMetricsFromStates → المقاييس تُجمَّع من الوكلاء
  ══════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (simState.status !== 'running') {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      if (simState.status !== 'running') return;
      // ── قفل AI: إذا كان AI يعالج طلباً — تخطي هذا الـ Tick ──
      if (aiLockRef.current) return;
      setSimState(prev => {
        const theories = prev.theories;
        const st = prev.subtactics;
        const total = prev.agentCount;
        const ags = [...prev.agentTraits];
        let activeEvents = [...prev.events];

        // ── المرحلة 1: معالجة الأحداث الخارجية ──
        let currentMetrics = { ...prev.metrics } as unknown as Record<string, number>;
        const { updatedEvents, updatedMetrics } = processEvents(activeEvents, currentMetrics, ags);
        activeEvents = updatedEvents;
        
        // ── تطبيق تأثيرات النظريات على المقاييس — مُعايَرة تجريبياً ──
        const theoryApps = prev.theories
          .filter(th => th.enabled)
          .map(th => ({
            key: th.key,
            enabled: true,
            intensity: th.intensity ?? THEORY_DEFAULT_INTENSITY[th.key] ?? 0.5,
            subtactics: (prev.subtactics[th.key] || []).map(Boolean),
          }));
        currentMetrics = theoryApps.length > 0
          ? applyTheoriesToMetrics(theoryApps, updatedMetrics, ags.length, prev.tick + 1)
          : updatedMetrics;

        // السياق العالمي يأخذ القيم من currentMetrics (المُحدَّثة بالنظريات أعلاه)
        const globalCtx: GlobalContext = {
          polarization:         currentMetrics.polarization         || 0,
          cohesion:             currentMetrics.cohesion             || 0,
          echo_density:         currentMetrics.echo_density         || 0,
          narrative_volatility: currentMetrics.narrative_volatility || 0,
          memetic_velocity:     currentMetrics.memetic_velocity     || 0,
          resistance_strength:  currentMetrics.resistance_strength  || 0,
          algorithmic_capture:  currentMetrics.algorithmic_capture  || 0,
          elite_dominance:      currentMetrics.elite_dominance      || 0,
        };

        // ── المرحلة 3: Network Message Passing ──
        // كل وكيل يرسل إشارات ← يستقبل إشارات ← يتأثر
        // (نُجري على عينة لأداء أفضل مع 1000+ وكيل)
        const NETWORK_SAMPLE_RATE = total <= 200 ? 1.0 : 200 / total;

        const incomingSignalsMap = new Map<number, any[]>();
        // بناء مصفوفة SocialAgent الكاملة مرة واحدة — تُمرَّر لـ generateSignals
        const allSocialAgents: SocialAgent[] = ags.map((a, idx) => ({
          id:          idx,
          state:       a.state,
          traits:      a.traits as Record<string, number>,
          emotional:   a.emotionalState,
          ageGroup:    a.ageProfile.group,
          connections: a.connections || [],
        }));
        for (let i = 0; i < ags.length; i++) {
          if (!ags[i] || rand() > NETWORK_SAMPLE_RATE) continue;
          const signals = generateSignals(allSocialAgents[i], allSocialAgents, theoryApps);
          for (const signal of signals) {
            const existing = incomingSignalsMap.get(signal.targetId) || [];
            existing.push(signal);
            incomingSignalsMap.set(signal.targetId, existing);
          }
        }

        // ── المرحلة 4: تطبيق الإشارات + تطور الوكيل + اشتقاق الحالة ──
        const newStateCounts: Record<AgentStateKey, number> = {} as any;
        for (const k of AGENT_STATE_ORDER) newStateCounts[k] = 0;

        for (let i = 0; i < ags.length; i++) {
          if (!ags[i]) continue;
          let agent = ags[i];

          // تطبيق الإشارات الواردة من الشبكة
          const incoming = incomingSignalsMap.get(i) || [];
          if (incoming.length > 0) {
            const socialAgent: SocialAgent = {
              id: i, state: agent.state,
              traits: agent.traits as Record<string, number>,
              emotional: agent.emotionalState,
              ageGroup: agent.ageProfile.group,
              connections: agent.connections || [],
            };
            const { newTraits, newEmotional } = applySignals(socialAgent, incoming);
            agent = { ...agent, traits: newTraits as any, emotionalState: newEmotional };
          }

          // تطور السمات والعواطف مع الوقت
          const evolved = evolveAgent(agent, currentMetrics, prev.tick + 1);
          agent = { ...evolved, state: agent.state, injectionHistory: agent.injectionHistory, activeInjection: agent.activeInjection, connections: agent.connections };

          // ── الإصلاح الجوهري: الحالة تنبع من السمات ──
          const newState = deriveAgentState(
            agent.traits as Record<string, number>,
            agent.emotionalState,
            globalCtx,
            agent.state,
            agent.ageProfile.group
          );
          agent = { ...agent, state: newState };

          // معالجة الحقن النشط
          let isSignificant = agent.state !== ags[i].state;
          let notes = isSignificant ? `State changed to ${agent.state}` : undefined;

          if (agent.activeInjection) {
            const newRemaining = agent.activeInjection.remainingTicks - 1;
            if (newRemaining <= 0) {
                agent = { ...agent, activeInjection: undefined };
                isSignificant = true;
                notes = 'Injection ended';
            } else {
                agent = { ...agent, activeInjection: { ...agent.activeInjection, remainingTicks: newRemaining } };
                if (agent.activeInjection.remainingTicks === (agent.activeInjection.durationTicks || 100)) {
                    isSignificant = true;
                    notes = 'Injection started';
                }
            }
          }

          Ledger.agentLedger.record(prev.tick + 1, i, agent, isSignificant, notes);

          newStateCounts[agent.state] = (newStateCounts[agent.state] || 0) + 1;
          ags[i] = agent;
        }

        // ── المرحلة 4.5: طبقة الذكاء الاصطناعي (كشف التشوهات + تصحيح محلي) ──
        const anomalySnapshots = ags.map((a, idx) => ({
          index: idx,
          state: a.state,
          emotionalState: a.emotionalState,
          traits: a.traits as Record<string, number>,
          aiProfile: a.aiProfile,
        }));
        const detectedAnomalies = detectAnomalies(
          anomalySnapshots, currentMetrics, prev.tick + 1,
          // نستخدم aiConfig من outside - نمرره كـ snapshot بدل ref
          0.10  // 10% من الوكلاء لكل Tick — سيتم ضبطه من aiConfig في نسخة قادمة
        );

        // تطبيق التصحيحات المحلية للتشوهات غير الخطيرة
        for (const anomaly of detectedAnomalies) {
          if (anomaly.agentIndex >= 0 && !anomaly.requiresOnlineAI) {
            const correction = applyLocalAIReasoning(anomaly, anomalySnapshots[anomaly.agentIndex]);
            if (correction) {
              const agent = ags[correction.agentIndex];
              if (agent && correction.emotionAdjustment) {
                ags[correction.agentIndex] = {
                  ...agent,
                  emotionalState: { ...agent.emotionalState, ...correction.emotionAdjustment },
                };
              }
              // تحديث الذاكرة
              if (agent?.aiProfile) {
                const updatedMem = updateAgentMemory(
                  agent.aiProfile.memory,
                  { tick: prev.tick + 1, event: correction.memoryNote,
                    stateBefore: agent.state, stateAfter: agent.state,
                    emotionDelta: correction.emotionAdjustment ?? {} },
                );
                ags[correction.agentIndex] = {
                  ...ags[correction.agentIndex],
                  aiProfile: { ...agent.aiProfile, memory: updatedMem },
                };
              }
            }
          }
        }

        // ── المرحلة 5: حساب المقاييس من حالات الوكلاء ──
        const finalMetrics = computeMetricsFromStates(newStateCounts, total, prev.tick + 1);

        // ── المرحلة 6: إحصاءات العواطف ──
        const ec = countEmotions(ags);

        // ── المرحلة 7: تسجيل الـ Snapshot ──
        const newTick = prev.tick + 1;
        let newSnapshotCount = prev.snapshotCount;
        if (newTick % SNAPSHOT_INTERVAL === 0 || newTick === 1) {
          recorderRef.current.maybeRecord(
            newTick, finalMetrics, newStateCounts,
            { fear: ec.fearCount, anger: ec.angerCount, hope: ec.hopeCount, pride: ec.prideCount, despair: ec.despairCount, solidarity: ec.solidarityCount },
            activeEvents.length, total, prev.province
          );
          newSnapshotCount = recorderRef.current.getCount();
        }
        panelRecorderRef.current.maybeRecord(newTick, ags);

        // ── توقف تلقائي عند بلوغ الحد الأقصى ──
        const reachedMax = maxTicks > 0 && newTick >= maxTicks;

        return {
          ...prev,
          status: reachedMax ? 'stopped' as SimStatus : 'running' as SimStatus,
          tick: newTick,
          metrics: finalMetrics as unknown as Metrics,
          agentStateCounts: newStateCounts,
          agentStateStats: computeStats(newStateCounts, total),
          events: activeEvents,
          agentTraits: ags,
          emotionalCounts: ec,
          snapshotCount: newSnapshotCount,
          _lastAnomalies: detectedAnomalies,
          _reachedMax: reachedMax,
        } as any;
      });

      // ── المرحلة 8: تحديث تنبيهات AI خارج setSimState ──
      // (نُشغّل router على التشوهات المكتشفة كل 5 ticks لتجنب ثقل الـ state)
    }, simSpeed);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [simState.status, simSpeed]);

  // مراقب التشوهات — يُوقف المحاكاة ويستدعي AI ويُكمل بعد الاستجابة
  useEffect(() => {
    if (simState.status !== 'running') return;
    const raw = (simState as any)._lastAnomalies as Anomaly[] | undefined;
    if (!raw || raw.length === 0) return;

    setCurrentAnomalies(raw);
    const { routings, alerts: newAlerts } = processAnomaliesWithRouter(raw, aiConfig, simState.tick);

    if (newAlerts.length > 0) {
      setAiAlerts(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        const fresh = newAlerts.filter(a => !existingIds.has(a.id));
        return [...fresh, ...prev].slice(0, 20);
      });
    }

    const onlineTasks = routings.filter(r => r.decision === 'online');
    if (onlineTasks.length === 0 || aiConfig.provider === 'none') return;

    // ── تفعيل القفل: المحاكاة تتوقف هنا حتى يرد AI ──
    aiLockRef.current = true;
    setIsWaitingForAI(true);

    (async () => {
      try {
        const results = await Promise.allSettled(
          onlineTasks.map(r => callAIWithManager(r.task, aiConfig))
        );

        const newRecords: AICallRecord[] = [];

        for (const res of results) {
          if (res.status !== 'fulfilled') continue;
          const record = res.value;
          newRecords.push(record);

          if (record.status === 'success' && record.result) {
            const j = record.result;
            if (j.suggested_action === 'correct' && j.confidence > 0.5) {
              setAiAlerts(prev => [
                {
                  id: `ai-j-${record.id}`,
                  tick: simState.tick,
                  severity: (j.severity_adjusted > 0.7 ? 'critical' : 'warning') as import('./simulation/aiRouter').AlertSeverity,
                  title: `🤖 ${record.provider}/${record.model}: ${j.classification}`,
                  message: `${j.reasoning} (ثقة: ${(j.confidence*100).toFixed(0)}% | ${record.duration_ms}ms)`,
                  action: 'dismiss' as const,
                  dismissed: false,
                },
                ...prev,
              ].slice(0, 20));
            }
          } else if (record.status === 'error' || record.status === 'timeout') {
            setAiAlerts(prev => [
              {
                id: `ai-err-${record.id}`,
                tick: simState.tick,
                severity: 'warning' as import('./simulation/aiRouter').AlertSeverity,
                title: `⚠️ فشل ${record.provider} (${record.status}) — ${record.duration_ms}ms`,
                message: record.error ?? 'خطأ في الاتصال بالنموذج',
                action: 'dismiss' as const,
                dismissed: false,
              },
              ...prev,
            ].slice(0, 10));
          }
        }

        if (newRecords.length > 0) {
          setAiCallHistory(prev => [...newRecords, ...prev].slice(0, 100));
        }
      } finally {
        // ── تحرير القفل دائماً حتى عند الخطأ ──
        aiLockRef.current = false;
        setIsWaitingForAI(false);
      }
    })();
  }, [simState.tick]);

  // ── فتح التقرير تلقائياً عند انتهاء الدورات المحددة ──
  useEffect(() => {
    if ((simState as any)._reachedMax && !showReport) {
      const snaps = recorderRef.current.getSnapshots();
      if (snaps.length === 0 || snaps[snaps.length - 1].tick !== simState.tick) {
        recorderRef.current.forceRecord(
          simState.tick, simState.metrics as unknown as Record<string, number>, simState.agentStateCounts,
          simState.emotionalCounts as unknown as Record<string, number>, simState.events.length, simState.agentCount, 'final'
        );
      }
      setShowReport(true);
    }
  }, [(simState as any)._reachedMax]);


  /* ── Export Handlers ── */
  const handleExportTimeSeries = useCallback(() => {
    downloadCSV(recorderRef.current, `timeseries_seed${simState.seed}_tick${simState.tick}.csv`);
  }, [simState.seed, simState.tick]);

  const handleExportJSON = useCallback(() => {
    downloadJSON(recorderRef.current, `simulation_seed${simState.seed}_tick${simState.tick}.json`);
  }, [simState.seed, simState.tick]);

  const handleExportAgentsCSV = useCallback(() => {
    const agents = simState.agentTraits.map((a, i) => ({
      id: i, state: a.state, ageProfile: a.ageProfile,
      emotionalState: a.emotionalState, traits: a.traits,
      location: { province: a.province || simState.province, district: a.district || simState.province || '' },
      injectionHistory: a.injectionHistory || [],
    }));
    downloadAgentsCSV(agents, simState.tick, `agents_seed${simState.seed}_tick${simState.tick}.csv`);
  }, [simState]);

  const handleExportPanelCSV = useCallback(() => {
    downloadPanelCSV(panelRecorderRef.current, `panel_agents_seed${simState.seed}_tick${simState.tick}.csv`);
  }, [simState.seed, simState.tick]);

  const handleExportCodebook = useCallback(() => {
    downloadCodebook(simState.seed, simState.agentCount,
      simState.theories.filter(t => t.enabled).map(t => t.key), t);
  }, [simState]);

  const handleExportAllAgentsFull = useCallback(() => {
    const data = {
      metadata: {
        version: '3.0.0', seed: simState.seed,
        tick: simState.tick, agentCount: simState.agentCount,
        province: simState.province, timestamp: new Date().toISOString(),
        snapshotCount: simState.snapshotCount,
        gini: computeGini(Object.values(simState.agentStateCounts)),
        shannonEntropy: computeShannonEntropy(Object.values(simState.agentStateCounts), simState.agentCount),
      },
      metrics: simState.metrics,
      agentStateDistribution: simState.agentStateCounts,
      emotionalDistribution: simState.emotionalCounts,
      activeEvents: simState.events.map(e => ({ id: e.id, type: e.type, remainingTicks: e.remainingTicks })),
      agents: simState.agentTraits.map((a, i) => ({
        id: i, state: a.state,
        age: a.ageProfile.age, ageGroup: a.ageProfile.group,
        province: a.province, district: a.district,
        emotionalState: a.emotionalState,
        dominantEmotion: dominantEmotion(a.emotionalState),
        traits: a.traits, injectionHistory: a.injectionHistory || [],
        connectionCount: (a.connections || []).length,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `full_snapshot_seed${simState.seed}_tick${simState.tick}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [simState]);

  const handleExportInjectedAgents = useCallback(() => {
    const injected = simState.agentTraits
      .map((a, i) => ({ agent: a, id: i }))
      .filter(item => item.agent.injectionHistory && item.agent.injectionHistory.length > 0);
    const data = {
      seed: simState.seed, tick: simState.tick,
      injectedCount: injected.length,
      injectedAgents: injected.map(({ agent, id }) => ({
        id, state: agent.state,
        age: agent.ageProfile.age, ageGroup: agent.ageProfile.group,
        emotionalState: agent.emotionalState,
        dominantEmotion: dominantEmotion(agent.emotionalState),
        traits: agent.traits, injectionHistory: agent.injectionHistory,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `injected_agents_tick${simState.tick}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [simState]);

  const handleExportAgentSummary = useCallback(() => {
    const injected = simState.agentTraits
      .map((a, i) => ({ agent: a, id: i }))
      .filter(item => item.agent.injectionHistory && item.agent.injectionHistory.length > 0);
        const gini = computeGini(Object.values(simState.agentStateCounts));
    const entropy = computeShannonEntropy(Object.values(simState.agentStateCounts), simState.agentCount);
    const sep = '═══════════════════════════════════════════════\n';
    let txt = `${t.dataExport.summaryTitle}\n${sep}`;
    txt += `${t.dataExport.seed} ${simState.seed}\n${t.dataExport.tick} ${simState.tick}\n${t.dataExport.agents} ${simState.agentCount}\n${t.dataExport.province} ${simState.province}\n`;
    txt += `${t.dataExport.snapshotsRecorded} ${simState.snapshotCount}\n\n`;
    txt += `${t.dataExport.researchMetrics}\n${sep}`;
    txt += `${t.dataExport.giniCoefficient} ${gini.toFixed(4)}\n`;
    txt += `${t.dataExport.shannonEntropy} ${entropy.toFixed(4)}\n`;
    txt += `${t.dataExport.healthScore} ${(((simState.metrics.cohesion || 0) + (1 - (simState.metrics.polarization || 0)) + (1 - (simState.metrics.echo_density || 0))) / 3 * 100).toFixed(1)}%\n\n`;
    txt += `${t.dataExport.metricsLabel}\n${sep}`;
    for (const [key, val] of Object.entries(simState.metrics)) {
      const bar = '█'.repeat(Math.round((val as number) * 20));
      txt += `  ${key.padEnd(28)} ${((val as number) * 100).toFixed(1)}% ${bar}\n`;
    }
    txt += `\n${t.dataExport.injectedAgents} (${injected.length})\n${sep}`;
    for (const { agent, id } of injected) {
      const last = agent.injectionHistory[agent.injectionHistory.length - 1];
      txt += `\n${t.dataExport.agentLabel}${id} [${agent.state}] — ${agent.injectionHistory.length} ${t.dataExport.injectionsLabel}\n`;
      txt += `  ${t.dataExport.preState} ${last.preInjectionState.state} → ${t.dataExport.postState} ${agent.state}\n`;
      txt += `  ${t.dataExport.dominantEmotion} ${dominantEmotion(agent.emotionalState)}\n`;
    }
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `research_summary_tick${simState.tick}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [simState]);

  /* ── Apply Agent Groups ── */
  const handleApplyGroups = useCallback((groups: AgentGroup[]) => {
    if (groups.length === 0) return;
    const totalCount = groups.reduce((s, g) => s + g.count, 0);

    const initGlobalCtx: GlobalContext = {
      polarization: 0.2, cohesion: 0.6, echo_density: 0.2,
      narrative_volatility: 0.2, memetic_velocity: 0.3,
      resistance_strength: 0.3, algorithmic_capture: 0.1,
      elite_dominance: 0.2,
    };

    // بناء الوكلاء من المجموعات
    const connections = initConnections(totalCount);
    const newAgents: any[] = [];

    for (const group of groups) {
      for (let i = 0; i < group.count; i++) {
        // إذا كان هناك archetypeId نستخدم النظام الجديد، وإلا نستخدم preset القديم
        const agentProfile = group.archetypeId
          ? createAgentFromArchetype(
              group.archetypeId,
              group.province,
              group.customTraits,
              group.customEmotions,
              group.ageGroup,
            )
          : createAgentFromPreset(
              group.preset,
              group.province,
              group.customTraits,
              group.customEmotions,
              group.ageGroup,
            );

        const ageProfile: AgeProfile = {
          group: agentProfile.ageGroup,
          age: agentProfile.age,
        };

        const initialState = deriveAgentState(
          agentProfile.traits,
          agentProfile.emotionalBaseline as EmotionalState,
          initGlobalCtx,
          'moderate',
          ageProfile.group
        );

        const agentIdx = newAgents.length;
        newAgents.push({
          traits: agentProfile.traits as AgentTrait,
          memory: defMemory(),
          emotionalState: agentProfile.emotionalBaseline as EmotionalState,
          state: initialState as AgentStateKey,
          ageProfile,
          injectionHistory: [],
          connections: connections[agentIdx] || [],
          province: group.province,
          district: agentProfile.district,
        });
      }
    }

    const newSeed = Math.floor(Math.random() * 2 ** 32);
    initGlobalRNG(newSeed);
    recorderRef.current = new TimeSeriesRecorder({
      version: '3.0.0', seed: newSeed, agentCount: totalCount,
      province: groups[0]?.province ?? '',
      startTime: new Date().toISOString(),
      theories: THEORY_KEY_ORDER,
    }, SNAPSHOT_INTERVAL);
    panelRecorderRef.current = new PanelDataRecorder(1);

    const cnts: Record<AgentStateKey, number> = {} as any;
    for (const k of AGENT_STATE_ORDER) cnts[k] = 0;
    for (const a of newAgents) cnts[a.state as AgentStateKey] = (cnts[a.state as AgentStateKey] || 0) + 1;

    setSimState(prev => ({
      ...prev,
      status: 'stopped', isRunning: false, tick: 0,
      agentCount: totalCount,
      agentTraits: newAgents,
      agentStateCounts: cnts,
      agentStateStats: computeStats(cnts, totalCount),
      emotionalCounts: countEmotions(newAgents),
      seed: newSeed,
      snapshotCount: 0,
      events: [],
      province: groups[0]?.province ?? '',
      theories: THEORY_KEY_ORDER.map(k => ({ key: k, enabled: k === 'networkContagion', intensity: THEORY_DEFAULT_INTENSITY[k] ?? 0.5 })),
      subtactics: defSubtactics(),
      metrics: {
        polarization: 0.2, cohesion: 0.6, identity_fragmentation: 0.3,
        memetic_velocity: 0.3, elite_dominance: 0.2, resistance_strength: 0.3,
        echo_density: 0.2, narrative_volatility: 0.2, algorithmic_capture: 0.15,
        ideological_entropy: 0.3, belief_adoption: 0.05,
      },
    }));
    setInspectedAgent(null);
  }, []);

  /* ── Render ── */
  const displayTheories = simState.theories.map(th => ({
    key: th.key, name: t.theories.names[th.key], enabled: th.enabled,
  }));

  const inspectorAgents = (() => {
    const all = simState.agentTraits.map((a, i) => ({
      id: i, state: a.state, ageProfile: a.ageProfile,
      emotionalState: a.emotionalState || defaultEmotionalState(),
      mind: (a.traits || {}) as Record<string, number>,
      memory: { shortTerm: a.memory.recentEvents.map((_, i2) => i2), traumaEvents: a.memory.longTermBeliefs },
      location: { province: a.province || simState.province, district: a.district || t.inspector.centerDistrict },
      connections: (a.connections || []).map(c => c.targetId),
    }));
    const limited = all.slice(0, 500);
    if (inspectedAgent && !limited.some(a => a.id === inspectedAgent.id)) return [inspectedAgent, ...limited];
    return limited;
  })();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <h1>🧪 {t.app.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Research metadata badge */}
            <div style={{
              background: '#0f172a', border: '1px solid #334155',
              borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#94a3b8',
              fontFamily: 'monospace',
            }}>
              🌱 seed: <span style={{ color: '#60a5fa' }}>{simState.seed}</span>
              {simState.snapshotCount > 0 && (
                <span style={{ marginLeft: 8, color: '#34d399' }}>
                  📸 {simState.snapshotCount} {t.export.snapshots}
                </span>
              )}
            </div>
            <LanguageSwitcher />
          </div>
        </div>
        <p className="subtitle">
          {t.app.subtitle}
          {simState.useWasm ? ` ${t.app.wasmEngine}` : ` ${t.app.jsFallback}`}
          {simState.tick > 0 && ` | ⏳ ${tickToTimeLabel(simState.tick, TICK_YEARS)}`}
          {simState.province && ` | 📍 ${simState.province}`}
        </p>
        {/* placeholder ثابت الارتفاع — يمنع اهتزاز التخطيط */}
        <div style={{ height: 0, overflow: 'visible', position: 'relative' }} />
      </header>

      <div className="app-layout">
        <aside className="control-sidebar">
          <ControlPanel
            isRunning={simState.status === 'running'}
            tick={simState.tick}
            agentCount={simState.agentCount}
            theories={displayTheories}
            subtactics={simState.subtactics}
            agentStateStats={simState.agentStateStats}
            agentStateCounts={simState.agentStateCounts}
            simSpeed={simSpeed}
            events={simState.events as any}
            activeEventIds={new Set()}
            agentTraits={simState.agentTraits}
            metrics={simState.metrics as unknown as Record<string, number>}
            onStart={startSim} onPause={pauseSim} onReset={resetSim}
            onToggleTheory={toggleTheory}
            onToggleSubtactic={toggleSubtactic}
            onSetTheoryIntensity={setTheoryIntensity}
            onSetAgentCount={setAgentCount}
            onSetSpeed={setSimSpeed}
            onTriggerEvent={triggerEvent}
            province={simState.province}
            onSetProvince={(p) => setSimState(s => ({ ...s, province: p }))}
            onExportAllAgents={handleExportAllAgentsFull}
            onExportInjectedAgents={handleExportInjectedAgents}
            onExportAgentSummary={handleExportAgentSummary}
          />

          {/* ── التحكم بعدد الدورات + زر التقرير ── */}
          <div style={{
            background: '#060f1e', border: '1px solid #1e3a5f', borderRadius: 10,
            marginBottom: 12, padding: '10px 12px',
          }}>
            <div style={{ color: '#93c5fd', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
              ⏱ {t.cycleControl.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ color: '#64748b', fontSize: 10, flexShrink: 0 }}>{t.cycleControl.maxLimit}</span>
              <input
                type="number" min={0} step={50}
                value={maxTicks === 0 ? '' : maxTicks}
                onChange={e => setMaxTicks(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder={t.cycleControl.unlimited}
                style={{
                  flex: 1, background: '#0a1628', color: '#e2e8f0',
                  border: `1px solid ${maxTicks > 0 ? '#60a5fa' : '#1e3a5f'}`,
                  borderRadius: 5, padding: '4px 8px', fontSize: 11,
                }}
              />
              <span style={{ color: '#475569', fontSize: 9, flexShrink: 0 }}>{t.cycleControl.cycle}</span>
            </div>
            {maxTicks > 0 && simState.status === 'running' && (
              <div style={{ marginBottom: 8 }}>
                <div style={{
                  height: 4, background: '#1e3a5f', borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${Math.min(100, (simState.tick / maxTicks) * 100)}%`,
                    background: 'linear-gradient(90deg, #60a5fa, #4ade80)',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <div style={{ color: '#475569', fontSize: 9, marginTop: 2, textAlign: 'right' }}>
                  {simState.tick} / {maxTicks} ({((simState.tick / maxTicks) * 100).toFixed(0)}%)
                </div>
              </div>
            )}
            {/* زر التقرير */}
            <button
              onClick={() => {
                const snaps = recorderRef.current.getSnapshots();
                if (snaps.length === 0 || snaps[snaps.length - 1].tick !== simState.tick) {
                  recorderRef.current.forceRecord(
                    simState.tick, simState.metrics as unknown as Record<string, number>, simState.agentStateCounts,
                    simState.emotionalCounts as unknown as Record<string, number>, simState.events.length, simState.agentCount, 'final'
                  );
                }
                setShowReport(true);
              }}
              disabled={simState.tick < 2}
              style={{
                width: '100%', padding: '7px 8px', borderRadius: 6, fontSize: 11,
                background: simState.tick >= 2 ? 'linear-gradient(90deg, #1e3a5f, #1e4e5f)' : '#0a1628',
                color: simState.tick >= 2 ? '#93c5fd' : '#334155',
                border: `1px solid ${simState.tick >= 2 ? '#60a5fa' : '#1e3a5f'}`,
                cursor: simState.tick >= 2 ? 'pointer' : 'not-allowed',
                fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              📊 {t.reportModal.title}
              {simState.tick >= 2 && ` (${simState.snapshotCount} نقطة بيانات)`}
            </button>
          </div>

          {/* ── لوحة الذكاء الاصطناعي ── */}
          <AIPanel
            config={aiConfig}
            alerts={aiAlerts}
            anomalies={currentAnomalies}
            callHistory={aiCallHistory}
            tick={simState.tick}
            isRunning={simState.status === 'running'}
            onConfigChange={setAiConfig}
            onDismissAlert={(id) => setAiAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a))}
            onSwitchOnline={() => setAiConfig(prev => ({ ...prev, mode: 'auto', provider: prev.provider === 'none' ? 'ollama' : prev.provider }))}
          />
          {/* Research Export Panel */}
          <div style={{
            marginTop: 12, padding: 12, background: '#0f172a',
            border: '1px solid #1e3a5f', borderRadius: 8,
          }}>
            <div style={{ color: '#60a5fa', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              🔬 {t.export.researchExport}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={handleExportTimeSeries}
                style={exportBtnStyle('#0284c7')}
                disabled={simState.snapshotCount === 0}>
                📊 {t.export.timeSeriesCsv} ({simState.snapshotCount} {t.export.snapshots})
              </button>
              <button onClick={handleExportJSON} style={exportBtnStyle('#7c3aed')}
                disabled={simState.snapshotCount === 0}>
                🗂️ {t.export.fullJson}
              </button>
              <button onClick={handleExportAgentsCSV} style={exportBtnStyle('#059669')}>
                👥 {t.export.agentsCsv} (tick {simState.tick})
              </button>
              <button onClick={handleExportPanelCSV} style={exportBtnStyle('#c026d3')} disabled={simState.tick === 0}>
                📈 CSV السلاسل الطولية للوكلاء (Panel Data)
              </button>
              <button onClick={handleExportCodebook} style={exportBtnStyle('#d97706')}>
                📖 Codebook للنشر الأكاديمي
              </button>
            </div>
            {simState.snapshotCount === 0 && (
              <p style={{ color: '#64748b', fontSize: 10, marginTop: 6, textAlign: 'center' }}>
                ابدأ المحاكاة لتسجيل {t.export.snapshots}
              </p>
            )}
          </div>

          {/* بنّاء مجموعات الوكلاء */}
          <AgentGroupBuilder
            groups={agentGroups}
            isRunning={simState.status === 'running'}
            onGroupsChange={setAgentGroups}
            onApply={handleApplyGroups}
          />
        </aside>

        <main className="main-content">
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Simulator
                isRunning={simState.status === 'running'}
                tick={simState.tick}
                agentCount={simState.agentCount}
                metrics={simState.metrics}
                agentStateCounts={simState.agentStateCounts}
                onAgentClick={handleAgentClick}
              />
            </div>
            <AgentInspector
              agents={inspectorAgents}
              selectedAgent={inspectedAgent}
              onInject={handleInject}
              aiConfig={aiConfig}
            />
          </div>
          <MetricsDisplay
            tick={simState.tick}
            metrics={simState.metrics}
            agentStateStats={simState.agentStateStats}
            seed={simState.seed}
            snapshotCount={simState.snapshotCount}
            gini={computeGini(Object.values(simState.agentStateCounts))}
            shannonEntropy={computeShannonEntropy(Object.values(simState.agentStateCounts), simState.agentCount)}
          />
        </main>
      </div>

      {/* ── التقرير الأكاديمي ── */}
      {showReport && (
        <ReportModal
          data={{
            snapshots:   recorderRef.current.getSnapshots(),
            seed:        simState.seed,
            agentCount:  simState.agentCount,
            province:    simState.province,
            theories:    Object.keys(simState.theories).filter(k => (simState.theories as any)[k]),
            totalTicks:  simState.tick,
            aiCallCount: aiCallHistory.length,
            eventHistory: simState.eventHistory || [],
          }}
          aiConfig={aiConfig}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* ── AI Waiting Indicator ── */}
      {isWaitingForAI && (
        <div style={{
          position: 'fixed',
          top: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9000,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 24px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(74, 222, 128, 0.5)',
          borderRadius: 30,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px rgba(74, 222, 128, 0.2)',
          animation: 'ai-pulse 2s ease-in-out infinite',
          fontSize: 14,
          color: '#f8fafc',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          <span style={{ animation: 'spin 1.5s linear infinite', display: 'flex', fontSize: 16 }}>⚙️</span>
          <span>
            {t.simulator.aiPausedHint.replace('{model}', `${aiConfig.provider}/${aiConfig.ollamaModel || aiConfig.customModel}`)}
          </span>
        </div>
      )}
    </div>
  );
}


function exportBtnStyle(color: string): React.CSSProperties {
  return {
    background: color, border: 'none', color: '#fff',
    padding: '6px 10px', borderRadius: 6, fontSize: 11,
    cursor: 'pointer', textAlign: 'left', width: '100%',
  };
}
