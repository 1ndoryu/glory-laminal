import { describe, expect, it } from 'vitest';
import { PerlinNoise } from './PerlinNoise';

describe('PerlinNoise', () => {
  it('es determinista para la misma semilla', () => {
    const a = new PerlinNoise(42);
    const b = new PerlinNoise(42);
    for (let i = 0; i < 20; i++) {
      expect(a.noise2(i * 0.37, i * 0.91)).toBe(b.noise2(i * 0.37, i * 0.91));
    }
  });

  it('produce resultados distintos para semillas distintas', () => {
    const a = new PerlinNoise(1);
    const b = new PerlinNoise(2);
    expect(a.noise2(0.5, 0.5)).not.toBe(b.noise2(0.5, 0.5));
  });

  it('vale cero en los nodos enteros de la red', () => {
    const noise = new PerlinNoise(7);
    expect(noise.noise2(3, 4)).toBeCloseTo(0);
    expect(noise.noise2(-10, 6)).toBeCloseTo(0);
  });

  it('devuelve valores finitos dentro de un rango acotado', () => {
    const noise = new PerlinNoise(9);
    for (let i = 0; i < 100; i++) {
      const value = noise.noise2(i * 0.13, -i * 0.21);
      expect(Number.isFinite(value)).toBe(true);
      expect(Math.abs(value)).toBeLessThan(1.5);
    }
  });
});
