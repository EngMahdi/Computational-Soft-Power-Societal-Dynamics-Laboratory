# Optional Parallel AI Request Manager
# Soft Power Lab — Token Budget, Deduplication, Caching, and Adaptive Routing Layer

## Purpose
This layer manages AI requests from agents without changing the core social simulation.

The goal is to:
- collect repeated requests,
- avoid sending the same request many times,
- reuse cached answers when possible,
- support optional parallel execution,
- keep the system flexible,
- and preserve the simulation-first architecture.

This layer is only responsible for AI requests from agents.
It does not include the final research report generation.
The final report is handled separately.

---

## 1. Main Principle

The simulation core must remain the source of social behavior.

The AI request layer must only:
- receive request signals,
- decide whether to send them to AI,
- merge repeated requests,
- route them to the correct model,
- cache results,
- and return compact answers to the simulation.

The AI layer must not become the main engine of the society.

---

## 2. Token Budget Scope

The token budget is not for one tick only.

The budget is for the whole test session or experiment session.

Example:
- Total AI request budget: 200,000 tokens.
- This budget is shared across all agent requests during the test session.
- The final research report is excluded from this budget.
- Only agent requests count toward this budget.

The system must spend tokens carefully across time.

---

## 3. Required Behavior

The system must:
- detect duplicate or near-duplicate requests,
- avoid re-sending the same request,
- compress similar requests into one batch,
- answer only high-value requests,
- delay low-priority requests if needed,
- use cached results when safe,
- and optionally run in parallel if enabled.

---

## 4. Optional Parallel Mode

Parallel execution must be optional.

The system must support:
- `parallelEnabled = true`
- `parallelEnabled = false`

If parallel is disabled:
- requests are processed sequentially,
- with batching and caching only.

If parallel is enabled:
- requests can be split across workers or model calls,
- but the system must still respect budget and deduplication rules.

Parallelism is an optimization, not a requirement.

---

## 5. Request Collection Flow

When agents ask for AI help, the system must not immediately forward every request.

Instead it must:
1. collect raw requests,
2. normalize them,
3. extract signatures,
4. compare them with recent requests,
5. group duplicates,
6. check cache,
7. assign priority,
8. decide whether AI is needed,
9. route the request,
10. store the result.

---

## 6. Request Signature

Every request must generate a compact signature.

The signature should include:
- request type,
- target agent or group,
- recent state summary,
- emotion summary,
- role summary,
- anomaly type if any,
- tick range,
- and intervention context if any.

If two requests share the same or nearly the same signature, they should be merged.

---

## 7. Duplicate Handling

If a request is a duplicate:
- do not send it again,
- reuse the earlier answer,
- or attach it to the existing batch.

Duplicate detection must work for:
- exact duplicates,
- near duplicates,
- semantically equivalent requests,
- and repeated cluster-wide patterns.

This is one of the most important rules.

---

## 8. Deduplication Rules

The system must deduplicate by:
- exact signature match,
- semantic similarity,
- same agent cluster,
- same tick window,
- same intervention state,
- same anomaly pattern.

The system must keep:
- one canonical request,
- and a list of all agents that referenced it.

---

## 9. Priority Rules

Not every request deserves AI.

Priority levels must be:
- `critical`
- `high`
- `medium`
- `low`
- `ignore`

Critical requests include:
- anomaly detection,
- identity rupture,
- impossible state transitions,
- major intervention reaction,
- or severe cluster divergence.

Low-priority requests may be delayed or skipped.

---

## 10. Caching Rules

The system must cache AI answers.

Cache keys should depend on:
- request signature,
- summary hash,
- tick range,
- and context type.

If the same pattern appears again:
- return cached answer,
- do not call AI again,
- unless cache invalidation is required.

Cache invalidation should happen when:
- the agent changes heavily,
- the social cluster changes,
- the intervention changes,
- or the requested range changes materially.

---

## 11. Batch Processing

Similar requests must be grouped into batches.

Batching should happen when requests have:
- same request type,
- same or similar context,
- same social cluster,
- same anomaly family,
- or same intervention pattern.

A batch can be processed by one AI call and then split into per-agent outputs if needed.

Batching must reduce token use and improve speed.

---

## 12. Model Routing

The system must be able to choose which AI to use.

Routing options:
- small local model,
- medium shared model,
- cloud model,
- or no AI at all.

Routing should depend on:
- request priority,
- available budget,
- model load,
- context size,
- and needed accuracy.

Simple requests should go to small models first.

Complex requests can go to stronger models if budget allows.

---

## 13. Token Budget Manager

The system must track token usage across the whole session.

The budget manager must:
- track total tokens spent,
- track tokens per request,
- track tokens per batch,
- track tokens per agent,
- track tokens per cluster,
- and track remaining budget.

If budget is low:
- reduce AI usage,
- rely on caching,
- rely on heuristics,
- and delay noncritical requests.

---

## 14. Budget Allocation Policy

The budget must be allocated dynamically.

Suggested policy:
- critical anomaly requests get priority budget,
- high-value agents get more budget,
- repeated stable agents get less budget,
- cluster summaries get shared budget,
- low-value requests get skipped if needed.

The budget must never be spent evenly without logic.

---

## 15. Parallel Mode Details

If parallel mode is enabled, the system may:
- split batches across workers,
- send independent batches at the same time,
- use multiple model endpoints,
- or process independent clusters concurrently.

But parallel execution must respect:
- rate limits,
- token budget,
- response ordering,
- and cache consistency.

Parallelism must not cause duplicated work.

---

## 16. Sequential Mode Details

If parallel mode is disabled:
- process requests one batch at a time,
- keep the same deduplication rules,
- keep the same cache rules,
- keep the same budget rules,
- and preserve determinism as much as possible.

Sequential mode must remain fully supported.

---

## 17. Response Format

AI responses must be structured and small.

Preferred response format:
- `decision`
- `confidence`
- `short_reason`
- `impact_scope`
- `affected_agents`
- `cacheable`
- `expires_after_ticks`

Do not require long free-text answers unless specifically needed.

---

## 18. Agent Request Flow

For each agent request:
1. receive the request,
2. normalize it,
3. generate signature,
4. check duplicates,
5. check cache,
6. assign priority,
7. decide if AI is needed,
8. route or batch it,
9. store response,
10. apply result to the agent or cluster.

---

## 19. Group Request Flow

For a group of similar requests:
1. collect requests,
2. detect common pattern,
3. merge into one batch,
4. send one AI call,
5. distribute the answer,
6. store batch history,
7. link all agents to the same batch result.

---

## 20. Reuse Policy

The system must reuse answers when:
- the situation is equivalent,
- the pattern is repeated,
- the agent state is nearly unchanged,
- or the cluster context is stable.

The system must not resend the same request unless needed.

---

## 21. Optional AI Parallelism

Parallel AI is allowed but not mandatory.

The architecture must allow:
- parallel requests,
- parallel workers,
- parallel model calls,
- and parallel cluster processing.

But every one of these must be switchable off.

The system must still work well in non-parallel mode.

---

## 22. Non-Negotiable Constraints

- Do not send every agent request directly to AI.
- Do not ignore repeated requests.
- Do not waste budget on identical contexts.
- Do not make parallelism mandatory.
- Do not break the simulation core.
- Do not let the AI request layer take control over social dynamics.
- Do not include the final research report in this budget.

---

## 23. Final Objective

This layer should make AI support scalable, fast, and controlled.

It must:
- reduce cost,
- reduce latency,
- eliminate duplicate AI calls,
- support optional parallel execution,
- preserve the social simulation,
- and keep the system research-friendly.

The simulation must remain the main actor.

The AI request layer must remain a helper, not the society itself.