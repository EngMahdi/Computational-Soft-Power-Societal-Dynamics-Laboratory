/* tslint:disable */
/* eslint-disable */

export class WasmWorld {
    free(): void;
    [Symbol.dispose](): void;
    export_all_agents_full(): string;
    export_csv(): string;
    export_injected_agents(): string;
    export_json(): string;
    export_summary(): string;
    get_agent_count(): number;
    get_agent_positions(): any;
    get_agent_states(): any;
    get_algorithmic_capture(): number;
    get_belief_adoption(): number;
    get_cohesion(): number;
    get_collapse_fear(): number;
    get_echo_density(): number;
    get_economic_despair_rate(): number;
    get_elite_dominance(): number;
    get_generational_divide(): number;
    get_identity_fragmentation(): number;
    get_ideological_entropy(): number;
    get_material_stress_index(): number;
    get_memetic_velocity(): number;
    get_narrative_volatility(): number;
    get_polarization(): number;
    get_resistance_strength(): number;
    get_stability_preference(): number;
    get_theories(): any;
    get_tick(): bigint;
    is_paused(): boolean;
    constructor(agent_count: number, max_ticks: bigint);
    run_full(): void;
    set_speed(speed: string): void;
    step(): void;
    toggle_pause(): void;
    toggle_theory(name: string, enabled: boolean): void;
}

export function init(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmworld_free: (a: number, b: number) => void;
    readonly wasmworld_export_all_agents_full: (a: number) => [number, number];
    readonly wasmworld_export_csv: (a: number) => [number, number];
    readonly wasmworld_export_injected_agents: (a: number) => [number, number];
    readonly wasmworld_export_json: (a: number) => [number, number];
    readonly wasmworld_export_summary: (a: number) => [number, number];
    readonly wasmworld_get_agent_count: (a: number) => number;
    readonly wasmworld_get_agent_positions: (a: number) => any;
    readonly wasmworld_get_agent_states: (a: number) => any;
    readonly wasmworld_get_algorithmic_capture: (a: number) => number;
    readonly wasmworld_get_belief_adoption: (a: number) => number;
    readonly wasmworld_get_cohesion: (a: number) => number;
    readonly wasmworld_get_collapse_fear: (a: number) => number;
    readonly wasmworld_get_echo_density: (a: number) => number;
    readonly wasmworld_get_economic_despair_rate: (a: number) => number;
    readonly wasmworld_get_elite_dominance: (a: number) => number;
    readonly wasmworld_get_generational_divide: (a: number) => number;
    readonly wasmworld_get_identity_fragmentation: (a: number) => number;
    readonly wasmworld_get_ideological_entropy: (a: number) => number;
    readonly wasmworld_get_material_stress_index: (a: number) => number;
    readonly wasmworld_get_memetic_velocity: (a: number) => number;
    readonly wasmworld_get_narrative_volatility: (a: number) => number;
    readonly wasmworld_get_polarization: (a: number) => number;
    readonly wasmworld_get_resistance_strength: (a: number) => number;
    readonly wasmworld_get_stability_preference: (a: number) => number;
    readonly wasmworld_get_theories: (a: number) => any;
    readonly wasmworld_get_tick: (a: number) => bigint;
    readonly wasmworld_is_paused: (a: number) => number;
    readonly wasmworld_new: (a: number, b: bigint) => number;
    readonly wasmworld_run_full: (a: number) => void;
    readonly wasmworld_set_speed: (a: number, b: number, c: number) => void;
    readonly wasmworld_step: (a: number) => void;
    readonly wasmworld_toggle_pause: (a: number) => void;
    readonly wasmworld_toggle_theory: (a: number, b: number, c: number, d: number) => void;
    readonly init: () => void;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
