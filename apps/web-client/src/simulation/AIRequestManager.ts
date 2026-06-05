/**
 * AIRequestManager.ts — Soft Power Lab
 * ─────────────────────────────────────────────────────────────
 * Optional Parallel AI Request Manager
 * Token Budget, Deduplication, Caching, and Adaptive Routing Layer
 *
 * This layer manages AI requests from agents without touching the
 * core social simulation. The simulation remains the main actor.
 * ─────────────────────────────────────────────────────────────
 */

import type { AIConfig } from './aiRouter';
import type { Anomaly } from './agentAI';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type RequestPriority = 'critical' | 'high' | 'medium' | 'low' | 'ignore';
export type RequestStatus = 'pending' | 'batched' | 'cached' | 'sent' | 'done' | 'skipped';

export interface AIRequestSignature {
  requestType: string;
  agentCluster: string;
  stateSummary: string;
  emotionSummary: string;
  roleSummary: string;
  anomalyType: string;
  tickRange: string;
  interventionContext: string;
}

export interface AIRequest {
  id: string;
  tick: number;
  agentIds: number[];          // may grow when duplicates are merged
  signature: AIRequestSignature;
  signatureHash: string;
  priority: RequestPriority;
  status: RequestStatus;
  anomaly?: Anomaly;
  rawContext: string;
  estimatedTokens: number;
  createdAt: number;
}

export interface AIResponse {
  decision: string;
  confidence: number;
  short_reason: string;
  impact_scope: 'single' | 'cluster' | 'global';
  affected_agents: number[];
  cacheable: boolean;
  expires_after_ticks: number;
  raw?: string;
}

export interface CacheEntry {
  response: AIResponse;
  signature: AIRequestSignature;
  signatureHash: string;
  storedAt: number;     // Date.now()
  storedAtTick: number;
  hitCount: number;
}

export interface BatchGroup {
  id: string;
  requests: AIRequest[];
  combinedContext: string;
  estimatedTokens: number;
  status: RequestStatus;
}

export interface TokenBudgetState {
  totalBudget: number;
  spent: number;
  remaining: number;
  spentByCritical: number;
  spentByHigh: number;
  spentByMedium: number;
  spentByLow: number;
  skippedDueToLowBudget: number;
  cacheHits: number;
  deduplicatedCount: number;
}

export interface AIRequestManagerConfig {
  totalTokenBudget: number;          // total for session
  parallelEnabled: boolean;
  maxBatchSize: number;              // max requests per batch
  cacheMaxEntries: number;
  cacheTtlTicks: number;             // how many ticks until cache expires
  minPriorityToSend: RequestPriority; // skip below this level
  criticalBudgetReserve: number;     // tokens reserved for critical requests
}

// ─────────────────────────────────────────────────────────────
// Default config
// ─────────────────────────────────────────────────────────────

export function defaultManagerConfig(): AIRequestManagerConfig {
  return {
    totalTokenBudget: 200_000,
    parallelEnabled: false,
    maxBatchSize: 5,
    cacheMaxEntries: 200,
    cacheTtlTicks: 50,
    minPriorityToSend: 'medium',
    criticalBudgetReserve: 20_000,
  };
}

// ─────────────────────────────────────────────────────────────
// Utility: Hash
// ─────────────────────────────────────────────────────────────

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

// ─────────────────────────────────────────────────────────────
// Signature Builder
// ─────────────────────────────────────────────────────────────

function buildSignature(
  anomaly: Anomaly,
  tick: number,
  agentId: number,
): AIRequestSignature {
  const tickBucket = Math.floor(tick / 10) * 10; // group by 10-tick windows
  return {
    requestType: 'anomaly_judgment',
    agentCluster: `cluster_${Math.floor(agentId / 10)}`,  // rough cluster grouping
    stateSummary: anomaly.type,
    emotionSummary: anomaly.description.slice(0, 40),
    roleSummary: anomaly.requiresOnlineAI ? 'complex' : 'simple',
    anomalyType: anomaly.type,
    tickRange: `${tickBucket}-${tickBucket + 9}`,
    interventionContext: 'none',
  };
}

function hashSignature(sig: AIRequestSignature): string {
  return simpleHash(
    [sig.requestType, sig.agentCluster, sig.anomalyType, sig.tickRange, sig.interventionContext].join('|')
  );
}

// ─────────────────────────────────────────────────────────────
// Priority Assignment
// ─────────────────────────────────────────────────────────────

function assignPriority(anomaly: Anomaly): RequestPriority {
  if (!anomaly) return 'low';

  const criticalTypes = ['natural_emergence', 'identity_rupture', 'impossible_transition'];
  if (criticalTypes.includes(anomaly.type) || anomaly.severity >= 0.85) return 'critical';
  if (anomaly.severity >= 0.65 || anomaly.requiresOnlineAI) return 'high';
  if (anomaly.severity >= 0.40) return 'medium';
  if (anomaly.severity >= 0.20) return 'low';
  return 'ignore';
}

function priorityRank(p: RequestPriority): number {
  return { critical: 4, high: 3, medium: 2, low: 1, ignore: 0 }[p];
}

// ─────────────────────────────────────────────────────────────
// Token Estimator
// ─────────────────────────────────────────────────────────────

function estimateTokens(context: string): number {
  // Rough estimate: 1 token ≈ 4 chars
  return Math.ceil(context.length / 4) + 150; // +150 for system prompt overhead
}

// ─────────────────────────────────────────────────────────────
// Main Manager Class
// ─────────────────────────────────────────────────────────────

export class AIRequestManager {
  private config: AIRequestManagerConfig;
  private budget: TokenBudgetState;
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, AIRequest> = new Map();
  private requestHistory: AIRequest[] = [];
  private currentTick: number = 0;

  constructor(config?: Partial<AIRequestManagerConfig>) {
    this.config = { ...defaultManagerConfig(), ...config };
    this.budget = {
      totalBudget: this.config.totalTokenBudget,
      spent: 0,
      remaining: this.config.totalTokenBudget,
      spentByCritical: 0,
      spentByHigh: 0,
      spentByMedium: 0,
      spentByLow: 0,
      skippedDueToLowBudget: 0,
      cacheHits: 0,
      deduplicatedCount: 0,
    };
  }

  // ── Update current tick ──────────────────────────────────────
  public setTick(tick: number): void {
    this.currentTick = tick;
    this.evictExpiredCache();
  }

  // ── Main Entry Point: Receive and process a request ─────────
  public submitRequest(anomaly: Anomaly, agentId: number): {
    status: RequestStatus;
    response?: AIResponse;
    request: AIRequest;
  } {
    const sig = buildSignature(anomaly, this.currentTick, agentId);
    const hash = hashSignature(sig);
    const priority = assignPriority(anomaly);
    const rawContext = `[${anomaly.type}] agent=${agentId} sev=${anomaly.severity.toFixed(2)} desc=${anomaly.description}`;

    // 1. Check cache first
    const cached = this.checkCache(hash);
    if (cached) {
      this.budget.cacheHits++;
      const req = this.buildRequest(anomaly, agentId, sig, hash, priority, rawContext);
      req.status = 'cached';
      return { status: 'cached', response: cached.response, request: req };
    }

    // 2. Check for duplicate pending request
    const existing = this.pendingRequests.get(hash);
    if (existing) {
      existing.agentIds.push(agentId);
      this.budget.deduplicatedCount++;
      return { status: 'batched', request: existing };
    }

    // 3. Build new request
    const req = this.buildRequest(anomaly, agentId, sig, hash, priority, rawContext);

    // 4. Check priority threshold
    if (priorityRank(priority) < priorityRank(this.config.minPriorityToSend)) {
      req.status = 'skipped';
      return { status: 'skipped', request: req };
    }

    // 5. Check budget
    if (!this.hasBudgetFor(req)) {
      req.status = 'skipped';
      this.budget.skippedDueToLowBudget++;
      return { status: 'skipped', request: req };
    }

    // 6. Queue it
    req.status = 'pending';
    this.pendingRequests.set(hash, req);
    return { status: 'pending', request: req };
  }

  // ── Flush pending requests into batches ──────────────────────
  public buildBatches(): BatchGroup[] {
    const requests = Array.from(this.pendingRequests.values())
      .filter(r => r.status === 'pending')
      .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority)); // highest priority first

    const batches: BatchGroup[] = [];
    let batchId = 0;

    for (let i = 0; i < requests.length; i += this.config.maxBatchSize) {
      const slice = requests.slice(i, i + this.config.maxBatchSize);
      const combinedContext = slice.map(r => r.rawContext).join('\n---\n');
      const estimatedTokens = slice.reduce((s, r) => s + r.estimatedTokens, 0);

      batches.push({
        id: `batch-${this.currentTick}-${batchId++}`,
        requests: slice,
        combinedContext,
        estimatedTokens,
        status: 'pending',
      });
    }

    return batches;
  }

  // ── Apply response from AI to a batch ───────────────────────
  public applyBatchResponse(batch: BatchGroup, response: AIResponse): void {
    const tokenCost = batch.estimatedTokens;
    this.spendBudget(tokenCost, batch.requests[0]?.priority ?? 'medium');

    for (const req of batch.requests) {
      req.status = 'done';

      // Store in cache if cacheable
      if (response.cacheable) {
        this.storeCache(req.signatureHash, req.signature, response);
      }

      this.pendingRequests.delete(req.signatureHash);
      this.requestHistory.push(req);
    }
  }

  // ── Apply response to a single request ──────────────────────
  public applyResponse(req: AIRequest, response: AIResponse): void {
    const tokenCost = req.estimatedTokens;
    this.spendBudget(tokenCost, req.priority);

    req.status = 'done';

    if (response.cacheable) {
      this.storeCache(req.signatureHash, req.signature, response);
    }

    this.pendingRequests.delete(req.signatureHash);
    this.requestHistory.push(req);
  }

  // ── Budget helpers ───────────────────────────────────────────
  private hasBudgetFor(req: AIRequest): boolean {
    const reserved = this.config.criticalBudgetReserve;
    const available = req.priority === 'critical'
      ? this.budget.remaining
      : this.budget.remaining - reserved;
    return available >= req.estimatedTokens;
  }

  private spendBudget(tokens: number, priority: RequestPriority): void {
    this.budget.spent += tokens;
    this.budget.remaining = Math.max(0, this.budget.totalBudget - this.budget.spent);
    if (priority === 'critical') this.budget.spentByCritical += tokens;
    else if (priority === 'high') this.budget.spentByHigh += tokens;
    else if (priority === 'medium') this.budget.spentByMedium += tokens;
    else this.budget.spentByLow += tokens;
  }

  public addExternalTokenCost(tokens: number): void {
    this.spendBudget(tokens, 'medium');
  }

  // ── Cache helpers ────────────────────────────────────────────
  private checkCache(hash: string): CacheEntry | null {
    const entry = this.cache.get(hash);
    if (!entry) return null;

    const ageDeltaTicks = this.currentTick - entry.storedAtTick;
    if (ageDeltaTicks > this.config.cacheTtlTicks) {
      this.cache.delete(hash);
      return null;
    }

    entry.hitCount++;
    return entry;
  }

  private storeCache(hash: string, sig: AIRequestSignature, response: AIResponse): void {
    // Evict oldest entry if at capacity
    if (this.cache.size >= this.config.cacheMaxEntries) {
      const oldest = [...this.cache.entries()].sort((a, b) => a[1].storedAt - b[1].storedAt)[0];
      if (oldest) this.cache.delete(oldest[0]);
    }

    this.cache.set(hash, {
      response,
      signature: sig,
      signatureHash: hash,
      storedAt: Date.now(),
      storedAtTick: this.currentTick,
      hitCount: 0,
    });
  }

  private evictExpiredCache(): void {
    for (const [hash, entry] of this.cache.entries()) {
      if (this.currentTick - entry.storedAtTick > this.config.cacheTtlTicks) {
        this.cache.delete(hash);
      }
    }
  }

  // ── Request builder ──────────────────────────────────────────
  private buildRequest(
    anomaly: Anomaly,
    agentId: number,
    sig: AIRequestSignature,
    hash: string,
    priority: RequestPriority,
    rawContext: string,
  ): AIRequest {
    const estimated = estimateTokens(rawContext);
    return {
      id: `req-${this.currentTick}-${agentId}-${hash.slice(0, 6)}`,
      tick: this.currentTick,
      agentIds: [agentId],
      signature: sig,
      signatureHash: hash,
      priority,
      status: 'pending',
      anomaly,
      rawContext,
      estimatedTokens: estimated,
      createdAt: Date.now(),
    };
  }

  // ── Config update ────────────────────────────────────────────
  public updateConfig(partial: Partial<AIRequestManagerConfig>): void {
    this.config = { ...this.config, ...partial };
    if (partial.totalTokenBudget !== undefined) {
      const used = this.budget.spent;
      this.budget.totalBudget = partial.totalTokenBudget;
      this.budget.remaining = Math.max(0, partial.totalTokenBudget - used);
    }
  }

  // ── Reset budget (new session) ───────────────────────────────
  public resetBudget(): void {
    this.budget = {
      totalBudget: this.config.totalTokenBudget,
      spent: 0,
      remaining: this.config.totalTokenBudget,
      spentByCritical: 0,
      spentByHigh: 0,
      spentByMedium: 0,
      spentByLow: 0,
      skippedDueToLowBudget: 0,
      cacheHits: 0,
      deduplicatedCount: 0,
    };
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // ── Public getters ───────────────────────────────────────────
  public getBudget(): Readonly<TokenBudgetState> { return this.budget; }
  public getCacheSize(): number { return this.cache.size; }
  public getPendingCount(): number { return this.pendingRequests.size; }
  public getHistory(): AIRequest[] { return this.requestHistory; }
  public getConfig(): Readonly<AIRequestManagerConfig> { return this.config; }

  public isParallelEnabled(): boolean { return this.config.parallelEnabled; }
  public setParallelEnabled(val: boolean): void { this.config.parallelEnabled = val; }

  public isBudgetLow(): boolean {
    return this.budget.remaining < this.config.criticalBudgetReserve * 2;
  }

  public isBudgetEmpty(): boolean {
    return this.budget.remaining <= 0;
  }

  // ── Summary for UI ───────────────────────────────────────────
  public getSummary(): {
    budgetPercent: number;
    cacheHitRate: string;
    totalRequests: number;
    deduplicatedCount: number;
    cacheHits: number;
    skipped: number;
    parallelEnabled: boolean;
  } {
    const total = this.requestHistory.length + this.pendingRequests.size;
    const cacheHitRate = total > 0
      ? ((this.budget.cacheHits / total) * 100).toFixed(1) + '%'
      : '0%';

    return {
      budgetPercent: Math.round((this.budget.spent / this.budget.totalBudget) * 100),
      cacheHitRate,
      totalRequests: total,
      deduplicatedCount: this.budget.deduplicatedCount,
      cacheHits: this.budget.cacheHits,
      skipped: this.budget.skippedDueToLowBudget,
      parallelEnabled: this.config.parallelEnabled,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton instance — shared across the session
// ─────────────────────────────────────────────────────────────

export const globalAIRequestManager = new AIRequestManager();

// ─────────────────────────────────────────────────────────────
// Parallel Dispatcher (optional, only used when parallel=true)
// ─────────────────────────────────────────────────────────────

export async function dispatchBatchesParallel(
  batches: BatchGroup[],
  sendFn: (context: string, priority: RequestPriority) => Promise<AIResponse>,
  manager: AIRequestManager,
): Promise<void> {
  if (!manager.isParallelEnabled()) {
    // Sequential mode
    for (const batch of batches) {
      try {
        const response = await sendFn(batch.combinedContext, batch.requests[0]?.priority ?? 'medium');
        manager.applyBatchResponse(batch, response);
      } catch (_) {
        // On error, mark requests as skipped without spending budget
        for (const req of batch.requests) {
          req.status = 'skipped';
        }
      }
    }
  } else {
    // Parallel mode — fire all batches concurrently but respect budget order
    const tasks = batches.map(batch =>
      sendFn(batch.combinedContext, batch.requests[0]?.priority ?? 'medium')
        .then(response => manager.applyBatchResponse(batch, response))
        .catch(() => {
          for (const req of batch.requests) req.status = 'skipped';
        })
    );
    await Promise.allSettled(tasks);
  }
}

// ─────────────────────────────────────────────────────────────
// Helper: Build structured response from raw AI text
// ─────────────────────────────────────────────────────────────

export function parseAIResponse(rawText: string, priority: RequestPriority): AIResponse {
  // Try to extract JSON from AI response
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        decision: parsed.decision ?? 'observe',
        confidence: Number(parsed.confidence ?? 0.5),
        short_reason: parsed.short_reason ?? parsed.reason ?? 'No reason provided',
        impact_scope: parsed.impact_scope ?? 'single',
        affected_agents: parsed.affected_agents ?? [],
        cacheable: parsed.cacheable ?? (priority !== 'critical'),
        expires_after_ticks: parsed.expires_after_ticks ?? 30,
        raw: rawText,
      };
    }
  } catch (_) { /* fallthrough to text parsing */ }

  // Fallback: extract key phrases from plain text
  const lower = rawText.toLowerCase();
  const decision = lower.includes('intervene') ? 'intervene'
    : lower.includes('monitor') ? 'monitor'
    : lower.includes('ignore') ? 'ignore'
    : 'observe';

  return {
    decision,
    confidence: 0.5,
    short_reason: rawText.slice(0, 120),
    impact_scope: 'single',
    affected_agents: [],
    cacheable: priority !== 'critical',
    expires_after_ticks: 20,
    raw: rawText,
  };
}
