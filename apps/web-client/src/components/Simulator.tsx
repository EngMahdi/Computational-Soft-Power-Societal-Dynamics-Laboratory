import { useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import type { AgentStateKey } from '../i18n/types';
import { AGENT_STATE_ORDER } from '../i18n/types';
import { ageColor } from '../types/age';

interface Metrics {
  polarization: number; cohesion: number;
  identity_fragmentation: number; memetic_velocity: number;
  elite_dominance: number; resistance_strength: number;
  echo_density: number; narrative_volatility: number;
  algorithmic_capture: number; ideological_entropy: number;
  belief_adoption: number;
}

interface SimulatorProps {
  isRunning: boolean;
  tick: number;
  agentCount: number;
  metrics: Metrics;
  agentStateCounts: Record<AgentStateKey, number>;
  onAgentClick?: (agentId: number) => void;
}

const AGENT_COLORS: Record<AgentStateKey, string> = {
  extremist: '#ff4444',
  conservative: '#e17055',
  moderate: '#74b9ff',
  liberal: '#55efc4',
  positiveInfluencer: '#ffeaa7',
  negativeInfluencer: '#6c5ce7',
  resistant: '#00b894',
  gullible: '#fdcb6e',
  activist: '#fd79a8',
  isolated: '#636e72',
};

interface AgentState {
  x: number; y: number;
  vx: number; vy: number;
  state: AgentStateKey;
  family: Set<number>;
  friends: Set<number>;
  ageGroup?: string; // for color
  hasInjection?: boolean;
}

export default function Simulator({ isRunning, tick, agentCount, metrics, agentStateCounts, onAgentClick }: SimulatorProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<AgentState[]>([]);
  const animFrameRef = useRef<number>(0);
  const initializedRef = useRef(false);

  // Build or update agents with family/friend networks
  useEffect(() => {
    // الرسم البصري يُقيّد عند 2000 — المحاكاة تعمل بالعدد الكامل
    const count = Math.min(agentCount, 2000);
    const current = agentsRef.current;

    if (current.length !== count || !initializedRef.current) {
      const ageGroups = ['teen', 'youth', 'adult', 'elder'];
      const agents: AgentState[] = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * 940 + 30,
        y: Math.random() * 540 + 30,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        state: 'moderate' as AgentStateKey,
        family: new Set<number>(),
        friends: new Set<number>(),
        ageGroup: ageGroups[Math.floor(Math.random() * ageGroups.length)],
        hasInjection: Math.random() < 0.02,
      }));

      // Create family clusters (groups of 3-6)
      for (let i = 0; i < count; i++) {
        const familySize = 3 + Math.floor(Math.random() * 4);
        const start = Math.min(i, count - familySize);
        for (let j = 0; j < familySize; j++) {
          const idx = (start + j) % count;
          if (idx !== (start + (j + 1) % familySize) % count) {
            agents[((start + j) % count)].family.add(((start + (j + 1) % familySize) % count));
          }
        }
        i += familySize - 1;
      }

      // Create friendship pairs (random)
      for (let i = 0; i < Math.floor(count * 0.6); i++) {
        const a = Math.floor(Math.random() * count);
        const b = Math.floor(Math.random() * count);
        if (a !== b) {
          agents[a].friends.add(b);
          agents[b].friends.add(a);
        }
      }

      agentsRef.current = agents;
      initializedRef.current = true;
    }
  }, [agentCount]);

  // Sync agent states from counts
  useEffect(() => {
    const agents = agentsRef.current;
    if (agents.length === 0) return;
    const total = agentCount;
    let assigned = 0;

    for (const state of AGENT_STATE_ORDER) {
      const count = agentStateCounts[state] || 0;
      const end = Math.min(assigned + count, agents.length);
      for (let i = assigned; i < end; i++) {
        agents[i].state = state;
      }
      assigned = Math.min(assigned + count, agents.length);
    }
    // remaining keep moderate
    for (let i = assigned; i < agents.length; i++) {
      agents[i].state = 'moderate';
    }
  }, [agentStateCounts, agentCount]);

  // Canvas click handler for Agent Inspector
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onAgentClick || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    const RADIUS = 10;

    const agents = agentsRef.current;
    for (let i = agents.length - 1; i >= 0; i--) {
      const a = agents[i];
      const dist = Math.hypot(mouseX - a.x, mouseY - a.y);
      if (dist < RADIUS) {
        onAgentClick(i);
        break;
      }
    }
  };

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const agents = agentsRef.current;
    const W = canvas.width;
    const H = canvas.height;

    const ageGroupColors: Record<string, string> = {
      teen: "#60a5fa",
      youth: "#34d399",
      adult: "#f59e0b",
      elder: "#a78bfa",
    };

    const render = () => {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = '#2a2a4e';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Update positions
      if (isRunning) {
        agents.forEach(a => {
          a.vx += (Math.random() - 0.5) * 0.5;
          a.vy += (Math.random() - 0.5) * 0.5;
          if (metrics.polarization > 0.5) {
            const targetX = a.state === 'extremist' || a.state === 'activist' ? 150 : a.state === 'liberal' ? 850 : W / 2;
            a.vx += (targetX - a.x) * 0.0008 * metrics.polarization;
          }
          const speed = Math.sqrt(a.vx ** 2 + a.vy ** 2);
          if (speed > 3) { a.vx = (a.vx / speed) * 3; a.vy = (a.vy / speed) * 3; }
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0) a.x = W; if (a.x > W) a.x = 0;
          if (a.y < 0) a.y = H; if (a.y > H) a.y = 0;
        });
      }

      // Draw family & friend connections — disabled above 500 for performance
      if (agents.length <= 500) {
        agents.forEach((a, i) => {
          a.family.forEach(j => {
            if (j < agents.length) {
              const b = agents[j];
              ctx.beginPath();
              ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
              ctx.setLineDash([4, 6]);
              ctx.strokeStyle = `rgba(255, 215, 0, 0.25)`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
              ctx.setLineDash([]);
            }
          });
          a.friends.forEach(j => {
            if (j < agents.length) {
              const b = agents[j];
              ctx.beginPath();
              ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(100, 180, 255, 0.18)`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          });
        });
      }

      // Draw agents — adaptive size based on count
      const dotSize = agents.length > 1000 ? 2 : agents.length > 500 ? 3 : 4;
      const showHalo = agents.length <= 500;
      agents.forEach(a => {
        const size = (showHalo && (a.state === 'positiveInfluencer' || a.state === 'negativeInfluencer')) ? 6 : dotSize;

        // Draw halo for injected agents (only when count is manageable)
        if (showHalo && a.hasInjection) {
          ctx.beginPath();
          ctx.arc(a.x, a.y, 10, 0, Math.PI * 2);
          ctx.strokeStyle = "#7c3aed";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(a.x, a.y, size, 0, Math.PI * 2);
        const ageColor = a.ageGroup ? ageGroupColors[a.ageGroup] || AGENT_COLORS[a.state] : AGENT_COLORS[a.state];
        ctx.fillStyle = ageColor;
        ctx.fill();
        if (showHalo && (a.state === 'positiveInfluencer' || a.state === 'negativeInfluencer')) {
          ctx.strokeStyle = a.state === 'positiveInfluencer' ? '#ffd93d' : '#6c5ce7';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // HUD overlay
      const hudW = 200;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, hudW, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      const dir = document.documentElement.dir;
      const tx = dir === 'rtl' ? W - hudW - 10 : 10;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(tx, 10, hudW, 80);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${t.simulator.tick}: ${tick.toLocaleString()}`, tx + 10, 28);
      ctx.fillText(`${t.simulator.agents}: ${agentCount}`, tx + 10, 44);
      ctx.fillText(`${t.simulator.polarization}: ${(metrics.polarization * 100).toFixed(1)}%`, tx + 10, 60);
      ctx.fillText(`${t.simulator.cohesion}: ${(metrics.cohesion * 100).toFixed(1)}%`, tx + 10, 76);

      animFrameRef.current = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRunning, tick, agentCount, metrics, agentStateCounts, t]);

  return (
    <div className="simulator-container">
      <h2>{t.simulator.title}</h2>
      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        onClick={handleCanvasClick}
        style={{
          border: '1px solid #444',
          borderRadius: '8px',
          width: '100%',
          height: 'auto',
          maxWidth: '1000px',
          display: 'block',
          cursor: onAgentClick ? 'crosshair' : 'default',
        }}
      />
      <p className="canvas-hint">
        {isRunning ? t.simulator.runningHint : t.simulator.stoppedHint}
      </p>
    </div>
  );
}