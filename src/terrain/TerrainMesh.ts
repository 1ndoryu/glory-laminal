import { Vec3 } from '../core/math/Vec3';
import type { MeshData } from '../render/mesh';

export interface ColorStop {
  /** Altura normalizada (relativa a la amplitud), en [-1, 1]. */
  height: number;
  color: [number, number, number];
}

export interface TerrainMeshOptions {
  /** Vértices por lado. */
  size: number;
  /** Distancia en unidades de mundo entre vértices en el plano XY. */
  spacing: number;
  /** Altura Z por vértice (size*size). */
  heightmap: Float32Array;
  /** Amplitud usada para normalizar las alturas al colorear. */
  amplitude: number;
  colorStops?: ColorStop[];
}

export interface TerrainMeshData extends MeshData {
  size: number;
  vertexCount: number;
  triangleCount: number;
}

const DEFAULT_COLOR_STOPS: ColorStop[] = [
  { height: -0.6, color: [0.12, 0.27, 0.44] }, // agua profunda
  { height: -0.15, color: [0.2, 0.42, 0.22] }, // vegetación
  { height: 0.2, color: [0.55, 0.47, 0.35] }, // tierra
  { height: 0.5, color: [0.6, 0.6, 0.63] }, // roca
  { height: 0.82, color: [0.95, 0.95, 0.98] }, // nieve
];

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function sampleColor(stops: ColorStop[], normalizedHeight: number): [number, number, number] {
  if (stops.length === 0) {
    return [1, 1, 1];
  }
  const first = stops[0]!;
  if (normalizedHeight <= first.height) {
    return first.color;
  }
  const last = stops[stops.length - 1]!;
  if (normalizedHeight >= last.height) {
    return last.color;
  }
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    if (normalizedHeight >= a.height && normalizedHeight <= b.height) {
      const span = b.height - a.height;
      const t = span === 0 ? 0 : (normalizedHeight - a.height) / span;
      return [
        lerp(a.color[0], b.color[0], t),
        lerp(a.color[1], b.color[1], t),
        lerp(a.color[2], b.color[2], t),
      ];
    }
  }
  return last.color;
}

/* Convierte un heightmap en malla: posiciones (plano XY + altura Z), normales por diferencias
   centrales, color por altura y dos juegos de índices (triángulos sólidos y aristas wireframe).
   La cuadrícula queda centrada en el origen. */
export function buildTerrainMesh(options: TerrainMeshOptions): TerrainMeshData {
  const { size, spacing, heightmap, amplitude } = options;
  if (heightmap.length !== size * size) {
    throw new Error('heightmap debe contener size*size alturas');
  }
  if (spacing <= 0) {
    throw new Error('spacing debe ser mayor que 0');
  }
  const stops = options.colorStops ?? DEFAULT_COLOR_STOPS;

  const positions = new Float32Array(size * size * 3);
  const normals = new Float32Array(size * size * 3);
  const colors = new Float32Array(size * size * 3);
  const indices = new Uint32Array((size - 1) * (size - 1) * 6);
  const wireframeIndices = new Uint32Array((size - 1) * (size - 1) * 8);

  const originX = -((size - 1) * spacing) / 2;
  const originY = -((size - 1) * spacing) / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const height = heightmap[i] ?? 0;
      positions[i * 3] = originX + x * spacing;
      positions[i * 3 + 1] = originY + y * spacing;
      positions[i * 3 + 2] = height;

      const hLeft = heightmap[y * size + Math.max(0, x - 1)] ?? 0;
      const hRight = heightmap[y * size + Math.min(size - 1, x + 1)] ?? 0;
      const hDown = heightmap[Math.max(0, y - 1) * size + x] ?? 0;
      const hUp = heightmap[Math.min(size - 1, y + 1) * size + x] ?? 0;
      const slopeX = (hLeft - hRight) / (2 * spacing);
      const slopeY = (hDown - hUp) / (2 * spacing);
      const normal = new Vec3(-slopeX, -slopeY, 1).normalize();
      normals[i * 3] = normal.x;
      normals[i * 3 + 1] = normal.y;
      normals[i * 3 + 2] = normal.z;

      const normalized = amplitude === 0 ? 0 : height / amplitude;
      const color = sampleColor(stops, normalized);
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }
  }

  let index = 0;
  let wire = 0;
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const a = y * size + x;
      const b = a + 1;
      const c = a + size;
      const d = c + 1;
      // Dos triángulos con orientación contraria a las agujas del reloj vistas desde +Z.
      indices[index++] = a;
      indices[index++] = b;
      indices[index++] = c;
      indices[index++] = b;
      indices[index++] = d;
      indices[index++] = c;
      // Cuatro aristas por celda.
      wireframeIndices[wire++] = a;
      wireframeIndices[wire++] = b;
      wireframeIndices[wire++] = b;
      wireframeIndices[wire++] = d;
      wireframeIndices[wire++] = d;
      wireframeIndices[wire++] = c;
      wireframeIndices[wire++] = c;
      wireframeIndices[wire++] = a;
    }
  }

  return {
    positions,
    normals,
    colors,
    indices,
    wireframeIndices,
    size,
    vertexCount: size * size,
    triangleCount: (size - 1) * (size - 1) * 2,
  };
}
