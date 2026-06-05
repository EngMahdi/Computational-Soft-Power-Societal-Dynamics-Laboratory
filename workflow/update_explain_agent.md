# Soft Power Lab — Agent Life Ledger, Intervention Research, and Deep Inspection Layer

## Purpose
This document defines a new **upper layer** that sits on top of the existing simulation system.  
Its goal is to make the simulation suitable for serious research, agent-level inspection, intervention analysis, and long-form historical tracking.

This layer does not replace the current simulation engine.  
It extends it by adding:
- full agent timeline logging,
- society-level timeline logging,
- intervention tracking,
- anomaly tracking,
- deep inspection for one agent or many agents,
- before/after comparison,
- and research-grade report generation.

The current simulation core remains responsible for:
- tick updates,
- signals,
- network propagation,
- theory effects,
- emotion updates,
- state derivation,
- and deterministic evolution.

The new layer is responsible for:
- remembering what happened,
- explaining what happened,
- allowing selective inspection across any time range,
- and turning simulation history into scientific evidence.

---

## 1. Main Concept

The system must no longer behave like a simulation that only produces final states.  
Instead, it must behave like a **living research archive**.

Every agent must have a visible life history.  
Every intervention must have a trace.  
Every abnormal event must be classifiable.  
Every time range must be selectable by the user or by the AI.

This means the system must support:
- one agent from tick A to tick B,
- a group of agents from tick A to tick B,
- the full society from tick A to tick B,
- and multiple ranges for comparison.

Important:
The values “10 to 20” are only an example.  
The system must allow any start tick and any end tick selected by the user.

---

## 2. Layer Placement

This is an additional layer above the existing architecture.

### Existing layers
1. Simulation Core.
2. Agent Model.
3. Theory Engine.
4. Network Engine.
5. Event System.

### New research layer
6. Agent Life Ledger.
7. Society Ledger.
8. Intervention Ledger.
9. Deep Inspection Engine.
10. Research Report Generator.

This layer reads from the simulation state and writes only metadata, logs, summaries, and analysis structures.  
It must not destroy the original simulation logic.

---

## 3. Core Goals

The new layer must accomplish the following:

### A. Preserve agent identity
An agent must not feel like a completely different person between distant ticks unless the simulation actually explains why.

The system must preserve:
- age,
- education level,
- cognitive depth,
- susceptibility,
- influence pattern,
- memory continuity,
- role,
- and historical reactions.

### B. Make the timeline readable
The user must be able to open one agent and see:
- what happened to them,
- when it happened,
- what affected them,
- who influenced them,
- how they reacted,
- how their memory changed,
- and whether any intervention repaired or damaged them.

### C. Support selected time ranges
The user must be able to select:
- any start tick,
- any end tick,
- any agent,
- any set of agents,
- and any intervention window.

### D. Support scientific intervention
The user must be able to apply:
- a positive intervention,
- a corrective intervention,
- a neutral observation intervention,
- or a negative disturbance intervention.

The system must then measure:
- direct effect on the target agent,
- indirect effect on connected agents,
- effect on the social cluster,
- and effect on the whole simulation.

### E. Produce research-grade output
The AI must generate:
- a structured report,
- a summary of the selected period,
- a list of important events,
- causal interpretation,
- anomaly interpretation,
- and recommended next action.

---

## 4. New Data Model

The AI implementing this update must add new data structures for time-based research.

### 4.1 AgentTimelineEntry
A single record for one agent at one tick or event moment.

Required fields:
- `tick`
- `agentId`
- `age`
- `state`
- `traitsSnapshot`
- `emotionsSnapshot`
- `beliefSnapshot`
- `memorySnapshot`
- `role`
- `cognitiveDepth`
- `influenceStrength`
- `susceptibility`
- `incomingSignals`
- `outgoingSignals`
- `theoryEffects`
- `eventsApplied`
- `interventionsApplied`
- `anomalyFlags`
- `notes`

### 4.2 AgentTimeline
A list of `AgentTimelineEntry` records for one agent.

Required fields:
- `agentId`
- `entries`
- `startTick`
- `endTick`
- `summary`
- `dominantTrends`
- `identityStabilityScore`
- `memoryContinuityScore`
- `influenceTrajectory`
- `interventionImpactScore`

### 4.3 SocietyTimelineEntry
A single record for the whole simulation at one tick.

Required fields:
- `tick`
- `populationSize`
- `stateDistribution`
- `emotionDistribution`
- `polarization`
- `cohesion`
- `entropy`
- `echoDensity`
- `memeticVelocity`
- `eliteDominance`
- `narrativeVolatility`
- `beliefAdoption`
- `anomalyCount`
- `activeEvents`
- `activeInterventions`
- `globalNotes`

### 4.4 SocietyTimeline
A list of `SocietyTimelineEntry` records.

### 4.5 InterventionRecord
A record describing a repair, a disturbance, or a planned test.

Required fields:
- `interventionId`
- `tick`
- `targetType`
- `targetIds`
- `interventionType`
- `intensity`
- `duration`
- `reason`
- `expectedOutcome`
- `actualOutcome`
- `preState`
- `postState`
- `networkRipple`
- `recoveryScore`
- `notes`

### 4.6 AnomalyRecord
A record describing a detected abnormality.

Required fields:
- `tick`
- `agentId`
- `anomalyType`
- `severity`
- `classification`
- `isRealEmergence`
- `isSimulationError`
- `correctiveAction`
- `confidence`
- `notes`

---

## 5. Agent Life Ledger

Every agent must have a persistent life ledger.

This ledger is not optional.  
It is required for research inspection.

The ledger must store:
- a summary of the agent’s life,
- their full timeline in compact form,
- key transitions,
- memory shifts,
- major emotional turning points,
- major belief shifts,
- social influence events,
- and all interventions that affected them.

The ledger must support:
- querying a single tick,
- querying a range of ticks,
- querying all ticks before a given point,
- querying all ticks after a given point,
- and comparing two separate ranges.

Example:
- Range A = tick 10 to tick 20.
- Range B = tick 50 to tick 60.
These are only examples.  
The system must allow any valid range.

The AI must not hardcode this range.  
It must expose a generic range selector.

---

## 6. Society Ledger

The society ledger stores the whole community behavior over time.

This ledger must show:
- macro-level state transitions,
- trend shifts,
- polarization changes,
- social cohesion changes,
- group fragmentation,
- influence cascades,
- anomaly clusters,
- and intervention impact.

It must be possible to compare:
- society before intervention,
- society during intervention,
- society after intervention.

This layer is important because some changes are not visible in a single agent but become visible only at the social level.

---

## 7. Deep Inspection Engine

The deep inspection engine is the part that the AI and the UI use to analyze a selected subset.

It must support:
- one agent only,
- multiple agents,
- a connected group,
- a social cluster,
- the full population,
- or any custom selection.

It must support:
- one tick,
- a continuous tick range,
- multiple non-contiguous ranges,
- or the full life of the simulation.

It must generate:
- a narrative timeline,
- an event list,
- a causal graph summary,
- a memory evolution summary,
- and a report of important turning points.

The engine must also answer:
- What changed?
- Why did it change?
- Which event caused it?
- Which agent influenced it?
- Did AI intervention help?
- Did the target recover?
- Did the effect spread to others?

---

## 8. Intervention System

The simulation must support interventions that can be injected into the system and measured later.

### Intervention types
- `restorative`
- `corruptive`
- `neutral`
- `corrective`
- `stabilizing`
- `experimental`

### Intervention scope
- one agent,
- multiple agents,
- a group,
- a cluster,
- or the whole system.

### Intervention examples
- a positive social message,
- a corrective educational message,
- a de-escalation strategy,
- a misinformation burst,
- a trust-building action,
- a prestige-based repair action,
- or a social coordination intervention.

The intervention must be measured in terms of:
- direct effect,
- indirect effect,
- resistance,
- decay over time,
- and ripple effect across the network.

---

## 9. Time Range Selection

The system must allow the user or AI to select any analysis window.

This means:
- start tick can be any valid tick,
- end tick can be any valid tick after the start,
- the range can be short or long,
- and more than one range can be selected for comparison.

This is essential because analysis is not always about the full simulation.  
Sometimes the user wants to inspect only a particular period.

Required options:
- current tick only,
- last N ticks,
- custom start/end ticks,
- multiple custom ranges,
- pre-intervention vs post-intervention,
- and agent lifespan segments.

The AI must interpret these ranges flexibly.  
The example “10 to 20” must be treated as a sample, not a fixed rule.

---

## 10. Identity Continuity

This is one of the most important requirements.

The agent must not be reset into a different personality after enough ticks.  
The system must preserve:
- behavioral inertia,
- memory accumulation,
- social reputation,
- trust history,
- and cognitive consistency.

If a strong change happens, the system must store:
- what caused the change,
- when it started,
- how fast it developed,
- and whether it is reversible.

This prevents the problem where an agent at tick 50 feels unrelated to the same agent at tick 10.

---

## 11. Intelligence Diversity

The AI must understand that not every agent is equally intelligent or equally resistant.

Each agent should have a configurable cognitive profile:
- low,
- medium,
- high,
- expert-like.

This profile affects:
- how much AI reasoning the agent receives,
- how easily the agent is influenced,
- how strongly the agent resists trend pressure,
- and how likely the agent is to repair itself after intervention.

Also support role variation:
- reformer,
- disruptor,
- stabilizer,
- manipulator,
- bridge builder,
- passive follower,
- opinion leader,
- gatekeeper.

These roles must matter in the analysis.

---

## 12. AI Responsibilities in This Layer

The AI should do the following:
1. Read the selected time range.
2. Read the selected agents.
3. Read the selected interventions.
4. Read the society ledger.
5. Read the anomaly records.
6. Summarize what happened.
7. Explain why it happened.
8. Suggest whether the effect is real or anomalous.
9. Suggest corrective action if needed.
10. Generate a structured research report.

The AI must not:
- erase the timeline,
- ignore memory,
- ignore time range selection,
- or flatten all agents into average values.

---

## 13. Required UI/Editor Outputs

The editor and UI should be able to show:

### For a single agent
- full timeline,
- selected tick range,
- memory changes,
- intervention history,
- anomaly history,
- influence graph,
- and summary.

### For a group
- comparative timeline,
- shared anomalies,
- internal influence flow,
- and collective intervention outcome.

### For the society
- macro trends,
- event periods,
- cluster behavior,
- and intervention effects.

### For export
- JSON export,
- CSV export,
- and research PDF export.

---

## 14. Suggested File Additions

The AI implementing the update should create new modules or equivalent structures.

### Web client
- `src/simulation/agentTimeline.ts`
- `src/simulation/societyTimeline.ts`
- `src/simulation/interventionLedger.ts`
- `src/simulation/anomalyLedger.ts`
- `src/simulation/deepInspection.ts`
- `src/simulation/researchReport.ts`

### Types
- `src/types/timeline.ts`
- `src/types/intervention.ts`
- `src/types/anomaly.ts`

### UI
- `src/components/AgentTimelineView.tsx`
- `src/components/InspectionRangeSelector.tsx`
- `src/components/InterventionPanel.tsx`
- `src/components/ResearchReportPanel.tsx`

### Python
- `python/timeline_analysis.py`
- `python/intervention_analysis.py`
- `python/research_report.py`

---

## 15. Processing Flow

1. Simulation runs normally.
2. Each tick writes compact entries to the ledgers.
3. AI or user selects an agent or a group.
4. AI or user selects a time range.
5. Deep inspection reads only the selected range.
6. Interventions are applied if requested.
7. The system records before/after differences.
8. The report generator creates a research summary.
9. The PDF exporter outputs the final document.

---

## 16. Non-Negotiable Constraints

- Do not break the current simulation engine.
- Do not remove existing tick logic.
- Do not replace deterministic simulation with LLM-only behavior.
- Do not hide the individual agent history inside one global average.
- Do not ignore the selected time range.
- Do not make the timeline depend on a fixed example window.
- Do not make memory optional.
- Do not make interventions untraceable.

---

## 17. Final Objective

This layer must convert the simulation into a research system that can answer:
- What happened to this agent?
- When did it happen?
- What caused it?
- Who influenced it?
- What did the intervention do?
- Did the effect spread to neighbors?
- Did the agent recover?
- Did the society improve or degrade?
- Is the anomaly real or a simulation artifact?

The system should make the simulation understandable, inspectable, and scientifically useful.

It should not merely simulate outcomes.  
It should explain them.