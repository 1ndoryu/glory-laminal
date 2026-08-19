import type {
  AreaNode,
  EditorArea,
  RegionState,
  RegionType,
  SplitArea,
  SplitOrientation,
} from './types';

/* Operaciones puras e inmutables sobre el árbol de layout. No tocan el DOM: así el núcleo del
   sistema de áreas/regiones es testeable y los editores sólo reaccionan al estado. */

let idCounter = 0;

export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function defaultRegionSize(type: RegionType): number {
  switch (type) {
    case 'HEADER':
      return 30;
    case 'FOOTER':
      return 24;
    case 'TOOLS':
      return 240;
    case 'UI':
      return 280;
    default:
      return 0;
  }
}

export function createLeaf(editor: string, regionTypes: RegionType[]): EditorArea {
  return {
    kind: 'leaf',
    id: nextId('area'),
    editor,
    regions: regionTypes.map((type) => ({
      id: nextId('region'),
      type,
      visible: true,
      size: defaultRegionSize(type),
    })),
  };
}

export function collectLeaves(node: AreaNode): EditorArea[] {
  if (node.kind === 'leaf') {
    return [node];
  }
  return [...collectLeaves(node.first), ...collectLeaves(node.second)];
}

export function findLeaf(node: AreaNode, id: string): EditorArea | undefined {
  if (node.kind === 'leaf') {
    return node.id === id ? node : undefined;
  }
  return findLeaf(node.first, id) ?? findLeaf(node.second, id);
}

export function containsLeaf(node: AreaNode, id: string): boolean {
  return findLeaf(node, id) !== undefined;
}

/* Sustituye la hoja `areaId` por un split cuyo segundo hijo es `newLeaf`. */
export function splitArea(
  root: AreaNode,
  areaId: string,
  orientation: SplitOrientation,
  newLeaf: EditorArea,
): AreaNode {
  if (root.kind === 'leaf') {
    if (root.id === areaId) {
      const split: SplitArea = {
        kind: 'split',
        id: nextId('split'),
        orientation,
        ratio: 0.5,
        first: root,
        second: newLeaf,
      };
      return split;
    }
    return root;
  }
  return {
    ...root,
    first: splitArea(root.first, areaId, orientation, newLeaf),
    second: splitArea(root.second, areaId, orientation, newLeaf),
  };
}

/* Cambia el tipo de editor de la hoja `areaId` y regenera sus regiones con los defaults del
   nuevo editor (equivale a cambiar de "space" en Blender). */
export function setEditorType(
  root: AreaNode,
  areaId: string,
  editorId: string,
  regionTypes: RegionType[],
): AreaNode {
  if (root.kind === 'leaf') {
    if (root.id !== areaId) {
      return root;
    }
    return {
      ...root,
      editor: editorId,
      regions: regionTypes.map((type) => ({
        id: nextId('region'),
        type,
        visible: true,
        size: defaultRegionSize(type),
      })),
    };
  }
  return {
    ...root,
    first: setEditorType(root.first, areaId, editorId, regionTypes),
    second: setEditorType(root.second, areaId, editorId, regionTypes),
  };
}

/* Elimina el split padre de la hoja `areaId` y lo reemplaza por su hermano. */
export function joinArea(root: AreaNode, areaId: string): AreaNode {
  if (root.kind === 'leaf') {
    return root;
  }
  if (containsLeaf(root.first, areaId)) {
    return root.second;
  }
  if (containsLeaf(root.second, areaId)) {
    return root.first;
  }
  return { ...root, first: joinArea(root.first, areaId), second: joinArea(root.second, areaId) };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function setSplitRatio(root: AreaNode, splitId: string, ratio: number): AreaNode {
  if (root.kind === 'split') {
    if (root.id === splitId) {
      return { ...root, ratio: clamp(ratio, 0.1, 0.9) };
    }
    return {
      ...root,
      first: setSplitRatio(root.first, splitId, ratio),
      second: setSplitRatio(root.second, splitId, ratio),
    };
  }
  return root;
}

function updateRegion(
  root: AreaNode,
  areaId: string,
  regionType: RegionType,
  updater: (region: RegionState) => RegionState,
): AreaNode {
  if (root.kind === 'leaf') {
    if (root.id !== areaId) {
      return root;
    }
    return {
      ...root,
      regions: root.regions.map((region) =>
        region.type === regionType ? updater(region) : region,
      ),
    };
  }
  return {
    ...root,
    first: updateRegion(root.first, areaId, regionType, updater),
    second: updateRegion(root.second, areaId, regionType, updater),
  };
}

export function setRegionVisible(
  root: AreaNode,
  areaId: string,
  regionType: RegionType,
  visible: boolean,
): AreaNode {
  return updateRegion(root, areaId, regionType, (region) => ({ ...region, visible }));
}

export function setRegionSize(
  root: AreaNode,
  areaId: string,
  regionType: RegionType,
  size: number,
): AreaNode {
  return updateRegion(root, areaId, regionType, (region) => ({
    ...region,
    size: clamp(size, 60, 800),
  }));
}
