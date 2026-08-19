import { describe, expect, it } from 'vitest';
import {
  collectLeaves,
  createLeaf,
  joinArea,
  setEditorType,
  setRegionSize,
  setRegionVisible,
  setSplitRatio,
  splitArea,
} from './layoutTree';

const regions = (['HEADER', 'WINDOW'] as const).map((type) => ({ type }));

function makeScreen() {
  return createLeaf('viewport3d', ['HEADER', 'WINDOW', 'TOOLS']);
}

describe('layoutTree', () => {
  it('crea hojas con ids únicos', () => {
    const a = createLeaf('viewport3d', ['HEADER']);
    const b = createLeaf('viewport3d', ['HEADER']);
    expect(a.id).not.toBe(b.id);
    expect(a.regions.map((r) => r.type)).toEqual(['HEADER']);
  });

  it('splitArea envuelve la hoja objetivo en un split', () => {
    const root = makeScreen();
    const leaf = collectLeaves(root)[0]!;
    const split = splitArea(root, leaf.id, 'row', createLeaf('outliner', regions.map((r) => r.type)));
    expect(split.kind).toBe('split');
    if (split.kind === 'split') {
      expect(split.ratio).toBe(0.5);
      expect(collectLeaves(split).map((l) => l.editor).sort()).toEqual([
        'outliner',
        'viewport3d',
      ]);
    }
  });

  it('splitArea no muta si el id no existe', () => {
    const root = makeScreen();
    const result = splitArea(root, 'inexistente', 'row', createLeaf('outliner', ['HEADER']));
    expect(result).toBe(root);
  });

  it('joinArea elimina el split y conserva el hermano', () => {
    const root = makeScreen();
    const leaf = collectLeaves(root)[0]!;
    const split = splitArea(root, leaf.id, 'column', createLeaf('outliner', regions.map((r) => r.type)));
    if (split.kind !== 'split') throw new Error('se esperaba un split');
    const outliner = collectLeaves(split).find((l) => l.editor === 'outliner')!;
    const joined = joinArea(split, outliner.id);
    expect(joined.kind).toBe('leaf');
    if (joined.kind === 'leaf') {
      expect(joined.id).toBe(leaf.id);
    }
  });

  it('joinArea no hace nada si el nodo no está dentro de un split', () => {
    const root = makeScreen();
    expect(joinArea(root, collectLeaves(root)[0]!.id)).toBe(root);
  });

  it('setSplitRatio clampa al rango permitido', () => {
    const root = makeScreen();
    const leaf = collectLeaves(root)[0]!;
    const split = splitArea(root, leaf.id, 'row', createLeaf('outliner', ['HEADER']));
    if (split.kind !== 'split') throw new Error('se esperaba un split');
    const high = setSplitRatio(split, split.id, 0.99);
    const low = setSplitRatio(split, split.id, 0.01);
    if (high.kind !== 'split' || low.kind !== 'split') throw new Error('se esperaba un split');
    expect(high.ratio).toBeCloseTo(0.9);
    expect(low.ratio).toBeCloseTo(0.1);
  });

  it('setRegionVisible cambia sólo la región indicada', () => {
    const root = makeScreen();
    const leaf = collectLeaves(root)[0]!;
    const updated = setRegionVisible(root, leaf.id, 'TOOLS', false);
    const region = collectLeaves(updated)[0]!.regions.find((r) => r.type === 'TOOLS')!;
    expect(region.visible).toBe(false);
  });

  it('setEditorType cambia el editor y regenera sus regiones', () => {
    const root = makeScreen();
    const leaf = collectLeaves(root)[0]!;
    const updated = setEditorType(root, leaf.id, 'outliner', ['HEADER', 'WINDOW']);
    const changed = collectLeaves(updated)[0]!;
    expect(changed.editor).toBe('outliner');
    expect(changed.regions.map((r) => r.type)).toEqual(['HEADER', 'WINDOW']);
  });

  it('setRegionSize actualiza y clampa el tamaño', () => {
    const root = makeScreen();
    const leaf = collectLeaves(root)[0]!;
    const updated = setRegionSize(root, leaf.id, 'TOOLS', 9999);
    const region = collectLeaves(updated)[0]!.regions.find((r) => r.type === 'TOOLS')!;
    expect(region.size).toBe(800);
  });
});
