import type { AgentStateKey } from '../i18n/types';
import { AGENT_STATE_ORDER } from '../i18n/types';

/**
 * Safe division that returns fallback when denominator is 0 or NaN
 */
export function safeRatio(numerator: number, denominator: number, fallback = 0.5): number {
  if (!denominator || !isFinite(denominator) || isNaN(denominator)) return fallback;
  const result = numerator / denominator;
  return isFinite(result) && !isNaN(result) ? Math.max(0, Math.min(1, result)) : fallback;
}

/**
 * Clamp value to [0, 1], return fallback if NaN
 */
export function safeClamp(value: number, fallback = 0.5): number {
  if (value === undefined || value === null || isNaN(value) || !isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

/**
 * Maps camelCase MetricKey to the snake_case internal representation
 */
const METRIC_KEY_TO_SNAKE: Record<string, string> = {
  polarization: 'polarization',
  cohesion: 'cohesion',
  identityFragmentation: 'identity_fragmentation',
  memeticVelocity: 'memetic_velocity',
  eliteDominance: 'elite_dominance',
  resistanceStrength: 'resistance_strength',
  echoDensity: 'echo_density',
  narrativeVolatility: 'narrative_volatility',
  algorithmicCapture: 'algorithmic_capture',
  ideologicalEntropy: 'ideological_entropy',
  beliefAdoption: 'belief_adoption',
};

export function getMetricValue(metrics: Record<string, number>, key: string): number {
  const snake = METRIC_KEY_TO_SNAKE[key] || key;
  const val = metrics[snake];
  return safeClamp(val, 0);
}

export function defaultMetrics(): Record<string, number> {
  return {
    polarization: 0.2,
    cohesion: 0.6,
    identity_fragmentation: 0.3,
    memetic_velocity: 0.3,
    elite_dominance: 0.2,
    resistance_strength: 0.3,
    echo_density: 0.2,
    narrative_volatility: 0.2,
    algorithmic_capture: 0.1,
    ideological_entropy: 0.3,
    belief_adoption: 0.3,
  };
}

/**
 * Compute metrics from actual agent state distribution — NOT from accumulators
 * This is the key fix for NaN and 100% polarization issues
 */
export function computeMetricsFromStates(
  agentStateCounts: Record<AgentStateKey, number>,
  totalAgents: number,
  tick: number
): Record<string, number> {
  if (!totalAgents || totalAgents === 0) return defaultMetrics();

  const extremist = agentStateCounts.extremist || 0;
  const conservative = agentStateCounts.conservative || 0;
  const moderate = agentStateCounts.moderate || 0;
  const liberal = agentStateCounts.liberal || 0;
  const positiveInf = agentStateCounts.positiveInfluencer || 0;
  const negativeInf = agentStateCounts.negativeInfluencer || 0;
  const resistant = agentStateCounts.resistant || 0;
  const gullible = agentStateCounts.gullible || 0;
  const activist = agentStateCounts.activist || 0;
  const isolated = agentStateCounts.isolated || 0;

  // REAL polarization: based on extreme vs moderate ratio
  const extremeStates = extremist + activist + negativeInf;
  const moderateStates = moderate + liberal + positiveInf;
  const polarization = safeRatio(extremeStates * 2, totalAgents + moderateStates, 0.3);

  // REAL cohesion: inverse of fragmentation + disruptive states
  const disruptors = extremist + isolated + negativeInf + activist;
  const cohesion = safeClamp(1.0 - safeRatio(disruptors * 1.5, totalAgents, 0.3), 0.4);

  // Identity fragmentation: variety of states active
  const activeStates = [extremist, conservative, moderate, liberal, positiveInf, negativeInf, resistant, gullible, activist, isolated]
    .filter(c => c > 0).length;
  const identity_fragmentation = safeClamp(safeRatio(activeStates, 10) * (1 - safeRatio(moderate, totalAgents)), 0.2);

  // Memetic velocity: how fast beliefs spread = f(connectedness, diversity)
  const memetic_velocity = safeClamp(
    safeRatio(activist + positiveInf + negativeInf, totalAgents) * 1.5 +
    safeRatio(tick % 50, 50) * 0.3,
    0.2
  );

  // Elite dominance: influencers / total
  const elite_dominance = safeRatio(positiveInf + negativeInf, totalAgents, 0.15);

  // Resistance strength: resistant + conservative
  const resistance_strength = safeRatio(resistant + conservative, totalAgents, 0.25);

  // Echo density: isolated + gullible as they are in information bubbles
  const echo_density = safeRatio(isolated + gullible + conservative, totalAgents, 0.2);

  // Narrative volatility: changes based on activist + extremist presence
  const narrative_volatility = safeClamp(
    safeRatio(activist + extremist, totalAgents) * 2 +
    safeRatio(tick % 30, 30) * 0.2,
    0.15
  );

  // Algorithmic capture: gullible + liberal (more susceptible)
  const algorithmic_capture = safeRatio(gullible + liberal, totalAgents, 0.15);

  // Ideological entropy: measure of state diversity
  const stateRatios = [extremist, conservative, moderate, liberal, positiveInf, negativeInf, resistant, gullible, activist, isolated]
    .map(c => c / totalAgents)
    .filter(r => r > 0.01);
  const ideological_entropy = safeClamp(
    stateRatios.length > 1 ? 
      -stateRatios.reduce((s, r) => s + r * Math.log2(r), 0) / Math.log2(10) : 
      0.3,
    0.2
  );

  // BUG #4 FIX: belief_adoption = rate of non-moderate states (actual belief change happening)
  // Instead of measuring "open population", measure how many agents have shifted from default
  const changedBelief = extremist + conservative + liberal + activist + resistant + 
                         positiveInf + negativeInf + gullible + isolated;
  const belief_adoption = safeRatio(changedBelief, totalAgents, 0.3);

  return {
    polarization: safeClamp(polarization),
    cohesion: safeClamp(cohesion),
    identity_fragmentation: safeClamp(identity_fragmentation),
    memetic_velocity: safeClamp(memetic_velocity),
    elite_dominance: safeClamp(elite_dominance),
    resistance_strength: safeClamp(resistance_strength),
    echo_density: safeClamp(echo_density),
    narrative_volatility: safeClamp(narrative_volatility),
    algorithmic_capture: safeClamp(algorithmic_capture),
    ideological_entropy: safeClamp(ideological_entropy),
    belief_adoption: safeClamp(belief_adoption),
  };
}