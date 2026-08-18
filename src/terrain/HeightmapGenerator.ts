import { PerlinNoise } from './noise/PerlinNoise';
import { fbm } from './noise/fbm';

export interface HeightmapOptions {
  /** Vértices por lado (>= 2). */
  size: number;
  /** Altura máxima en unidades de mundo. */
  amplitude: number;
  /** Frecuencia base del ruido (número de octavas base a lo ancho del mapa). */
  frequency: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  seed: number;
  /** Desplazamiento en el espacio de ruido (para chunking futuro). */
  offsetX?: number;
  offsetY?: number;
}

/* Convierte parámetros de terreno en un heightmap denso (size*size alturas), determinista. */
export class HeightmapGenerator {
  generate(options: HeightmapOptions): Float32Array {
    const { size, amplitude, frequency, octaves, lacunarity, gain, seed } = options;
    if (size < 2 || !Number.isInteger(size)) {
      throw new Error('size debe ser un entero >= 2');
    }
    if (octaves < 1 || !Number.isInteger(octaves)) {
      throw new Error('octaves debe ser un entero >= 1');
    }
    const noise = new PerlinNoise(seed);
    const offsetX = options.offsetX ?? 0;
    const offsetY = options.offsetY ?? 0;
    const heights = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (frequency * (x + offsetX)) / size;
        const ny = (frequency * (y + offsetY)) / size;
        heights[y * size + x] =
          fbm(noise, nx, ny, { octaves, lacunarity, gain }) * amplitude;
      }
    }
    return heights;
  }
}
