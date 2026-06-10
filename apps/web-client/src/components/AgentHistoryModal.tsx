import React, { useState, useEffect } from 'react';
import type { InspectableAgent } from './AgentInspector';
import { callAIText, type AIConfig } from '../simulation/aiRouter';
import { Ledger } from '../simulation/research/LedgerSystem';
import { useTranslation } from '../i18n';

interface AgentHistoryModalProps {
  agent: InspectableAgent;
  aiConfig: AIConfig;
  onClose: () => void;
}

export default function AgentHistoryModal({ agent, aiConfig, onClose }: AgentHistoryModalProps) {
  const { t } = useTranslation();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localProvider, setLocalProvider] = useState<AIConfig['provider']>(aiConfig.provider);

  useEffect(() => {
    // جلب السجل من 0 إلى 999999
    const entries = Ledger.agentLedger.getTimeline(agent.id, 0, 999999);
    setTimeline(entries);
  }, [agent.id]);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const { DeepInspection } = await import('../simulation/research/DeepInspection');
      const rawText = DeepInspection.inspectAgent(agent.id, 0, 999999);
      
      let prompt = t.agentHistory.promptText.replace('{rawText}', rawText);
      prompt = prompt.replace('{openness}', (agent.mind?.openness || 0).toFixed(2));
      prompt = prompt.replace('{rigidity}', (agent.mind?.ideological_rigidity || 0).toFixed(2));
      prompt = prompt.replace('{critical_thinking}', (agent.mind?.critical_thinking || 0).toFixed(2));

      const configOverride: AIConfig = { ...aiConfig, provider: localProvider };
      const systemInst = `You are a psychological and sociological AI profiling agent. Answer strictly in your language based on the prompt. Do not use JSON formatting.`;
      
      const result = await callAIText(prompt, configOverride, systemInst);
      setAiSummary(result);
    } catch (err: any) {
      setError(err.message || t.agentHistory.errorGeneric);
    } finally {
      setIsGenerating(false);
    }
  };

  const getEmotionEmoji = (emotionArray: [string, number][]) => {
    if (!emotionArray || emotionArray.length === 0) return '😐';
    const top = emotionArray[0][0];
    switch(top) {
      case 'fear': return '😨';
      case 'anger': return '😡';
      case 'hope': return '🌟';
      case 'despair': return '🥀';
      case 'pride': return '👑';
      case 'solidarity': return '🤝';
      default: return '😐';
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: 12,
        width: '90%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
            📖 {t.agentHistory.title} #{agent.id}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* AI Section */}
          <div style={{ marginBottom: 24, padding: 16, background: '#1e1b4b', borderRadius: 8, border: '1px solid #3730a3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: aiSummary ? 12 : 0, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ color: '#a5b4fc', fontSize: 14, fontWeight: 'bold' }}>🤖 {t.agentHistory.aiAnalysis}</div>
                <select 
                  value={localProvider} 
                  onChange={e => setLocalProvider(e.target.value as AIConfig['provider'])}
                  style={{
                    background: '#0a1628', color: '#f8fafc', border: '1px solid #3730a3',
                    borderRadius: 4, padding: '2px 6px', fontSize: 11, outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="none">بدون ذكاء اصطناعي</option>
                  <option value="gemini">Gemini</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI</option>
                  <option value="groq">Groq</option>
                  <option value="ollama">Ollama (Local)</option>
                  <option value="custom">Custom Endpoint</option>
                </select>
              </div>
              {!aiSummary && (
                <button 
                  onClick={handleGenerateSummary} 
                  disabled={isGenerating}
                  style={{
                    background: '#4f46e5', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4,
                    cursor: isGenerating ? 'not-allowed' : 'pointer', fontSize: 12, opacity: isGenerating ? 0.7 : 1
                  }}>
                  {isGenerating ? t.agentHistory.generatingBtn : t.agentHistory.generateBtn}
                </button>
              )}
            </div>
            {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{error}</div>}
            {aiSummary && (
              <div style={{ color: '#e0e7ff', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {aiSummary}
              </div>
            )}
          </div>

          {/* Timeline */}
          <h3 style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 16px 0', borderBottom: '1px solid #334155', paddingBottom: 8 }}>{t.agentHistory.timelineTitle}</h3>
          {timeline.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>{t.agentHistory.noEvents}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {timeline.map((entry, idx) => {
                const emotions = Object.entries(entry.emotionsSnapshot).sort((a,b)=> (b[1] as number) - (a[1] as number)) as [string, number][];
                const emoji = getEmotionEmoji(emotions);
                return (
                  <div key={idx} style={{
                    display: 'flex', gap: 16, padding: 12, background: '#0f172a', borderRadius: 8, borderLeft: `4px solid ${entry.isKeyframe ? '#3b82f6' : '#10b981'}`
                  }}>
                    <div style={{ width: 60, flexShrink: 0, textAlign: 'center' }}>
                      <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: 14 }}>D.{entry.tick}</div>
                      <div style={{ color: '#64748b', fontSize: 11 }}>{t.agentHistory.age} {(entry.age || 0).toFixed(1)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 16 }}>{emoji}</span>
                        <span style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 14 }}>{entry.state}</span>
                      </div>
                      {entry.notes && <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>{entry.notes}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
