import { describe, expect, it } from 'vitest';
import { buildTerrainMesh } from './TerrainMesh';

describe('buildTerrainMesh', () => {
  it('centra la cuadrícula y coloca las alturas en Z', () => {
    const size = 3;
    const heightmap = new Float32Array(size * size).fill(0);
    const mesh = buildTerrainMesh({ size, spacing: 2, heightmap, amplitude: 1 });

    expect(mesh.vertexCount).toBe(9);
    // Vértice (0,0): origen -2,-2 con altura 0.
    expect(mesh.positions[0]).toBe(-2);
    expect(mesh.positions[1]).toBe(-2);
    expect(mesh.positions[2]).toBe(0);
    // Vértice central (1,1): 0,0.
    const center = 1 * size + 1;
    expect(mesh.positions[center * 3]).toBe(0);
    expect(mesh.positions[center * 3 + 1]).toBe(0);
  });

  it('calcula normales normalizadas apuntando hacia +Z en terreno plano', () => {
    const size = 2;
    const heightmap = new Float32Array(size * size).fill(0);
    const mesh = buildTerrainMesh({ size, spacing: 1, heightmap, amplitude: 1 });
    for (let i = 0; i < mesh.vertexCount; i++) {
      expect(mesh.normals[i * 3]).toBeCloseTo(0);
      expect(mesh.normals[i * 3 + 1]).toBeCloseTo(0);
      expect(mesh.normals[i * 3 + 2]).toBeCloseTo(1);
    }
  });

  it('genera el número correcto de triángulos y aristas', () => {
    const size = 4;
    const heightmap = new Float32Array(size * size).fill(0);
    const mesh = buildTerrainMesh({ size, spacing: 1, heightmap, amplitude: 1 });
    expect(mesh.triangleCount).toBe(18);
    expect(mesh.indices.length).toBe(18 * 3);
    expect(mesh.wireframeIndices.length).toBe(18 * 4);
  });

  it('rechaza un heightmap con tamaño incorrecto', () => {
    expect(() =>
      buildTerrainMesh({ size: 3, spacing: 1, heightmap: new Float32Array(4), amplitude: 1 }),
    ).toThrow();
  });

  it('colorea por altura normalizada', () => {
    const size = 2;
    const heightmap = new Float32Array([-1, -1, 1, 1]);
    const mesh = buildTerrainMesh({ size, spacing: 1, heightmap, amplitude: 1 });
    // Bajos = agua (dominante azul), altos = nieve (casi blanco).
    expect(mesh.colors[2]).toBeGreaterThan(mesh.colors[0]!);
    expect(mesh.colors[3 * 3]).toBeGreaterThan(0.9);
  });
});
