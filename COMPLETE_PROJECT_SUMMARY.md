# 🧪 Computational Soft Power & Societal Dynamics Laboratory

> **Complete Project Summary — Version 0.1.0**
>
> Research-grade agent-based simulation platform for modeling soft power, cultural influence, social dynamics, and media manipulation.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Core Systems](#5-core-systems)
6. [14 Theories](#6-14-theories)
7. [11 Real-Time Metrics](#7-11-real-time-metrics)
8. [10 Agent States](#8-10-agent-states)
9. [Internationalization (i18n)](#9-internationalization-i18n)
10. [Simulation Engine](#10-simulation-engine)
11. [How to Run](#11-how-to-run)
12. [How to Add a New Language](#12-how-to-add-a-new-language)
13. [File Inventory](#13-file-inventory)

---

## 1. Project Overview

### Vision
This is not a simple visualization. It is a **Computational Sociology + Soft Power + Network Dynamics + Media Influence Laboratory**. The goal is to build a research-grade simulation platform capable of modeling:

- Soft power diffusion
- Cultural influence & hegemony
- Identity conflicts & polarization
- Memetic propagation & virality
- Elite influence & prestige dynamics
- Algorithmic manipulation & echo chambers
- Social fragmentation & radicalization
- Information warfare & propaganda
- Counter-cultural reactions & resistance
- Emergent societal behavior

### Core Philosophy
> The system must not simulate **who wins**.
> It must simulate **how societies evolve under competing pressures**.

- **Non-deterministic** – exposure ≠ inevitable adoption
- **Emergent behavior** – outcomes arise from agent interactions
- **Reproducible** – seed-based replay for academic validation

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   🖥️  VISUALIZATION LAYER                     │
│       React 18  ·  TypeScript  ·  HTML5 Canvas 2D            │
│       Entry:  main.tsx  →  App.tsx                            │
├─────────────────────────────────────────────────────────────┤
│  Components:  ControlPanel  │  Simulator  │  MetricsDisplay   │
│  + LanguageSwitcher  (9 languages · RTL support)              │
├─────────────────────────────────────────────────────────────┤
│                🌐  I18N / INTERNATIONALIZATION                │
│   I18nProvider (React Context)  ·  useTranslation() Hook     │
│   ar · en · pt · fa · tr · zh · hi · ru · de                 │
│   RTL auto-detection for Arabic & Persian                     │
├─────────────────────────────────────────────────────────────┤
│               ⚙️  SIMULATION STATE (React Hooks)              │
│   useSimulation()  ·  setInterval loop  ·  useState           │
│   Metrics × 11  ·  Theories × 14  ·  Sub-Tactics × 36         │
│   Agent States × 10  ·  Live Statistics                       │
├─────────────────────────────────────────────────────────────┤
│                    🧠  THEORY ENGINE                          │
│   Toggle on/off at runtime  ·  Plugin architecture            │
│   14 Theories  ·  36 Sub-Tactics with independent checkboxes  │
│   Each tactic has unique mathematical impact                  │
├─────────────────────────────────────────────────────────────┤
│                  🦀  RUST ENGINE (WASM)                       │
│   crate: soft_power_engine  ·  wasm-bindgen                  │
│   Modules: agents · core · network · media ·                 │
│   theories · statistics · events · runtime                   │
│   → JavaScript Fallback when WASM unavailable                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User clicks "Start"
      │
      ▼
App.tsx  →  setState(isRunning: true)
      │
      ├──▶ WASM world.step()  (if compiled)
      │         └── returns: tick, agentCount, 11 metrics
      │
      └──▶ JS Fallback  (sub-tactic weighted simulation)
                └── returns: tick+1, calculated metrics, agent migrations
      │
      ▼
Metrics →  Simulator (canvas)  +  MetricsDisplay (bars)  +  ControlPanel (live stats)
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Core Engine** | Rust | Speed + memory safety + WASM target |
| **Browser Runtime** | WebAssembly (wasm-bindgen) | Native-like performance in browser |
| **UI Framework** | React 18 + TypeScript | Complex reactive UI management |
| **Canvas Rendering** | HTML5 Canvas 2D | Up to 500 agents @ 60fps |
| **Graph Processing** | petgraph (Rust) | High-performance network analysis |
| **State Management** | React Hooks (useState / useEffect) | Local component state |
| **I18N** | React Context + TypeScript | Compile-time-safe translations |
| **Build Tool** | Vite 5 | Fast HMR + TypeScript out-of-box |
| **Rendering Loop** | requestAnimationFrame | Smooth 60fps canvas updates |
| **Parallelism** | rayon (Rust) + Web Workers (planned) | Multi-threaded simulation |
| **Scientific Analysis** | Python (notebooks, pandas, matplotlib) | Research workflows |
| **Data Export** | JSON / CSV / Parquet | Academic data sharing |
| **Containerization** | Docker Compose | Reproducible environments |

---

## 4. Project Structure

```
Brwsers/
│
├── engine/                              # 🦀 Rust simulation core
│   ├── Cargo.toml
│   ├── Cargo-wasm.toml
│   └── src/
│       ├── lib.rs                       # Module hub
│       ├── mod.rs
│       ├── wasm.rs                      # WASM ↔ JS bridge
│       ├── tests.rs
│       ├── agents/                      # Autonomous agent models
│       ├── core/                        # World · Scheduler
│       ├── events/                      # Event propagation bus
│       ├── media/                       # Media layer (algorithms, propaganda)
│       ├── network/                     # Social graph (petgraph)
│       ├── runtime/                     # Lifecycle management
│       ├── statistics/                  # 11 metrics + export
│       ├── theories/                    # 14 theory plugins
│       └── utils/
│
├── apps/web-client/                     # 🌐 React frontend (MAIN APP)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html                       # Entry HTML
│   └── src/
│       ├── main.tsx                     # React root + I18nProvider
│       ├── App.tsx                      # State manager + simulation loop + sub-tactic math
│       ├── App.css                      # Full application styles
│       ├── index.css                    # Global reset styles
│       ├── i18n/
│       │   ├── types.ts                 # TypeScript interfaces & type unions
│       │   ├── index.tsx                # I18nProvider + useTranslation() + RTL detection
│       │   └── locales/
│       │       ├── en.ts                # English (default/reference)
│       │       ├── ar.ts                # العربية (الفصحى) — RTL
│       │       ├── pt.ts                # Português
│       │       ├── fa.ts                # فارسی — RTL
│       │       ├── tr.ts                # Türkçe
│       │       ├── zh.ts                # 中文
│       │       ├── hi.ts                # हिन्दी
│       │       ├── ru.ts                # Русский
│       │       └── de.ts                # Deutsch
│       └── components/
│           ├── ControlPanel.tsx         # Sidebar: controls, theories, sub-tactics, legend, live stats
│           ├── Simulator.tsx            # Canvas renderer: agents + family/friend networks + HUD
│           ├── MetricsDisplay.tsx       # 11 metric bars + agent state distribution + summary table
│           └── LanguageSwitcher.tsx     # 9-language dropdown with flag emojis
│
├── apps/desktop-client/                # 🖥️ Tauri desktop app (future)
├── apps/research-console/              # 🔬 Research analytics dashboard (future)
├── python/                             # 🐍 Scientific analysis scripts
│   ├── analysis.py
│   └── requirements.txt
├── benchmarks/                         # ⚡ Performance tests
├── configs/                            # ⚙️ Configuration files
├── docs/                               # 📖 Documentation
│   └── ARCHITECTURE.html               # Visual architecture blueprint
├── tests/                              # 🧪 Integration tests
├── Makefile
├── docker-compose.yml
├── build.sh
├── read.md                             # Original vision document
├── task_progress.md                    # Task tracking
└── COMPLETE_PROJECT_SUMMARY.md         # ← THIS FILE
```

---

## 5. Core Systems

### 5.1 Simulation Loop (`App.tsx`)

The simulation runs via `setInterval` at configurable speeds:
- **Slow**: 500ms/tick
- **Normal**: 100ms/tick
- **Fast**: 50ms/tick
- **Turbo**: 10ms/tick

Each tick:
1. Checks which theories are enabled
2. For each enabled theory, checks which sub-tactics are toggled
3. Calculates 11 force vectors based on active sub-tactics
4. Applies forces to 11 metrics with randomness
5. Calculates agent migrations between 10 states based on metric values
6. Updates live statistics
7. Renders all changes

### 5.2 Sub-Tactic Calculation (Real Math)

Each sub-tactic has a unique mathematical weight. Example:

```
Soft Power → Cultural Diplomacy:     cohesion += 0.003 * activeCount
Soft Power → Educational Exchange:   belief_adoption += 0.002 * activeCount
Soft Power → Media Broadcasting:     elite_dominance += 0.002 * activeCount

Echo Chamber → Algorithmic Filtering: echo_density += 0.005 * activeCount
                                      polarization += 0.003 * activeCount

Radicalization → Grievance Amplification: polarization += 0.005 * activeCount
```

When a sub-tactic checkbox is unchecked, its weight contribution becomes zero.

### 5.3 Agent State Migration

Agents migrate between 10 states based on metric thresholds:

| Metric Driver | Target State | Rate |
|--------------|-------------|------|
| polarization + entrophy | 🔥 Extremist | 4% + 2% per tick |
| 1 - cohesion + echo | 🔒 Conservative | 3% + 2% per tick |
| belief_adoption | 🌿 Liberal | 3% per tick |
| elite_dominance | ⭐ Positive Influencer | 2% per tick |
| narrative_volatility | 💀 Negative Influencer | 2% per tick |
| resistance_strength | 🛡️ Resistant | 2.5% per tick |
| algorithmic_capture | 🧽 Gullible | 3% per tick |
| polarization + fragmentation | 📢 Activist | 2% + 2% per tick |
| echo + (1 - cohesion) | 🏝️ Isolated | 2% + 2% per tick |

Default agents start as ⚖️ **Moderate** and migrate over time.

### 5.4 Social Network Visualization (`Simulator.tsx`)

The canvas renders:
- **Family clusters** (gold dashed lines) — groups of 3-6 agents
- **Friendship pairs** (blue lines) — ~60% of agents have friends
- **Agent bodies** colored by state
- **Influencer halos** (gold for positive, purple for negative)
- **Real-time HUD** with tick, agent count, polarization%, cohesion%
- **RTL-aware HUD positioning** — shifts to right for Arabic/Persian

### 5.5 I18N System

- **React Context** based (`I18nProvider` + `useTranslation()`)
- **TypeScript-enforced** — every key is typed; missing translations cause compile errors
- **RTL auto-detection** — Arabic & Persian set `dir="rtl"` and `lang` attribute
- **localStorage persistence** — language choice survives page reloads
- **Auto-detection** — reads `navigator.language` on first visit
- **36 sub-tactic translations** per language
- **10 agent state descriptions** per language

---

## 6. 14 Theories

| # | Theory Key | English | العربية | Author | Sub-Tactics |
|:--|-----------|---------|---------|--------|:-----------:|
| 1 | softPower | Soft Power | القوة الناعمة | Joseph Nye | 3 |
| 2 | culturalHegemony | Cultural Hegemony | الهيمنة الثقافية | Gramsci | 3 |
| 3 | diffusionOfInnovations | Diffusion of Innovations | انتشار الابتكارات | Rogers | 3 |
| 4 | socialIdentity | Social Identity | الهوية الاجتماعية | Tajfel | 3 |
| 5 | spiralOfSilence | Spiral of Silence | دوامة الصمت | Noelle-Neumann | 2 |
| 6 | manufacturingConsent | Manufacturing Consent | صناعة الرضا | Chomsky | 2 |
| 7 | agendaSetting | Agenda Setting | ترتيب الأولويات | McCombs | 2 |
| 8 | networkContagion | Network Contagion | العدوى الشبكية | Centola | 3 |
| 9 | memetic | Memetic | الميمات | Dawkins | 3 |
| 10 | echoChamber | Echo Chamber | غرفة الصدى | Sunstein | 2 |
| 11 | radicalization | Radicalization | التطرف | McCauley | 2 |
| 12 | prestigeInfluence | Prestige Influence | تأثير الهيبة | Henrich | 3 |
| 13 | attentionEconomy | Attention Economy | اقتصاد الانتباه | Simon | 2 |
| 14 | algorithmicAmplification | Algorithmic Amplification | التضخيم الخوارزمي | Pariser | 3 |

**Total: 36 sub-tactics** across all theories.

### Sub-Tactic Examples (English)

| Theory | Sub-Tactic 1 | Sub-Tactic 2 | Sub-Tactic 3 |
|--------|-------------|-------------|-------------|
| Soft Power | Cultural Diplomacy | Educational Exchange | Media Broadcasting |
| Cultural Hegemony | Language Dominance | Pop Culture Export | Normalization of Values |
| Memetic | Meme Mutation | Virality Optimization | Emotional Resonance |
| Echo Chamber | Algorithmic Filtering | Confirmation Loop | — |
| Algorithmic Amplification | Recommendation Bias | Trend Boosting | Content Personalization |

---

## 7. 11 Real-Time Metrics

| # | Metric Key | English | العربية | Category |
|:--|-----------|---------|---------|---------|
| 1 | polarization | Polarization Index | مؤشر الاستقطاب | 🏛️ Social Structure |
| 2 | cohesion | Cohesion Score | درجة التماسك | 🏛️ Social Structure |
| 3 | identityFragmentation | Identity Fragmentation | تجزئة الهوية | 🏛️ Social Structure |
| 4 | resistanceStrength | Resistance Strength | قوة المقاومة | 🏛️ Social Structure |
| 5 | memeticVelocity | Memetic Velocity | سرعة الميمات | 🧬 Cultural Dynamics |
| 6 | narrativeVolatility | Narrative Volatility | تقلب السرديات | 🧬 Cultural Dynamics |
| 7 | beliefAdoption | Belief Adoption | تبني المعتقدات | 🧬 Cultural Dynamics |
| 8 | ideologicalEntropy | Ideological Entropy | الانتروبيا الأيديولوجية | 🧬 Cultural Dynamics |
| 9 | echoDensity | Echo Density | كثافة الصدى | 📡 Media & Algorithms |
| 10 | eliteDominance | Elite Dominance | هيمنة النخبة | 📡 Media & Algorithms |
| 11 | algorithmicCapture | Algorithmic Capture | الاستحواذ الخوارزمي | 📡 Media & Algorithms |

### Health Indicator
```
Health = (cohesion + (1 − polarization) + (1 − echo_density)) / 3

🟢 Healthy  > 0.7
🟡 Warning  > 0.4
🔴 Critical ≤ 0.4
```

---

## 8. 10 Agent States

| # | Key | Emoji | Arabic Name | English Description |
|:--|-----|:----:|------------|-------------------|
| 1 | extremist | 🔥 | راديكالي | Highly polarized, aggressive stance |
| 2 | conservative | 🔒 | تقليدي | Strong conviction, low openness |
| 3 | moderate | ⚖️ | متوازن | Centrist, adaptable |
| 4 | liberal | 🌿 | تقدمي | Open to change, high flexibility |
| 5 | positiveInfluencer | ⭐ | مصلح | Positive social influence |
| 6 | negativeInfluencer | 💀 | مخادع | Destructive influence, spreads toxicity |
| 7 | resistant | 🛡️ | صامد | Strong cultural immunity to manipulation |
| 8 | gullible | 🧽 | سريع التأثر | Easily influenced, low skepticism |
| 9 | activist | 📢 | ناشط | Pushes ideology actively |
| 10 | isolated | 🏝️ | منعزل | Disconnected from social networks |

### Live Statistics Display
Each state in the legend shows:
- **Icon + Name**
- **Current count** (e.g. `23`)
- **Percentage** (e.g. `(23.0%)`)
- **Mini progress bar** (color-coded)

---

## 9. Internationalization (i18n)

### Supported Languages (9)

| Locale | Language | Flag | Direction |
|--------|---------|:----:|:---------:|
| `ar` | العربية (الفصحى) | 🇸🇦 | **RTL** |
| `en` | English | 🇬🇧 | LTR |
| `pt` | Português | 🇧🇷 | LTR |
| `fa` | فارسی | 🇮🇷 | **RTL** |
| `tr` | Türkçe | 🇹🇷 | LTR |
| `zh` | 中文 | 🇨🇳 | LTR |
| `hi` | हिन्दी | 🇮🇳 | LTR |
| `ru` | Русский | 🇷🇺 | LTR |
| `de` | Deutsch | 🇩🇪 | LTR |

### Translation File Structure

```typescript
// i18n/locales/ar.ts
import type { Translations } from '../types';
export const ar: Translations = {
  app: { title: '...', subtitle: '...', ... },
  controls: { start: '▶ بدء', pause: '⏸ إيقاف مؤقت', ... },
  theories: {
    names: { softPower: 'القوة الناعمة', ... },
    subtactics: { softPower: ['الدبلوماسية الثقافية', ...], ... },
    ...
  },
  params: { ... },
  export: { ... },
  legend: {
    agentStates: { extremist: '🔥 راديكالي – مستقطب بشدة، موقف عدواني', ... },
    ...
  },
  simulator: { ... },
  metrics: { ... },
};
```

### TypeScript Compile-Time Safety

```typescript
// types.ts — any missing key causes a TypeScript error
export interface Translations {
  theories: {
    subtactics: Record<TheoryKey, string[]>;  // all 14 theories must have sub-tactics
    ...
  };
  legend: {
    agentStates: Record<AgentStateKey, string>;  // all 10 states must be translated
    ...
  };
}
```

---

## 10. Simulation Engine

### Rust Core (`engine/`)

```toml
[package]
name = "soft_power_engine"
version = "0.1.0"
edition = "2021"

[dependencies]
rand = "0.8"           # Random number generation
serde = "1.0"           # Serialization
serde_json = "1.0"      # JSON support
petgraph = "0.6"        # Graph algorithms
rayon = "1.9"           # Parallelism
wasm-bindgen = "0.2"    # WASM JavaScript binding
log = "0.4"             # Logging
thiserror = "1.0"       # Error handling

[lib]
crate-type = ["cdylib", "rlib"]  # Both WASM and native library
```

### Engine Modules

| Module | Responsibility |
|--------|---------------|
| `core/` | World state, scheduler, tick management |
| `agents/` | AgentMind (12 psychological traits), IdentityMatrix, Capital |
| `theories/` | Trait-based plugin architecture, `fn apply(&self, world: &mut World)` |
| `network/` | petgraph dynamic social graph, edge weighting, clustering |
| `media/` | Recommendation algorithms, propaganda systems, narrative warfare |
| `statistics/` | 11 metric calculations, snapshot system, CSV/JSON/Parquet export |
| `events/` | Event bus for broadcasting systemic changes |
| `runtime/` | Simulation lifecycle, concurrency, state snapshots, replay |
| `wasm.rs` | `WasmWorld` class — JS interop with getters/setters for all metrics |

### AgentMind Structure (Rust)

```rust
struct AgentMind {
    openness: f32,              // 0–1
    skepticism: f32,            // 0–1
    conformity: f32,            // 0–1
    tribalism: f32,             // 0–1
    aggression: f32,            // 0–1
    prestige_seeking: f32,      // 0–1
    fear_sensitivity: f32,      // 0–1
    emotionality: f32,          // 0–1
    cognitive_flexibility: f32, // 0–1
    ideological_rigidity: f32,  // 0–1
    attention_span: f32,        // 0–1
    trust_in_institutions: f32, // 0–1
}
```

### JavaScript Fallback

When WASM is not compiled (development mode), the simulation uses a pure JavaScript engine with the same sub-tactic weighted mathematics. All features work identically — the only difference is performance at scale.

---

## 11. How to Run

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- **Rust** (optional, for WASM engine)
- **wasm-pack** (optional, for WASM compilation)

### Quick Start (Development)

```bash
# Navigate to web client
cd apps/web-client

# Install dependencies
npm install

# Start development server
npm run dev
```

The app launches at **http://localhost:3000** (or the next available port).

### Full Build (Production)

```bash
# Build Rust engine (optional)
cd engine
cargo build --release
cargo build --release --target wasm32-unknown-unknown
wasm-bindgen target/wasm32-unknown-unknown/release/soft_power_engine.wasm \
  --out-dir ../apps/web-client/src/wasm

# Build web client
cd ../apps/web-client
npm install
npm run build

# Output: apps/web-client/dist/
```

### Using build.sh (Linux/macOS/WSL)

```bash
chmod +x build.sh
./build.sh
```

---

## 12. How to Add a New Language

1. **Copy** `apps/web-client/src/i18n/locales/en.ts` → `xx.ts`
2. **Translate** every string value to the new language
3. **Add** the locale to `Locale` type union in `types.ts`:
   ```typescript
   export type Locale = 'ar' | 'en' | ... | 'xx';
   ```
4. **Add** label in `LOCALE_LABELS`:
   ```typescript
   export const LOCALE_LABELS: Record<Locale, string> = {
     ...,
     xx: 'Language Name',
   };
   ```
5. **Add** emoji in `FLAG_EMOJI` in `LanguageSwitcher.tsx`
6. **Import** in `i18n/index.tsx`:
   ```typescript
   import { xx } from './locales/xx';
   ```
7. **Add** to `LOCALE_MAP`:
   ```typescript
   const LOCALE_MAP: Record<Locale, Translations> = { ..., xx };
   ```
8. **TypeScript will error** if any key is missing — this guarantees completeness

---

## 13. File Inventory

### Frontend (`apps/web-client/`)

| File | Lines | Purpose |
|------|:-----:|---------|
| `src/main.tsx` | 14 | React entry + I18nProvider wrapper |
| `src/App.tsx` | 195 | Full state management + simulation loop + sub-tactic math |
| `src/App.css` | 500+ | Complete application styling |
| `src/index.css` | 15 | Global reset styles |
| `src/i18n/types.ts` | 165 | TypeScript types, unions, constants |
| `src/i18n/index.tsx` | 78 | React Context Provider + useTranslation hook |
| `src/i18n/locales/en.ts` | 150 | English translations (reference) |
| `src/i18n/locales/ar.ts` | 150 | Arabic translations (الفصحى) |
| `src/i18n/locales/pt.ts` | 130 | Portuguese translations |
| `src/i18n/locales/fa.ts` | 130 | Persian translations |
| `src/i18n/locales/tr.ts` | 130 | Turkish translations |
| `src/i18n/locales/zh.ts` | 130 | Chinese translations |
| `src/i18n/locales/hi.ts` | 130 | Hindi translations |
| `src/i18n/locales/ru.ts` | 130 | Russian translations |
| `src/i18n/locales/de.ts` | 130 | German translations |
| `src/components/ControlPanel.tsx` | 180 | Sidebar: controls, theories, sub-tactics, legend, live stats |
| `src/components/Simulator.tsx` | 210 | Canvas renderer with family/friend networks |
| `src/components/MetricsDisplay.tsx` | 155 | Metric bars + agent state distribution |
| `src/components/LanguageSwitcher.tsx` | 35 | Language dropdown |

### Rust Engine (`engine/`)

| File | Purpose |
|------|---------|
| `Cargo.toml` | Package manifest, dependencies |
| `Cargo-wasm.toml` | WASM-specific configuration |
| `src/lib.rs` | Module hub, public API |
| `src/wasm.rs` | WASM ↔ JavaScript bridge |
| `src/agents/` | Agent psychology models |
| `src/core/` | World state, scheduler |
| `src/theories/` | 14 theory trait implementations |
| `src/network/` | Social graph with petgraph |
| `src/statistics/` | 11 metrics, export system |
| `src/events/` | Event bus |
| `src/runtime/` | Lifecycle, snapshots |

### Documentation

| File | Purpose |
|------|---------|
| `read.md` | Original vision & architecture blueprint |
| `docs/ARCHITECTURE.html` | Visual architecture diagram (color-coded, 9 sections) |
| `COMPLETE_PROJECT_SUMMARY.md` | ← This file |
| `task_progress.md` | Task tracking |

---

## 📊 Quick Stats

| Metric | Value |
|--------|:-----:|
| **Total Source Files** | 28 |
| **Languages Supported** | 9 |
| **Theories** | 14 |
| **Sub-Tactics** | 36 |
| **Real-Time Metrics** | 11 |
| **Agent States** | 10 |
| **Rust Engine Modules** | 10 |
| **React Components** | 4 |
| **Translation Keys** | 280+ |
| **CSS Rules** | 200+ |

---

> **🧪 Built for researchers, sociologists, and complexity scientists.**
>
> *"The system must not simulate who wins. It must simulate how societies evolve under competing pressures."*