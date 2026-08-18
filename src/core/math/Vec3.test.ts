import { describe, expect, it } from 'vitest';
import { Vec3 } from './Vec3';

describe('Vec3', () => {
  it('calcula la longitud euclidiana', () => {
    expect(new Vec3(3, 4, 0).length()).toBe(5);
  });

  it('calcula el producto punto', () => {
    expect(new Vec3(1, 0, 0).dot(new Vec3(0, 1, 0))).toBe(0);
    expect(new Vec3(2, 3, 4).dot(new Vec3(1, 1, 1))).toBe(9);
  });

  it('normaliza a longitud 1', () => {
    expect(new Vec3(0, 3, 4).normalize().length()).toBeCloseTo(1);
  });

  it('rechaza normalizar el vector nulo', () => {
    expect(() => new Vec3().normalize()).toThrow();
  });
});
