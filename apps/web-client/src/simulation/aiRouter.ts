/**
 * aiRouter.ts — v3
 * ─────────────────────────────────────────────────────────────
 * AI routing system with full support for:
 *   - Ollama (local models: gemma, mistral, llama3...)
 *   - OpenRouter (300+ cloud models via single API key)
 *   - Gemini (Google DeepMind — gemini-2.0-flash, pro...)
 *   - OpenAI / Anthropic / Groq
 *   - Custom (OpenAI-compatible endpoint)
 * ─────────────────────────────────────────────────────────────
 */

import type { Anomaly } from './agentAI';
import {
  globalAIRequestManager,
  parseAIResponse,
  type AIRequestManagerConfig,
} from './AIRequestManager';

// ─────────────────────────────────────────────────────────────
// إعدادات المستخدم
// ─────────────────────────────────────────────────────────────

export type AIMode = 'local' | 'online' | 'auto';

export type OnlineProvider =
  | 'ollama'        // Ollama — local models (gemma, mistral, llama3...)
  | 'openrouter'    // OpenRouter — 300+ models (GPT-4o, Claude, Gemini, Mistral, DeepSeek...)
  | 'gemini'        // Google Gemini (gemini-2.0-flash, gemini-1.5-pro...)
  | 'openai'        // OpenAI GPT-4o-mini
  | 'anthropic'     // Anthropic Claude Haiku
  | 'groq'          // Groq — ultra-fast Llama3 inference
  | 'custom'        // Any OpenAI-compatible endpoint (LM Studio, Jan, vLLM...)
  | 'none';

export interface AIConfig {
  mode:                AIMode;
  provider:            OnlineProvider;
  apiKey:              string;   // For OpenAI / Anthropic / Groq
  ollamaUrl:           string;   // http://localhost:11434
  ollamaModel:         string;   // gemma4, mistral, llama3
  openrouterModel:     string;   // e.g. "openai/gpt-4o-mini" or "meta-llama/llama-3-8b-instruct:free"
  geminiModel:         string;   // e.g. "gemini-2.0-flash" or "gemini-1.5-pro"
  customUrl:           string;   // Custom endpoint
  customModel:         string;   // Custom model name
  customApiKey:        string;   // API key for custom provider
  maxCallsPerTick:     number;
  complexityThreshold: number;
  anomalySampleRate:   number;   // Fraction of agents inspected per tick (0.01–1.0)
}

export function defaultAIConfig(): AIConfig {
  return {
    mode: 'auto',
    provider: 'ollama',
    apiKey: '',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'Gemma-4my:latest',
    openrouterModel: 'meta-llama/llama-3-8b-instruct:free', // Free tier model
    geminiModel: 'gemini-2.0-flash',                        // Fast & free quota
    customUrl: '',
    customModel: '',
    customApiKey: '',
    maxCallsPerTick: 1,
    complexityThreshold: 0.30,
    anomalySampleRate: 0.10,
  };
}

// ─────────────────────────────────────────────────────────────
// سجل استدعاءات AI (مرئي للمستخدم)
// ─────────────────────────────────────────────────────────────

export interface AICallRecord {
  id:           string;
  tick:         number;
  timestamp:    number;   // Date.now()
  provider:     string;
  model:        string;
  prompt_tokens: number;  // تقدير
  duration_ms:  number;   // زمن الاستجابة
  status:       'pending' | 'success' | 'error' | 'timeout';
  result?:      AIJudgment;
  error?:       string;
  anomalyType:  string;
  agentIndex:   number;
}

// ─────────────────────────────────────────────────────────────
// أنواع المهام
// ─────────────────────────────────────────────────────────────

export type AITaskType = 'anomaly_judgment' | 'memory_summary' | 'event_reasoning' | 'role_decision';

export interface AITask {
  type:       AITaskType;
  anomaly?:   Anomaly;
  complexity: number;
  agentIndex: number;
  context:    string;
}

// ─────────────────────────────────────────────────────────────
// تقدير التعقيد
// ─────────────────────────────────────────────────────────────

export function estimateComplexity(anomaly: Anomaly): number {
  let base = anomaly.severity;
  if (anomaly.requiresOnlineAI)                   base += 0.30;
  if (anomaly.type === 'natural_emergence')        base += 0.15;
  if (anomaly.type === 'memory_inconsistency')     base += 0.20;
  if (anomaly.type === 'identity_rupture')         base += 0.10;
  return Math.min(1.0, base);
}

// ─────────────────────────────────────────────────────────────
// فحص إذا كان المزود متاحاً (Ollama أو Custom لا يحتاجان API Key)
// ─────────────────────────────────────────────────────────────

function providerIsConfigured(config: AIConfig): boolean {
  if (config.provider === 'ollama')      return true;
  if (config.provider === 'custom')      return !!config.customUrl && !!config.customModel;
  if (config.provider === 'none')        return false;
  if (config.provider === 'openrouter')  return !!config.apiKey;
  if (config.provider === 'gemini')      return !!config.apiKey;
  return !!config.apiKey; // openai / anthropic / groq
}

// ─────────────────────────────────────────────────────────────
// قرار التوجيه
// ─────────────────────────────────────────────────────────────

export type RouteDecision = 'local' | 'online' | 'skip';

export interface RoutingResult {
  decision:    RouteDecision;
  task:        AITask;
  needsAlert:  boolean;
  alertReason: string;
}

export function routeTask(anomaly: Anomaly, config: AIConfig): RoutingResult {
  const complexity = estimateComplexity(anomaly);
  const task: AITask = {
    type: 'anomaly_judgment',
    anomaly,
    complexity,
    agentIndex: anomaly.agentIndex,
    context: `${anomaly.type} | severity=${anomaly.severity.toFixed(2)} | ${anomaly.description}`,
  };

  // وضع: محلي دائماً — لا يستدعي AI خارجي أبداً
  if (config.mode === 'local') {
    if (anomaly.requiresOnlineAI && complexity > config.complexityThreshold) {
      return { decision: 'skip', task, needsAlert: true,
        alertReason: `تشوه معقد (${anomaly.type}) — يُنصح بالتبديل لوضع تلقائي مع Ollama.` };
    }
    return { decision: 'local', task, needsAlert: false, alertReason: '' };
  }

  // وضع: أونلاين دائماً
  if (config.mode === 'online') {
    if (!providerIsConfigured(config)) {
      return { decision: 'skip', task, needsAlert: true,
        alertReason: config.provider === 'ollama'
          ? 'تأكد من تشغيل Ollama على جهازك.'
          : 'مفتاح API مطلوب لهذا المزود.' };
    }
    return { decision: 'online', task, needsAlert: false, alertReason: '' };
  }

  // وضع: تلقائي — يستخدم AI عند توفر المزود وتجاوز عتبة التعقيد
  if (!providerIsConfigured(config)) {
    return { decision: 'local', task, needsAlert: complexity > 0.5,
      alertReason: `مهمة معقدة (${(complexity*100).toFixed(0)}%) — فعّل Ollama للتحليل الأعمق.` };
  }

  // AI إذا تجاوز العتبة أو طُلب صراحةً
  if (complexity >= config.complexityThreshold || anomaly.requiresOnlineAI) {
    return { decision: 'online', task, needsAlert: false, alertReason: '' };
  }

  return { decision: 'local', task, needsAlert: false, alertReason: '' };
}

// ─────────────────────────────────────────────────────────────
// التنبيهات
// ─────────────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AIAlert {
  id:        string;
  tick:      number;
  severity:  AlertSeverity;
  title:     string;
  message:   string;
  action?:   'switch_online' | 'enter_key' | 'dismiss';
  dismissed: boolean;
}

export function buildAlert(routing: RoutingResult, tick: number, onlineCount: number): AIAlert | null {
  if (!routing.needsAlert) return null;
  const anomaly = routing.task.anomaly;
  const severity: AlertSeverity = (anomaly?.severity ?? 0) > 0.7 ? 'critical' :
    (anomaly?.severity ?? 0) > 0.4 ? 'warning' : 'info';

  if (routing.alertReason.includes('Ollama') && routing.alertReason.includes('تشغيل')) {
    return { id: `alert-ollama-${tick}`, tick, severity: 'warning',
      title: 'Ollama غير متصل', message: routing.alertReason, action: 'switch_online', dismissed: false };
  }
  if (routing.alertReason.includes('مفتاح API')) {
    return { id: `alert-key-${tick}`, tick, severity: 'critical',
      title: 'مفتاح API مطلوب', message: routing.alertReason, action: 'enter_key', dismissed: false };
  }
  return { id: `alert-info-${tick}-${Math.random().toString(36).slice(2,6)}`,
    tick, severity, title: 'تنبيه AI', message: routing.alertReason, action: 'dismiss', dismissed: false };
}

export function processAnomaliesWithRouter(
  anomalies: Anomaly[], config: AIConfig, tick: number,
): { routings: RoutingResult[]; alerts: AIAlert[] } {
  const routings: RoutingResult[] = [];
  const alerts: AIAlert[] = [];
  const sorted = [...anomalies].sort((a, b) => b.severity - a.severity);
  const onlineNeeded = sorted.filter(a => a.requiresOnlineAI).length;

  for (const anomaly of sorted) {
    if (routings.length >= config.maxCallsPerTick) break;
    const result = routeTask(anomaly, config);
    routings.push(result);
    const alert = buildAlert(result, tick, onlineNeeded);
    if (alert && !alerts.find(a => a.action === alert.action)) alerts.push(alert);
  }
  return { routings, alerts };
}

// ─────────────────────────────────────────────────────────────
// فحص الاتصال
// ─────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'not_configured';

export async function checkAPIConnection(config: AIConfig): Promise<ConnectionStatus> {
  if (config.provider === 'none') return 'not_configured';
  try {
    if (config.provider === 'ollama') {
      const res = await fetch(`${config.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      return res.ok ? 'connected' : 'disconnected';
    }
    if (config.provider === 'custom') {
      if (!config.customUrl) return 'not_configured';
      const res = await fetch(config.customUrl.replace('/chat/completions', '/models'), {
        headers: config.customApiKey ? { 'Authorization': `Bearer ${config.customApiKey}` } : {},
        signal: AbortSignal.timeout(4000),
      });
      return res.status < 500 ? 'connected' : 'disconnected';
    }
    const endpoints: Record<string, string> = {
      openai:      'https://api.openai.com/v1/models',
      anthropic:   'https://api.anthropic.com/v1/models',
      groq:        'https://api.groq.com/openai/v1/models',
      openrouter:  'https://openrouter.ai/api/v1/models',
      gemini:      `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`,
    };
    const url = endpoints[config.provider];
    if (!url) return 'not_configured';
    const res = await fetch(url, {
      headers: {
        ...(config.provider !== 'gemini' ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
        ...(config.provider === 'anthropic' ? { 'anthropic-version': '2023-06-01' } : {}),
        ...(config.provider === 'openrouter' ? { 'HTTP-Referer': 'https://softpowerlab.ai', 'X-Title': 'Soft Power Lab' } : {}),
      },
      signal: AbortSignal.timeout(4000),
    });
    return res.status < 500 ? 'connected' : 'disconnected';
  } catch {
    return 'disconnected';
  }
}

// ─────────────────────────────────────────────────────────────
// AIJudgment — نتيجة التحليل من النموذج
// ─────────────────────────────────────────────────────────────

export interface AIJudgment {
  classification: 'real_emergence' | 'simulation_error' | 'numerical_artifact' | 'needs_correction';
  confidence:     number;
  severity_adjusted: number;
  suggested_action: 'correct' | 'monitor' | 'ignore';
  reasoning:        string;
}

// ─────────────────────────────────────────────────────────────
// بناء Prompt مضغوط
// ─────────────────────────────────────────────────────────────

function buildPrompt(task: AITask): string {
  const a = task.anomaly;
  if (!a) return '';
  return `You are a strict data analyzer for a social simulation. You must output ONLY a raw JSON object. Do not use markdown blocks. Do not add any conversational text before or after the JSON.

Anomaly type: ${a.type}
Agent: ${a.agentIndex === -1 ? 'SYSTEM-LEVEL' : '#' + a.agentIndex}
Severity: ${a.severity.toFixed(2)}
Details: ${a.description}
Tick: ${a.tick}

You must exactly match this JSON schema:
{
  "classification": "real_emergence|simulation_error|numerical_artifact|needs_correction",
  "confidence": 0.0,
  "severity_adjusted": 0.0,
  "suggested_action": "correct|monitor|ignore",
  "reasoning": "brief explanation"
}`;
}

// ─────────────────────────────────────────────────────────────
// استدعاء Ollama
// ─────────────────────────────────────────────────────────────

async function callOllama(config: AIConfig, prompt: string): Promise<AIJudgment> {
  const body = {
    model: config.ollamaModel,
    prompt,
    stream: false,
    // ملاحظة: بعض النماذج لا تدعم format:'json' — نتجنب إضافته للنماذج السحابية
    ...(config.ollamaModel.toLowerCase().includes('cloud') ? {} : { format: 'json' }),
    options: { temperature: 0.1, num_predict: 300 },
  };
  const res = await fetch(`${config.ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000), // 90s — لنماذج الجيجابايت التي تحتاج وقت للتحميل
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json() as { response: string };
  const raw = data.response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  // محاولة استخراج JSON من أي مكان في الاستجابة
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // إذا لم يعد جسون صحيح — نُنشئ استجابة افتراضية بدل من رمي خطأ
    return {
      classification: 'natural_emergence' as any,
      confidence: 0.3,
      severity_adjusted: 0.3,
      suggested_action: 'monitor',
      reasoning: raw.slice(0, 100) || 'Model responded without JSON structure',
    };
  }
  return JSON.parse(jsonMatch[0]) as AIJudgment;
}

// ─────────────────────────────────────────────────────────────
// استدعاء مزود OpenAI-compatible (OpenAI / Groq / Custom)
// ─────────────────────────────────────────────────────────────

async function callOpenAICompat(
  url: string, model: string, apiKey: string, prompt: string,
  extraHeaders: Record<string, string> = {},
): Promise<AIJudgment> {
  const body = {
    model,
    messages: [
      { role: 'system', content: 'Simulation anomaly analyzer. Reply JSON only. No markdown.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 250,
    response_format: { type: 'json_object' },
  };
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extraHeaders };
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? '';
  return JSON.parse(content.trim()) as AIJudgment;
}

// ─────────────────────────────────────────────────────────────
// استدعاء Anthropic
// ─────────────────────────────────────────────────────────────

async function callAnthropic(apiKey: string, prompt: string): Promise<AIJudgment> {
  const body = {
    model: 'claude-3-haiku-20240307',
    max_tokens: 300,
    system: 'Simulation anomaly analyzer. Reply valid JSON only. No markdown or text.',
    messages: [{ role: 'user', content: prompt }],
  };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json() as { content: { text: string }[] };
  const text = data.content?.[0]?.text ?? '';
  return JSON.parse(text.trim()) as AIJudgment;
}

// ─────────────────────────────────────────────────────────────
// Call Google Gemini API | استدعاء Google Gemini
// ─────────────────────────────────────────────────────────────

async function callGemini(apiKey: string, model: string, prompt: string): Promise<AIJudgment> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: 'Simulation anomaly analyzer. Reply valid JSON only. No markdown or explanatory text.' }] },
    generationConfig: { temperature: 0.1, maxOutputTokens: 300, responseMimeType: 'application/json' },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini returned non-JSON response');
  return JSON.parse(jsonMatch[0]) as AIJudgment;
}

// ─────────────────────────────────────────────────────────────
// callAI — Main entry point with visible call record | نقطة الدخول الرئيسية
// ─────────────────────────────────────────────────────────────

/**
 * Invokes the appropriate model and returns a full AICallRecord including:
 * - Actual response time (duration_ms)
 * - Call status (success / error / timeout)
 * - Full model output
 */
export async function callAI(task: AITask, config: AIConfig): Promise<AICallRecord> {
  const start = Date.now();
  const recordBase: Omit<AICallRecord, 'duration_ms' | 'status' | 'result' | 'error'> = {
    id: `call-${start}-${Math.random().toString(36).slice(2, 6)}`,
    tick: task.anomaly?.tick ?? 0,
    timestamp: start,
    provider: config.provider,
    model: config.provider === 'ollama'       ? config.ollamaModel
         : config.provider === 'openrouter'   ? config.openrouterModel
         : config.provider === 'gemini'       ? config.geminiModel
         : config.provider === 'custom'       ? config.customModel
         : config.provider === 'openai'       ? 'gpt-4o-mini'
         : config.provider === 'groq'         ? 'llama3-8b-8192'
         : 'claude-3-haiku',
    prompt_tokens: Math.floor(buildPrompt(task).length / 4),
    anomalyType: task.anomaly?.type ?? 'unknown',
    agentIndex: task.agentIndex,
  };

  const prompt = buildPrompt(task);

  try {
    let result: AIJudgment;

    switch (config.provider) {
      case 'ollama':
        result = await callOllama(config, prompt);
        break;

      case 'openrouter':
        // OpenRouter: OpenAI-compatible API — supports 300+ models
        result = await callOpenAICompat(
          'https://openrouter.ai/api/v1/chat/completions',
          config.openrouterModel,
          config.apiKey,
          prompt,
          { 'HTTP-Referer': 'https://softpowerlab.ai', 'X-Title': 'Soft Power Lab' },
        );
        break;

      case 'gemini':
        result = await callGemini(config.apiKey, config.geminiModel, prompt);
        break;

      case 'openai':
        result = await callOpenAICompat(
          'https://api.openai.com/v1/chat/completions', 'gpt-4o-mini', config.apiKey, prompt);
        break;

      case 'groq':
        result = await callOpenAICompat(
          'https://api.groq.com/openai/v1/chat/completions', 'llama3-8b-8192', config.apiKey, prompt);
        break;

      case 'anthropic':
        result = await callAnthropic(config.apiKey, prompt);
        break;

      case 'custom':
        // Custom endpoint — must be OpenAI-compatible (LM Studio, Jan, vLLM, LocalAI...)
        if (!config.customUrl || !config.customModel)
          throw new Error('customUrl and customModel are required for the custom provider');
        result = await callOpenAICompat(
          config.customUrl, config.customModel, config.customApiKey, prompt);
        break;

      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    return { ...recordBase, duration_ms: Date.now() - start, status: 'success', result };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes('timeout') || msg.includes('abort') || msg.includes('signal');
    return {
      ...recordBase,
      duration_ms: Date.now() - start,
      status: isTimeout ? 'timeout' : 'error',
      error: msg,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// اختبار اتصال حقيقي مع استجابة
// ─────────────────────────────────────────────────────────────

export async function testAIConnection(config: AIConfig): Promise<{
  success: boolean; duration_ms: number; model: string; response: string; error?: string;
}> {
  const start = Date.now();
  const modelName = config.provider === 'ollama' ? config.ollamaModel : config.customModel || 'unknown';
  const TEST_PROMPT = `Say exactly: hello from ${modelName}`;

  try {
    let raw = '';

    if (config.provider === 'ollama') {
      const res = await fetch(`${config.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.ollamaModel,
          prompt: TEST_PROMPT,
          stream: false,
          options: { num_predict: 20, temperature: 0 },
          // لا نُضيف format:'json' في اختبار الاتصال لتجنب مشاكل التوافق
        }),
        signal: AbortSignal.timeout(90000), // 90s لنماذج الـ 9GB+
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const d = await res.json() as { response: string; load_duration?: number };
      raw = d.response;
      const loadSec = d.load_duration ? (d.load_duration / 1e9).toFixed(1) : '?';
      raw = `${raw.trim()} [load: ${loadSec}s]`;
    } else if (config.provider === 'custom') {
      const res = await fetch(config.customUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.customApiKey ? { 'Authorization': `Bearer ${config.customApiKey}` } : {}),
        },
        body: JSON.stringify({
          model: config.customModel,
          messages: [{ role: 'user', content: TEST_PROMPT }],
          max_tokens: 30, temperature: 0,
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      const d = await res.json() as { choices: { message: { content: string } }[] };
      raw = d.choices?.[0]?.message?.content ?? '';
    } else {
      // For all other OpenAI-compatible and Anthropic/Gemini endpoints, we already have checkAPIConnection
      // but testAIConnection sends a real prompt using the standard callAI method.
      const testTask: AITask = {
        type: 'anomaly_judgment',
        anomaly: undefined, // undefined anomaly will trigger a simple prompt in callAI if we bypass manager
        complexity: 0,
        agentIndex: -1,
        context: TEST_PROMPT,
      };
      
      const record = await callAI(testTask, config);
      if (record.status === 'error' || record.status === 'timeout') {
         throw new Error(record.error || 'Connection failed or timed out');
      }
      
      raw = record.result?.reasoning || JSON.stringify(record.result);
    }

    return {
      success: true,
      duration_ms: Date.now() - start,
      model: modelName,
      response: raw.slice(0, 300),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      duration_ms: Date.now() - start,
      model: modelName,
      response: '',
      error: msg,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// جلب قائمة النماذج من Ollama (محلية + سحابية)
// ─────────────────────────────────────────────────────────────

export interface OllamaModelInfo {
  name:        string;   // "Gemma-4my:latest"
  displayName: string;   // "Gemma-4my"
  size_gb:     number;   // 0 = سحابي
  isCloud:     boolean;
  modified:    string;
  daysAgo?:    number;   // "منذ 3 أسابيع"
}

export async function fetchOllamaModels(ollamaUrl: string): Promise<OllamaModelInfo[]> {
  const res = await fetch(`${ollamaUrl}/api/tags`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json() as {
    models: { name: string; size?: number; modified_at?: string }[];
  };

  const now = Date.now();

  return (data.models ?? []).map(m => {
    const name        = m.name ?? '';
    const displayName = name.replace(/:latest$/, '');
    const isCloud     = name.toLowerCase().includes('cloud') || !m.size || m.size === 0;
    const size_gb     = m.size ? Math.round((m.size / 1e9) * 10) / 10 : 0;

    let modified = '';
    let daysAgo: number | undefined;
    if (m.modified_at) {
      daysAgo = Math.floor((now - new Date(m.modified_at).getTime()) / 86400000);
    }

    return { name, displayName, size_gb, isCloud, modified, daysAgo };
  });
}

// ─────────────────────────────────────────────────────────────
// callAIWithManager — الدخول الرئيسي الجديد عبر المدير
// يمر كل طلب عبر: Deduplication → Cache → Budget → Route → AI
// ─────────────────────────────────────────────────────────────

export async function callAIWithManager(
  task: AITask,
  config: AIConfig,
): Promise<AICallRecord> {
  if (!task.anomaly) {
    return callAI(task, config);
  }

  const manager = globalAIRequestManager;
  manager.setTick(task.anomaly.tick ?? 0);

  // 1. Submit to manager (handles dedup, cache, budget, priority)
  const submission = manager.submitRequest(task.anomaly, task.agentIndex);

  // 2. Cached answer → return immediately without AI call
  if (submission.status === 'cached' && submission.response) {
    const cached = submission.response;
    return {
      id: `cached-${Date.now()}`,
      tick: task.anomaly.tick ?? 0,
      timestamp: Date.now(),
      provider: 'cache',
      model: 'cache',
      prompt_tokens: 0,
      duration_ms: 0,
      status: 'success',
      result: {
        classification: (cached.decision as any) ?? 'natural_emergence',
        confidence: cached.confidence,
        severity_adjusted: task.anomaly.severity,
        suggested_action: cached.decision === 'intervene' ? 'correct' : 'monitor',
        reasoning: `[CACHE HIT] ${cached.short_reason}`,
      },
      anomalyType: task.anomaly.type,
      agentIndex: task.agentIndex,
    };
  }

  // 3. Skipped / batched → return skip record
  if (submission.status === 'skipped' || submission.status === 'batched') {
    return {
      id: `skip-${Date.now()}`,
      tick: task.anomaly.tick ?? 0,
      timestamp: Date.now(),
      provider: 'skipped',
      model: 'skipped',
      prompt_tokens: 0,
      duration_ms: 0,
      status: 'success',
      result: {
        classification: 'numerical_artifact',
        confidence: 0.3,
        severity_adjusted: task.anomaly.severity * 0.8,
        suggested_action: 'monitor',
        reasoning: submission.status === 'batched'
          ? '[DEDUPLICATED] Merged with existing batch'
          : '[SKIPPED] Low priority or budget limit',
      },
      anomalyType: task.anomaly.type,
      agentIndex: task.agentIndex,
    };
  }

  // 4. Proceed to real AI call
  const record = await callAI(task, config);

  // 5. Feed cost back to manager and cache the result
  if (record.status === 'success' && record.result) {
    const aiResp = parseAIResponse(JSON.stringify(record.result), submission.request.priority);
    manager.applyResponse(submission.request, aiResp);
  } else {
    // On failure, don't spend budget
    manager.applyResponse(submission.request, {
      decision: 'observe',
      confidence: 0,
      short_reason: record.error ?? 'error',
      impact_scope: 'single',
      affected_agents: [],
      cacheable: false,
      expires_after_ticks: 0,
    });
  }

  return record;
}

// ─────────────────────────────────────────────────────────────
// Manager config helpers (called from ControlPanel / Settings)
// ─────────────────────────────────────────────────────────────

export function updateAIManagerConfig(partial: Partial<AIRequestManagerConfig>): void {
  globalAIRequestManager.updateConfig(partial);
}

export function resetAIManagerSession(): void {
  globalAIRequestManager.resetBudget();
}

export function getAIManagerSummary() {
  return globalAIRequestManager.getSummary();
}

export function getAIManagerBudget() {
  return globalAIRequestManager.getBudget();
}

export function setAIParallelEnabled(val: boolean): void {
  globalAIRequestManager.setParallelEnabled(val);
}
