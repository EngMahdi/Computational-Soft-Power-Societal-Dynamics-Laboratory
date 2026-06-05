# Task Progress: Fix Theory Toggle + Agent Export System ✅ COMPLETE

## Problems Identified:
1. **Theory toggle doesn't stop effects**: When unchecking a theory, its effects continue applying
2. **Injected agents need full data export**: Injection system didn't track or export agent data
3. **Flexible agent data export**: Need complete agent export per cycle/campaign

## Implementation Complete:

### Issue 1: Fix Theory Deactivation ✅
- [x] **scheduler.rs** - Added `EnableableTheory` wrapper with atomic `is_enabled()` flag
- [x] **scheduler.rs** - `scheduler.step()` now checks `EnableableTheory.is_enabled()` before applying
- [x] **scheduler.rs** - Added `set_theory_enabled(name, enabled)` method that propagates to the engine
- [x] **wasm.rs** - Fixed `toggle_theory()` to map JS TheoryKey ("softPower") → display name ("Soft Power") → Rust name ("Soft Power (Joseph Nye)")
- [x] **App.tsx** - Fixed JS simulation loop: theory effects now read `isTheoryOn()` from current state (not stale closure)

### Issue 2: Injection Tracking System ✅
- [x] **agent.ts** - Added `InjectionRecord` interface with pre/post snapshots + effect history
- [x] **agent.ts** - Added `injectionHistory: InjectionRecord[]` to Agent interface
- [x] **App.tsx** - `handleInject()` now creates full injection records with pre-state snapshots
- [x] **App.tsx** - Per-cycle effect logging via `injectionEffectLogRef` (every 5 ticks)
- [x] **App.tsx** - Active injection timer decrement + auto-expiry

### Issue 3: Flexible Agent Data Export ✅
- [x] **export.rs** - New `export_all_agents_full()` - all agents with complete state (mind, identity, capital, beliefs, emotions, injection history)
- [x] **export.rs** - New `export_injected_agents()` - only injected agents with full trajectory
- [x] **App.tsx** - `handleExportAllAgentsFull()` - JSON with all agents + metrics + distributions
- [x] **App.tsx** - `handleExportInjectedAgents()` - JSON with injected agents + effect history + overview
- [x] **App.tsx** - `handleExportAgentSummary()` - Text summary with pre/post state, trajectories
- [x] **ControlPanel.tsx** - 3 new export buttons: "تصدير كل الوكلاء", "تصدير المحقونين", "ملخص المحقونين"
- [x] **App.css** - Added `.btn-agent-export` styles (purple theme matching)

## Files Modified:
1. `engine/src/core/scheduler.rs` - EnableableTheory wrapper, runtime toggle support
2. `engine/src/wasm.rs` - toggle_theory name mapping, new WASM export bindings
3. `engine/src/statistics/export.rs` - Full agent + injected agent export functions
4. `apps/web-client/src/types/agent.ts` - InjectionRecord interface + injectionHistory field
5. `apps/web-client/src/App.tsx` - Theory fix, injection tracking, effect logging, 3 export handlers
6. `apps/web-client/src/components/ControlPanel.tsx` - 3 new export props + buttons
7. `apps/web-client/src/App.css` - Agent export button styles