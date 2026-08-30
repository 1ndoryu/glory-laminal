import { createStore } from 'zustand/vanilla';
import type { OrbitMethod } from '../camera/OrbitCamera';

export interface TerrainSettings {
  size: number;
  spacing: number;
  amplitude: number;
  octaves: number;
  frequency: number;
  seed: number;
}

/* [por que] ISP (large-interface-isp): separar estado (datos) de acciones para que
 * los consumidores dependan solo de lo que leen/llaman, no de las 11 claves. */
export interface EditorRenderState {
  wireframe: boolean;
  orthographic: boolean;
  orbitMethod: OrbitMethod;
  terrain: TerrainSettings;
  /** Se incrementa en cada cambio de terreno para que los viewports reconstruyan su malla. */
  terrainNonce: number;
}

export interface EditorActions {
  toggleWireframe: () => void;
  setWireframe: (wireframe: boolean) => void;
  toggleOrthographic: () => void;
  setOrbitMethod: (method: OrbitMethod) => void;
  setTerrain: (patch: Partial<TerrainSettings>) => void;
  regenerateTerrain: () => void;
}

export type EditorState = EditorRenderState & EditorActions;

const DEFAULT_TERRAIN: TerrainSettings = {
  size: 128,
  spacing: 1,
  amplitude: 18,
  octaves: 5,
  frequency: 3,
  seed: 1337,
};

/* Estado global del editor (compartido entre viewports): ajustes de render y de terreno.
   La posición de cada cámara es local a cada viewport; aquí sólo viven los modos globales. */
export const editorStore = createStore<EditorState>()((set) => ({
  wireframe: false,
  orthographic: false,
  orbitMethod: 'turntable',
  terrain: DEFAULT_TERRAIN,
  terrainNonce: 0,
  toggleWireframe: () => set((state) => ({ wireframe: !state.wireframe })),
  setWireframe: (wireframe) => set({ wireframe }),
  toggleOrthographic: () => set((state) => ({ orthographic: !state.orthographic })),
  setOrbitMethod: (orbitMethod) => set({ orbitMethod }),
  setTerrain: (patch) =>
    set((state) => ({
      terrain: { ...state.terrain, ...patch },
      terrainNonce: state.terrainNonce + 1,
    })),
  regenerateTerrain: () =>
    set((state) => ({
      terrain: { ...state.terrain, seed: Math.floor(Math.random() * 1_000_000) },
      terrainNonce: state.terrainNonce + 1,
    })),
}));
