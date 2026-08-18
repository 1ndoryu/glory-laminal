import { describe, expect, it } from 'vitest';
import { HeightmapGenerator } from './HeightmapGenerator';

const base = {
  size: 8,
  amplitude: 10,
  frequency: 3,
  octaves: 4,
  lacunarity: 2,
  gain: 0.5,
  seed: 5,
};

describe('HeightmapGenerator', () => {
  it('produce size*size alturas finitas', () => {
    const heights = new HeightmapGenerator().generate(base);
    expect(heights.length).toBe(64);
    for (const h of heights) {
      expect(Number.isFinite(h)).toBe(true);
    }
  });

  it('es determinista para la misma configuración', () => {
    const a = new HeightmapGenerator().generate(base);
    const b = new HeightmapGenerator().generate(base);
    expect(a).toEqual(b);
  });

  it('cambia con otra semilla', () => {
    const a = new HeightmapGenerator().generate(base);
    const b = new HeightmapGenerator().generate({ ...base, seed: 99 });
    expect(a).not.toEqual(b);
  });

  it('rechaza tamaños no válidos', () => {
    expect(() => new HeightmapGenerator().generate({ ...base, size: 1 })).toThrow();
    expect(() => new HeightmapGenerator().generate({ ...base, size: 8.5 })).toThrow();
  });
});
