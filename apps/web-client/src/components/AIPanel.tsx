/**
 * AIPanel.tsx — v3
 * - قائمة منسدلة تجلب نماذج Ollama تلقائياً (محلية + سحابية)
 * - سجل استدعاءات حقيقي مع زمن الاستجابة
 * - اختبار اتصال حقيقي
 */

import { useTranslation } from '../i18n';
import { useState, useEffect, useCallback } from 'react';
import type { AIConfig, AIAlert, AICallRecord, ConnectionStatus, OllamaModelInfo } from '../simulation/aiRouter';
import { checkAPIConnection, testAIConnection, fetchOllamaModels } from '../simulation/aiRouter';
import type { Anomaly } from '../simulation/agentAI';

interface AIPanelProps {
  config:         AIConfig;
  alerts:         AIAlert[];
  anomalies:      Anomaly[];
  callHistory:    AICallRecord[];
  tick:           number;
  isRunning:      boolean;
  onConfigChange: (cfg: AIConfig) => void;
  onDismissAlert: (id: string) => void;
  onSwitchOnline: () => void;
}

const BTN_BASE: React.CSSProperties = {
  flex: 1, padding: '6px 4px', borderRadius: 6, border: '1px solid',
  cursor: 'pointer', fontSize: 11, fontWeight: 400, transition: 'all 0.2s',
};

export default function AIPanel({
  config, alerts, anomalies, callHistory, tick, isRunning,
  onConfigChange, onDismissAlert, onSwitchOnline,
}: AIPanelProps) {
  const { t } = useTranslation();
  
  const formatTimeAgo = (days?: number) => {
    if (days === undefined) return '';
    if (days < 1)   return t.timeAgo.justNow;
    if (days < 7)   return t.timeAgo.days.replace('{0}', days.toString());
    if (days < 30)  return t.timeAgo.weeks.replace('{0}', Math.floor(days/7).toString());
    if (days < 365) return t.timeAgo.months.replace('{0}', Math.floor(days/30).toString());
    return t.timeAgo.years.replace('{0}', Math.floor(days/365).toString());
  };
  const [connStatus,     setConnStatus]     = useState<ConnectionStatus>('not_configured');
  const [isCheckingConn, setIsCheckingConn] = useState(false);
  const [testResult,    setTestResult]      = useState<{
    success: boolean; duration_ms: number; model: string; response: string; error?: string;
  } | null>(null);
  const [isTestRunning, setIsTestRunning]   = useState(false);
  const [showAdvanced,  setShowAdvanced]    = useState(false);
  const [tab,           setTab]             = useState<'settings' | 'log' | 'alerts'>('settings');

  // ── حالة قائمة نماذج Ollama ──
  const [ollamaModels,     setOllamaModels]     = useState<OllamaModelInfo[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelFetchError,  setModelFetchError]  = useState('');

  // ── جلب النماذج تلقائياً عند تغيير URL ──
  const loadOllamaModels = useCallback(async () => {
    if (config.provider !== 'ollama' && config.provider !== 'custom') return;
    const url = config.provider === 'ollama' ? config.ollamaUrl : '';
    if (!url) return;

    setIsFetchingModels(true);
    setModelFetchError('');
    try {
      const models = await fetchOllamaModels(url);
      setOllamaModels(models);
      // إذا t.aiPanel.model الحالي غير موجود في القائمة — اختر الأول تلقائياً
      if (models.length > 0 && !models.find(m => m.name === config.ollamaModel)) {
        onConfigChange({ ...config, ollamaModel: models[0].name });
      }
    } catch (err) {
      setModelFetchError(err instanceof Error ? err.message : 'خطأ في جلب النماذج');
    } finally {
      setIsFetchingModels(false);
    }
  }, [config.ollamaUrl, config.provider]);

  useEffect(() => {
    if (config.provider === 'ollama') {
      const t = setTimeout(loadOllamaModels, 800);
      return () => clearTimeout(t);
    }
  }, [config.provider, config.ollamaUrl]);

  // ── فحص الاتصال ──
  const checkConn = useCallback(async () => {
    if (config.provider === 'none') { setConnStatus('not_configured'); return; }
    setIsCheckingConn(true); setConnStatus('checking');
    const s = await checkAPIConnection(config);
    setConnStatus(s); setIsCheckingConn(false);
  }, [config]);

  useEffect(() => {
    const t = setTimeout(checkConn, 600);
    return () => clearTimeout(t);
  }, [config.provider, config.apiKey, config.ollamaUrl, config.ollamaModel, config.customUrl]);

  const handleTestConnection = async () => {
    setIsTestRunning(true); setTestResult(null);
    const result = await testAIConnection(config);
    setTestResult(result); setIsTestRunning(false);
  };

  const setMode     = (m: typeof config.mode)     => onConfigChange({ ...config, mode: m });
  const setProvider = (p: typeof config.provider) => onConfigChange({ ...config, provider: p });

  const SEV_COLOR: Record<string,string> = { info:'#60a5fa', warning:'#f59e0b', critical:'#ef4444' };
  const SEV_BG:    Record<string,string> = { info:'#1e3a5f', warning:'#451a03', critical:'#450a0a' };
  const SEV_ICON:  Record<string,string> = { info:'ℹ️', warning:'⚠️', critical:'🚨' };

  const STATUS_CFG: Record<ConnectionStatus, {c:string; bg:string; dot:string; label:string}> = {
    connected:      { c:'#4ade80', bg:'#14532d', dot:'●', label:t.aiPanel.statusConnected },
    disconnected:   { c:'#ef4444', bg:'#450a0a', dot:'●', label:'غير متصل' },
    checking:       { c:'#f59e0b', bg:'#451a03', dot:'◌', label:'فحص...' },
    not_configured: { c:'#475569', bg:'#0f172a', dot:'○', label:'غير مُضبوط' },
  };
  const sc = STATUS_CFG[isCheckingConn ? 'checking' : connStatus];

  const activeAlerts  = alerts.filter(a => !a.dismissed);
  const totalCalls    = callHistory.length;
  const successCalls  = callHistory.filter(r => r.status === 'success').length;
  const avgMs         = totalCalls > 0
    ? Math.round(callHistory.slice(-5).reduce((s,r) => s + r.duration_ms, 0) / Math.min(5, totalCalls))
    : 0;

  return (
    <section style={{
      background:'#060f1e', border:'1px solid #1e3a5f', borderRadius:10,
      marginBottom:12, fontFamily:'inherit', overflow:'hidden',
    }}>

      {/* رأس اللوحة */}
      <div style={{
        display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
        background:'#0a1628', borderBottom:'1px solid #1e3a5f',
      }}>
        <span style={{fontSize:15}}>🤖</span>
        <span style={{color:'#93c5fd', fontSize:12, fontWeight:700, flex:1}}>{t.aiPanel.layerTitle}</span>
        {totalCalls > 0 && (
          <span style={{color:'#64748b', fontSize:9}}>
            {successCalls}/{totalCalls} ✓ · {avgMs}ms
          </span>
        )}
        <span style={{
          background:sc.bg, color:sc.c, fontSize:9, fontWeight:700,
          padding:'2px 7px', borderRadius:10, display:'flex', alignItems:'center', gap:3,
        }}>
          <span>{sc.dot}</span>{sc.label}
        </span>
        {activeAlerts.length > 0 && (
          <span style={{
            background:'#ef4444', color:'#fff', fontSize:9,
            width:16, height:16, borderRadius:'50%', display:'flex',
            alignItems:'center', justifyContent:'center', fontWeight:700,
          }}>{activeAlerts.length}</span>
        )}
      </div>

      {/* تبويبات */}
      <div style={{display:'flex', borderBottom:'1px solid #1e3a5f'}}>
        {(['settings','log','alerts'] as const).map(tabId => (
          <button key={tabId} onClick={() => setTab(tabId)} style={{
            flex:1, padding:'6px 4px', background:tab===tabId ? '#0f1f36' : 'none',
            color:tab===tabId ? '#93c5fd' : '#475569', border:'none',
            borderBottom:tab===tabId ? '2px solid #60a5fa' : '2px solid transparent',
            cursor:'pointer', fontSize:10, fontWeight:tab===tabId ? 700 : 400,
          }}>
            {tabId==='settings' ? `⚙️ ${t.aiPanel.settingsTab}` : tabId==='log' ? `📋 ${t.aiPanel.logTab} (${totalCalls})` : `🔔 (${activeAlerts.length})`}
          </button>
        ))}
      </div>

      <div style={{padding:12}}>

        {/* ══ تبويب Settings ══ */}
        {tab === 'settings' && (<>

          {/* t.aiPanel.inferenceMode */}
          <div style={{marginBottom:10}}>
            <div style={{color:'#64748b', fontSize:10, marginBottom:6, textTransform:'uppercase', letterSpacing:1}}>
              t.aiPanel.inferenceMode
            </div>
            <div style={{display:'flex', gap:5}}>
              {(['local','auto','online'] as const).map(m => {
                const active = config.mode === m;
                const color  = m==='local' ? '#60a5fa' : m==='online' ? '#4ade80' : '#a855f7';
                const bg     = m==='local' ? '#1e3a5f' : m==='online' ? '#14532d' : '#2d1b4e';
                return (
                  <button key={m} onClick={() => setMode(m)}
                    disabled={isRunning && !active}
                    style={{
                      ...BTN_BASE, flex:1,
                      background:active ? bg : '#0a1628',
                      borderColor:active ? color : '#1e3a5f',
                      color:active ? color : '#334155',
                      fontWeight:active ? 700 : 400,
                      opacity:isRunning && !active ? 0.4 : 1,
                    }}>
                    {m==='local' ? `🖥 ${t.aiPanel.local}` : m==='online' ? `🌐 ${t.aiPanel.online}` : `⚡ ${t.aiPanel.auto}`}
                  </button>
                );
              })}
            </div>
            <div style={{color:'#334155', fontSize:9, marginTop:4, textAlign:'center', fontStyle:'italic'}}>
              {config.mode==='local' ? t.aiPanel.localDesc
                : config.mode==='online' ? t.aiPanel.onlineDesc
                : t.aiPanel.autoDesc}
            </div>
          </div>

          {/* اختيار المزود */}
          <div style={{marginBottom:10}}>
            <div style={{color:'#64748b', fontSize:10, marginBottom:6, textTransform:'uppercase', letterSpacing:1}}>
              {t.aiPanel.providerTitle}
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:4}}>
              <ProviderCard id="ollama"       label="🖥 Ollama"       subtitle={t.aiPanel.ollamaDesc}                   selected={config.provider==='ollama'}       onClick={()=>setProvider('ollama')}       color="#4ade80" />
              <ProviderCard id="openrouter"   label="🌐 OpenRouter"   subtitle={t.aiPanel.openrouterDesc}               selected={config.provider==='openrouter'}   onClick={()=>setProvider('openrouter')}   color="#6366f1" />
              <ProviderCard id="gemini"       label="✨ Gemini"       subtitle={t.aiPanel.geminiDesc}                   selected={config.provider==='gemini'}       onClick={()=>setProvider('gemini')}       color="#60a5fa" />
              <ProviderCard id="custom"       label={`🔧 ${t.aiPanel.customProvider}`} subtitle="LM Studio / Jan / vLLM" selected={config.provider==='custom'}       onClick={()=>setProvider('custom')}       color="#f59e0b" />
              <ProviderCard id="openai"       label="🟢 OpenAI"       subtitle="GPT-4o-mini"                           selected={config.provider==='openai'}       onClick={()=>setProvider('openai')}       color="#10b981" />
              <ProviderCard id="groq"         label="⚡ Groq"         subtitle={`Llama3 (${t.aiPanel.groqDesc})`}      selected={config.provider==='groq'}         onClick={()=>setProvider('groq')}         color="#f97316" />
              <ProviderCard id="anthropic"    label="🟣 Anthropic"    subtitle="Claude Haiku"                          selected={config.provider==='anthropic'}    onClick={()=>setProvider('anthropic')}    color="#a855f7" />
            </div>
          </div>

          {/* ── إعدادات Ollama مع قائمة النماذج ── */}
          {config.provider === 'ollama' && (
            <div style={settingBox}>
              <SettingRow label={t.aiPanel.ollamaUrl}>
                <div style={{display:'flex', gap:4}}>
                  <input value={config.ollamaUrl}
                    onChange={e => onConfigChange({ ...config, ollamaUrl: e.target.value })}
                    style={{...inputStyle, flex:1}} placeholder="http://localhost:11434" />
                  <button onClick={loadOllamaModels} disabled={isFetchingModels}
                    title={t.aiPanel.refreshModels}
                    style={{
                      padding:'4px 8px', borderRadius:5, border:'1px solid #1e3a5f',
                      background:isFetchingModels ? '#451a03' : '#0a1628',
                      color:isFetchingModels ? '#f59e0b' : '#60a5fa',
                      cursor:'pointer', fontSize:11, flexShrink:0,
                    }}>
                    {isFetchingModels ? '⏳' : '🔄'}
                  </button>
                </div>
              </SettingRow>

              {/* القائمة المنسدلة للنماذج */}
              <SettingRow label={`${t.aiPanel.model} ${ollamaModels.length > 0 ? `(${ollamaModels.length} ${t.aiPanel.available})` : ''}`}>
                {isFetchingModels ? (
                  <div style={{color:'#f59e0b', fontSize:10, padding:'4px 0'}}>⏳ {t.aiPanel.fetching}</div>
                ) : modelFetchError ? (
                  <div style={{display:'flex', flexDirection:'column', gap:4}}>
                    <div style={{color:'#f87171', fontSize:9}}>{modelFetchError}</div>
                    {/* حقل نص احتياطي إذا فشل الجلب */}
                    <input value={config.ollamaModel}
                      onChange={e => onConfigChange({ ...config, ollamaModel: e.target.value })}
                      style={inputStyle} placeholder={`اكتب اسم ${t.aiPanel.model} يدوياً...`} />
                  </div>
                ) : ollamaModels.length > 0 ? (
                  <>
                    {/* القائمة المنسدلة الأساسية */}
                    <select
                      value={config.ollamaModel}
                      onChange={e => onConfigChange({ ...config, ollamaModel: e.target.value })}
                      style={{
                        ...inputStyle, cursor:'pointer',
                        appearance:'auto',
                      }}>
                      {/* تقسيم النماذج: محلية أولاً ثم سحابية */}
                      {ollamaModels.filter(m => !m.isCloud).length > 0 && (
                        <optgroup label="── نماذج محلية ──">
                          {ollamaModels.filter(m => !m.isCloud).map(m => (
                            <option key={m.name} value={m.name}>
                              {m.displayName} ({m.size_gb}GB) · {formatTimeAgo(m.daysAgo)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {ollamaModels.filter(m => m.isCloud).length > 0 && (
                        <optgroup label="── نماذج سحابية ──">
                          {ollamaModels.filter(m => m.isCloud).map(m => (
                            <option key={m.name} value={m.name}>
                              ☁ {m.displayName} · {formatTimeAgo(m.daysAgo)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>

                    {/* بطاقة معلومات t.aiPanel.model المختار */}
                    {(() => {
                      const sel = ollamaModels.find(m => m.name === config.ollamaModel);
                      if (!sel) return null;
                      return (
                        <div style={{
                          marginTop:5, padding:'5px 8px', borderRadius:5,
                          background: sel.isCloud ? '#1a1028' : '#0a1e10',
                          border: `1px solid ${sel.isCloud ? '#581c87' : '#14532d'}`,
                          display:'flex', gap:8, alignItems:'center',
                        }}>
                          <span style={{fontSize:14}}>{sel.isCloud ? '☁️' : '💾'}</span>
                          <div>
                            <div style={{color: sel.isCloud ? '#c084fc' : '#4ade80', fontSize:10, fontWeight:700}}>
                              {sel.displayName}
                            </div>
                            <div style={{color:'#475569', fontSize:9}}>
                              {sel.isCloud ? 'سحابي · استجابة قد تتأخر' : `${sel.size_gb} GB · محلي · ${sel.modified}`}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  // لا نماذج بعد — حقل يدوي
                  <div style={{display:'flex', flexDirection:'column', gap:4}}>
                    <div style={{color:'#475569', fontSize:9, fontStyle:'italic'}}>
                      اضغط 🔄 لجلب النماذج أو اكتب الاسم يدوياً:
                    </div>
                    <input value={config.ollamaModel}
                      onChange={e => onConfigChange({ ...config, ollamaModel: e.target.value })}
                      style={inputStyle} placeholder="مثال: Gemma-4my:latest" />
                  </div>
                )}
              </SettingRow>
            </div>
          )}

          {/* ── OpenRouter settings | إعدادات OpenRouter ── */}
          {config.provider === 'openrouter' && (
            <div style={settingBox}>
              <SettingRow label={t.aiPanel.model}>
                <input value={config.openrouterModel}
                  onChange={e => onConfigChange({ ...config, openrouterModel: e.target.value })}
                  style={inputStyle} placeholder="openai/gpt-4o-mini" />
                <div style={{color:'#475569', fontSize:9, marginTop:3}}>
                  {t.aiPanel.openrouterHint}
                </div>
              </SettingRow>
              <SettingRow label={t.aiPanel.apiKey}>
                <input type="password" value={config.apiKey}
                  onChange={e => onConfigChange({ ...config, apiKey: e.target.value })}
                  style={{...inputStyle, borderColor: config.apiKey ? '#6366f1' : '#ef4444'}}
                  placeholder="sk-or-v1-..." />
              </SettingRow>
              {!config.apiKey && (
                <div style={{color:'#ef4444', fontSize:9, marginTop:3}}>⚠ {t.aiPanel.apiKey} {t.aiPanel.apiKeyRequired}</div>
              )}
            </div>
          )}

          {/* ── Gemini settings | إعدادات Gemini ── */}
          {config.provider === 'gemini' && (
            <div style={settingBox}>
              <SettingRow label={t.aiPanel.model}>
                <select value={config.geminiModel}
                  onChange={e => onConfigChange({ ...config, geminiModel: e.target.value })}
                  style={{...inputStyle, cursor: 'pointer', appearance: 'auto'}}>
                  <option value="gemini-2.0-flash">gemini-2.0-flash ⚡ ({t.aiPanel.free})</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash ({t.aiPanel.free})</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro ({t.aiPanel.paid})</option>
                  <option value="gemini-2.0-pro-exp">gemini-2.0-pro-exp (experimental)</option>
                </select>
              </SettingRow>
              <SettingRow label={t.aiPanel.apiKey}>
                <input type="password" value={config.apiKey}
                  onChange={e => onConfigChange({ ...config, apiKey: e.target.value })}
                  style={{...inputStyle, borderColor: config.apiKey ? '#60a5fa' : '#ef4444'}}
                  placeholder="AIza..." />
              </SettingRow>
              {!config.apiKey && (
                <div style={{color:'#ef4444', fontSize:9, marginTop:3}}>⚠ {t.aiPanel.apiKey} {t.aiPanel.apiKeyRequired}</div>
              )}
            </div>
          )}

          {/* ── Custom provider settings | إعدادات المزود المخصص ── */}
          {config.provider === 'custom' && (
            <div style={settingBox}>
              <SettingRow label={t.aiPanel.customApiEndpoint}>
                <input value={config.customUrl}
                  onChange={e => onConfigChange({ ...config, customUrl: e.target.value })}
                  style={inputStyle} placeholder="http://localhost:1234/v1/chat/completions" />
              </SettingRow>
              <SettingRow label={`${t.aiPanel.model} ${t.aiPanel.name}`}>
                <input value={config.customModel}
                  onChange={e => onConfigChange({ ...config, customModel: e.target.value })}
                  style={inputStyle} placeholder="gemma4 / llama3.2 / ..." />
              </SettingRow>
              <SettingRow label={`${t.aiPanel.apiKey} (${t.aiPanel.optional})`}>
                <input type="password" value={config.customApiKey}
                  onChange={e => onConfigChange({ ...config, customApiKey: e.target.value })}
                  style={inputStyle} placeholder={t.aiPanel.leaveBlankIfNotRequired} />
              </SettingRow>
            </div>
          )}

          {/* ── API Key for cloud providers | مفتاح API للمزودين السحابيين ── */}
          {(config.provider==='openai' || config.provider==='anthropic' || config.provider==='groq') && (
            <div style={settingBox}>
              <SettingRow label={t.aiPanel.apiKey}>
                <input type="password" value={config.apiKey}
                  onChange={e => onConfigChange({ ...config, apiKey: e.target.value })}
                  style={{...inputStyle, borderColor:config.apiKey ? '#4ade80' : '#ef4444'}}
                  placeholder="sk-... أو api key..." />
              </SettingRow>
              {!config.apiKey && (
                <div style={{color:'#ef4444', fontSize:9, marginTop:3}}>⚠ t.aiPanel.apiKey مطلوب</div>
              )}
            </div>
          )}

          {/* ── زر اختبار حقيقي ── */}
          {(config.provider==='ollama' || config.provider==='custom') && (
            <div style={{marginBottom:10}}>
              <button onClick={handleTestConnection} disabled={isTestRunning}
                style={{
                  width:'100%', padding:'7px 8px', borderRadius:6, fontSize:11,
                  background:isTestRunning ? '#451a03' : '#14532d',
                  color:isTestRunning ? '#f59e0b' : '#4ade80',
                  border:`1px solid ${isTestRunning ? '#f59e0b' : '#4ade80'}`,
                  cursor:isTestRunning ? 'wait' : 'pointer', fontWeight:600,
                }}>
                {isTestRunning ? `⏳ ${t.aiPanel.statusChecking}` : `🧪 ${t.aiPanel.testConnection}`}
              </button>

              {testResult && (
                <div style={{
                  marginTop:6, padding:8, borderRadius:6,
                  background:testResult.success ? '#0a2010' : '#200a0a',
                  border:`1px solid ${testResult.success ? '#4ade80' : '#ef4444'}`,
                }}>
                  <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:4}}>
                    <span>{testResult.success ? '✅' : '❌'}</span>
                    <span style={{color:testResult.success ? '#4ade80' : '#ef4444', fontSize:11, fontWeight:700}}>
                      {testResult.success ? 'الاتصال ناجح!' : t.aiPanel.statusFailed}
                    </span>
                    <span style={{color:'#64748b', fontSize:10, marginLeft:'auto'}}>{testResult.duration_ms}ms</span>
                  </div>
                  <div style={{color:'#94a3b8', fontSize:9, fontFamily:'monospace'}}>
                    model: {testResult.model}
                  </div>
                  {testResult.response && (
                    <div style={{color:'#64748b', fontSize:9, fontFamily:'monospace', marginTop:3, wordBreak:'break-all'}}>
                      ↩ {testResult.response.slice(0,200)}
                    </div>
                  )}
                  {testResult.error && (
                    <div style={{color:'#f87171', fontSize:9, fontFamily:'monospace', marginTop:3}}>
                      ✗ {testResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* إعدادات متقدمة */}
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              width:'100%', padding:'4px 8px', borderRadius:5, fontSize:10,
              background:'none', color:'#475569', border:'1px solid #1e3a5f',
              cursor:'pointer', display:'flex', justifyContent:'space-between',
            }}>
            <span>⚙️ {t.aiPanel.advancedSettings}</span>
            <span>{showAdvanced ? '▲' : '▼'}</span>
          </button>

          {showAdvanced && (
            <div style={{marginTop:6, display:'flex', flexDirection:'column', gap:6}}>
              <SliderField label="عتبة التعقيد لاستدعاء AI"
                value={config.complexityThreshold} min={0.1} max={1.0} step={0.05}
                onChange={v => onConfigChange({...config, complexityThreshold:v})}
                formatVal={v => `${(v*100).toFixed(0)}%`} />
              <SliderField label="نسبة الوكلاء المفحوصين / Tick"
                value={config.anomalySampleRate} min={0.01} max={0.5} step={0.01}
                onChange={v => onConfigChange({...config, anomalySampleRate:v})}
                formatVal={v => `${(v*100).toFixed(0)}%`} />
              <SliderField label="الحد الأقصى للاستدعاءات / Tick"
                value={config.maxCallsPerTick} min={1} max={5} step={1}
                onChange={v => onConfigChange({...config, maxCallsPerTick:Math.round(v)})}
                formatVal={v => `${Math.round(v)}`} />
            </div>
          )}
        </>)}

        {/* ══ تبويب السجل ══ */}
        {tab === 'log' && (
          <div>
            {callHistory.length === 0 ? (
              <div style={{color:'#334155', fontSize:11, textAlign:'center', padding:'20px 0'}}>
                <div style={{fontSize:24, marginBottom:8}}>🤖</div>
                <div>لا توجد استدعاءات بعد.</div>
                <div style={{fontSize:10, marginTop:4, color:'#1e3a5f'}}>
                  {config.mode==='local'
                    ? 'غيّر الوضع إلى "تلقائي" لبدء استدعاء AI'
                    : 'تشغيل المحاكاة سيبدأ التحليل'}
                </div>
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:4, maxHeight:300, overflowY:'auto'}}>
                {callHistory.slice().reverse().map(record => (
                  <CallRecordRow key={record.id} record={record} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ تبويب التنبيهات ══ */}
        {tab === 'alerts' && (
          <div>
            {activeAlerts.length === 0 ? (
              <div style={{color:'#334155', fontSize:11, textAlign:'center', padding:'16px 0'}}>
                لا توجد تنبيهات نشطة ✓
              </div>
            ) : activeAlerts.map(alert => (
              <div key={alert.id} style={{
                background:SEV_BG[alert.severity], border:`1px solid ${SEV_COLOR[alert.severity]}`,
                borderRadius:7, padding:'8px 10px', marginBottom:6, display:'flex', gap:8,
              }}>
                <span style={{fontSize:13, flexShrink:0}}>{SEV_ICON[alert.severity]}</span>
                <div style={{flex:1}}>
                  <div style={{color:SEV_COLOR[alert.severity], fontSize:11, fontWeight:700, marginBottom:2}}>
                    {alert.title}
                  </div>
                  <div style={{color:'#cbd5e1', fontSize:10, lineHeight:1.5, marginBottom:4}}>
                    {alert.message}
                  </div>
                  <div style={{display:'flex', gap:5}}>
                    {alert.action==='switch_online' && (
                      <button onClick={() => { onSwitchOnline(); onDismissAlert(alert.id); }}
                        style={{fontSize:9, padding:'2px 7px', borderRadius:4,
                          background:'#14532d', color:'#4ade80', border:'1px solid #4ade80', cursor:'pointer'}}>
                        🌐 تبديل للأونلاين
                      </button>
                    )}
                    <button onClick={() => onDismissAlert(alert.id)}
                      style={{fontSize:9, padding:'2px 7px', borderRadius:4,
                        background:'none', color:'#475569', border:'1px solid #334155', cursor:'pointer'}}>
                      تجاهل
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* شريط الحالة السفلي */}
      {totalCalls > 0 && (
        <div style={{
          background:'#0a1628', borderTop:'1px solid #1e3a5f',
          padding:'4px 12px', display:'flex', gap:12, justifyContent:'space-between',
        }}>
          <StatMini label="استدعاء" value={totalCalls} color="#60a5fa" />
          <StatMini label="ناجح"   value={`${successCalls} (${totalCalls>0 ? ((successCalls/totalCalls)*100).toFixed(0) : 0}%)`} color="#4ade80" />
          <StatMini label="متوسط"  value={`${avgMs}ms`} color="#f59e0b" />
          <StatMini label="تشوهات" value={anomalies.length} color="#f87171" />
        </div>
      )}
    </section>
  );
}

// ── صف سجل استدعاء ──────────────────────────────────────────

function CallRecordRow({ record }: { record: AICallRecord }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const STATUS_ICON  = { pending:'⏳', success:'✅', error:'❌', timeout:'⌛' };
  const STATUS_COLOR = { pending:'#f59e0b', success:'#4ade80', error:'#ef4444', timeout:'#f97316' };

  return (
    <div style={{
      background:'#0a1628', border:'1px solid #1e3a5f', borderRadius:6,
      padding:'6px 8px', cursor:'pointer',
    }} onClick={() => setExpanded(!expanded)}>
      <div style={{display:'flex', alignItems:'center', gap:6}}>
        <span style={{fontSize:11}}>{STATUS_ICON[record.status]}</span>
        <span style={{color:STATUS_COLOR[record.status], fontSize:10, fontWeight:700, flex:1}}>
          {record.provider}/{record.model}
        </span>
        <span style={{color:'#64748b', fontSize:9}}>T{record.tick}</span>
        <span style={{color:record.status==='success' ? '#4ade80' : '#ef4444', fontSize:9, fontWeight:700}}>
          {record.duration_ms}ms
        </span>
      </div>
      <div style={{color:'#334155', fontSize:9, marginTop:2}}>
        {record.anomalyType} · وكيل #{record.agentIndex===-1 ? 'SYS' : record.agentIndex}
      </div>
      {expanded && (
        <div style={{marginTop:6, padding:6, background:'#060f1e', borderRadius:4, fontFamily:'monospace', fontSize:9}}>
          {record.status==='success' && record.result && (<>
            <div style={{color:'#60a5fa'}}>class: {record.result.classification}</div>
            <div style={{color:'#4ade80'}}>action: {record.result.suggested_action}</div>
            <div style={{color:'#f59e0b'}}>conf: {(record.result.confidence*100).toFixed(0)}%</div>
            <div style={{color:'#94a3b8', marginTop:3, lineHeight:1.4}}>💬 {record.result.reasoning}</div>
          </>)}
          {record.error && <div style={{color:'#f87171'}}>✗ {record.error}</div>}
        </div>
      )}
    </div>
  );
}

// ── مكونات مساعدة ────────────────────────────────────────────

function ProviderCard({ id, label, subtitle, selected, onClick, color }: {
  id:string; label:string; subtitle:string; selected:boolean; onClick:()=>void; color:string;
}) {
  return (
    <button id={`provider-${id}`} onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
      borderRadius:6, border:`1px solid ${selected ? color : '#1e3a5f'}`,
      background:selected ? color+'18' : '#0a1628',
      cursor:'pointer', textAlign:'left', width:'100%', transition:'all 0.15s',
    }}>
      <div style={{
        width:8, height:8, borderRadius:'50%',
        background:selected ? color : '#1e3a5f', flexShrink:0,
        boxShadow:selected ? `0 0 6px ${color}` : 'none',
      }} />
      <div>
        <div style={{color:selected ? color : '#94a3b8', fontSize:11, fontWeight:selected ? 700 : 400}}>
          {label}
        </div>
        <div style={{color:'#475569', fontSize:9}}>{subtitle}</div>
      </div>
    </button>
  );
}

const settingBox: React.CSSProperties = {
  background:'#0a1628', border:'1px solid #1e3a5f', borderRadius:6, padding:10, marginBottom:10,
};

const inputStyle: React.CSSProperties = {
  width:'100%', background:'#060f1e', color:'#e2e8f0',
  border:'1px solid #1e3a5f', borderRadius:5, padding:'4px 8px', fontSize:11,
  boxSizing:'border-box',
};

function SettingRow({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div style={{marginBottom:6}}>
      <div style={{color:'#64748b', fontSize:10, marginBottom:3}}>{label}</div>
      {children}
    </div>
  );
}

function SliderField({ label, value, min, max, step, onChange, formatVal }: {
  label:string; value:number; min:number; max:number;
  step:number; onChange:(v:number)=>void; formatVal:(v:number)=>string;
}) {
  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
        <span style={{color:'#64748b', fontSize:10}}>{label}</span>
        <span style={{color:'#93c5fd', fontSize:10, fontWeight:700}}>{formatVal(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{width:'100%', accentColor:'#60a5fa', height:3}} />
    </div>
  );
}

function StatMini({ label, value, color }: { label:string; value:string|number; color:string }) {
  return (
    <div style={{display:'flex', gap:3, alignItems:'baseline'}}>
      <span style={{color, fontSize:10, fontWeight:700}}>{value}</span>
      <span style={{color:'#334155', fontSize:8}}>{label}</span>
    </div>
  );
}
