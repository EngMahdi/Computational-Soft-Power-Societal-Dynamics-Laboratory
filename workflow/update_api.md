# Soft Power Lab — AI-Enhanced Architecture Update

## Goal
This update defines how AI should be integrated into the simulation without destroying speed, individuality, realism, or research value.

The system must remain a fast agent-based simulation core, while AI becomes a selective intelligence layer for anomaly detection, memory continuity, local reasoning, role-aware guidance, and influence propagation.

## Non-Negotiable Principles
1. Do not replace the simulation core with AI.
2. Do not turn agents into identical cluster averages.
3. Do not make every agent equally intelligent.
4. Do not call AI for every agent on every tick.
5. Do not allow agents to forget their history across time.
6. Do not allow correction logic to destroy emergent behavior.
7. Do not let language limitations break the simulation.
8. Do not let the AI override deterministic state transitions unless a correction is explicitly needed.

## System Layers

### 1. Deterministic Simulation Core
This is the main engine. It handles:
- agent state updates,
- emotion updates,
- trait evolution,
- network propagation,
- event handling,
- theory effects,
- state derivation,
- random seed control,
- metrics and exports.

This layer must stay fast and reproducible.

### 2. Agent Internal Model
Every agent must remain an individual entity with:
- traits,
- emotions,
- state,
- memory,
- role,
- influence strength,
- susceptibility,
- cognitive depth,
- recent history,
- and long-term behavioral continuity.

No agent may be collapsed into a group representation that erases individuality.

### 3. AI Orchestration Layer
AI is used only when needed. It may:
- judge anomalies,
- produce sparse decision priors,
- maintain historical continuity,
- interpret abnormal behavior,
- assign local correction,
- guide high-value agents,
- and support role-based intelligence.

### 4. Anomaly Intelligence Layer
AI must inspect abnormal simulation patterns and classify them as:
- natural emergence,
- suspicious artifact,
- numerical drift,
- memory inconsistency,
- identity rupture,
- or correction-needed anomaly.

The AI must not blindly “fix” all anomalies. It must first decide whether the anomaly is a real social outcome or a simulation error.

### 5. Memory Layer
Every agent must have memory continuity.

The memory system must include:
- short-term memory,
- episode memory,
- long-term profile,
- historical transitions,
- unresolved tensions,
- repeated patterns,
- and influence traces.

The purpose is that the agent at tick 50 should still feel like the same agent that existed at tick 10.

### 6. Influence Propagation Layer
Instead of asking AI to reason for every agent directly, use propagation:
- a high-impact agent may influence nearby agents,
- influence spreads through network connections,
- resistant agents reduce propagation,
- similar agents amplify propagation,
- and influence can travel across one or more hops.

This saves tokens and preserves realism.

## Agent Intelligence Diversity
Agents must not be equal in reasoning power.

Define an intelligence profile per agent:
- very low,
- low,
- medium,
- high,
- expert-like.

Use this profile to control:
- AI call frequency,
- reasoning depth,
- susceptibility to trends,
- resistance to manipulation,
- memory retention strength,
- and role influence.

Also define social roles such as:
- reformer,
- disruptor,
- stabilizer,
- manipulator,
- bridge builder,
- opinion leader,
- follower,
- gatekeeper.

Roles are not personalities. They are social functions.

## AI Usage Policy
Use AI only under these conditions:
- anomaly detected,
- high-value agent requires reasoning,
- a memory inconsistency appears,
- a major event changes the social landscape,
- a researcher explicitly enables deeper reasoning mode,
- or a propagation leader needs a decision prior.

Do not use AI to produce full-agent decisions every tick.

## Local vs Online Inference
### Local Model
Use local models when:
- speed is critical,
- the task is small,
- agent count is high,
- context is compact,
- and Arabic support is not essential at the reasoning layer.

### Online API
Use online API when:
- the reasoning task is complex,
- deeper interpretation is needed,
- anomaly correction requires stronger reasoning,
- or research mode demands better synthesis.

### Routing Rule
The system must choose the inference source based on:
- cost,
- latency,
- complexity,
- importance,
- language needs,
- and current load.

## Anomaly Correction Rules
When correcting anomalies:
1. Classify the anomaly first.
2. Compare it with the historical baseline.
3. Decide if it is real or faulty.
4. Apply only local correction.
5. Preserve agent identity.
6. Avoid over-correction.
7. Do not destroy emergent effects unless they are mathematically or logically broken.

## Memory Update Rules
Every tick may update memory, but memory updates must be compact.
Store:
- what happened,
- what changed,
- how the agent reacted,
- whether the agent learned,
- and whether the event became part of long-term identity.

Do not store full raw history if it will slow the system. Use compression and summaries.

## Language Handling
The internal reasoning layer should be language-neutral.
The UI may render Arabic, English, or any supported language.
If a local model cannot handle Arabic well, translate input and output at the boundaries only.

## Updated Tick Flow
1. Process events.
2. Update environment metrics.
3. Propagate network signals.
4. Apply theory effects.
5. Update emotions and traits.
6. Check anomaly candidates.
7. Run AI judgment only if needed.
8. Apply local correction or influence shift.
9. Update memory.
10. Derive final state.
11. Export metrics and history.

## Important Technical Constraints
- Keep the simulation deterministic where possible.
- Use clamps for bounded values.
- Avoid global mutation of all agents.
- Use small structured outputs from AI.
- Prefer event-driven inference.
- Keep data model compatibility with existing TypeScript and Rust engines.

## Research Requirement
The system must remain academically valuable.
That means:
- reproducible state evolution,
- measurable anomalies,
- interpretable memory,
- controllable agent roles,
- and structured experimental outcomes.

The AI layer exists to increase realism and usefulness, not to replace the simulation.

## Final Design Rule
The AI should act like a smart supervisor over a living simulation:
- it watches,
- interprets,
- corrects,
- remembers,
- and guides only where needed.

It must never erase the individuality, history, or emergent dynamics of the agents.
