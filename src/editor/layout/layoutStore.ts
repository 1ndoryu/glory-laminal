import { createStore } from 'zustand/vanilla';
import { getEditorDefinition } from '../editors/registry';
import {
  createLeaf,
  joinArea as joinAreaTree,
  setRegionSize as setRegionSizeTree,
  setRegionVisible as setRegionVisibleTree,
  setSplitRatio as setSplitRatioTree,
  splitArea as splitAreaTree,
} from './layoutTree';
import type { AreaNode, RegionType, SplitOrientation } from './types';

const DEFAULT_EDITOR = 'viewport3d';

/* Regiones del editor inicial. Se declaran aquí (no desde el registro) porque el store se crea
   durante la evaluación de módulos, antes de que `boot` registre los editores. */
const DEFAULT_REGIONS: RegionType[] = ['HEADER', 'UI', 'FOOTER', 'WINDOW'];

function initialScreen(): AreaNode {
  return createLeaf(DEFAULT_EDITOR, DEFAULT_REGIONS);
}

export interface LayoutState {
  root: AreaNode;
  splitArea: (areaId: string, orientation: SplitOrientation, editorId: string) => void;
  joinArea: (areaId: string) => void;
  setSplitRatio: (splitId: string, ratio: number) => void;
  setRegionVisible: (areaId: string, region: RegionType, visible: boolean) => void;
  setRegionSize: (areaId: string, region: RegionType, size: number) => void;
}

export const layoutStore = createStore<LayoutState>()((set) => ({
  root: initialScreen(),
  splitArea: (areaId, orientation, editorId) =>
    set((state) => {
      const definition = getEditorDefinition(editorId);
      const newLeaf = createLeaf(editorId, definition.regions);
      return { root: splitAreaTree(state.root, areaId, orientation, newLeaf) };
    }),
  joinArea: (areaId) => set((state) => ({ root: joinAreaTree(state.root, areaId) })),
  setSplitRatio: (splitId, ratio) =>
    set((state) => ({ root: setSplitRatioTree(state.root, splitId, ratio) })),
  setRegionVisible: (areaId, region, visible) =>
    set((state) => ({ root: setRegionVisibleTree(state.root, areaId, region, visible) })),
  setRegionSize: (areaId, region, size) =>
    set((state) => ({ root: setRegionSizeTree(state.root, areaId, region, size) })),
}));
