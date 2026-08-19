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

export interface EditorState {
  wireframe: boolean;
  orthographic: boolean;
  orbitMethod: OrbitMethod;
  terrain: TerrainSettings;
  /** Se incrementa en cada cambio de terreno para que los viewports reconstruyan su malla. */
  terrainNonce: number;
  toggleWireframe: () => void;
  setWireframe: (wireframe: boolean) => void;
  toggleOrthographic: () => void;
  setOrbitMethod: (method: OrbitMethod) => void;
  setTerrain: (patch: Partial<TerrainSettings>) => void;
  regenerateTerrain: () => void;
}

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
