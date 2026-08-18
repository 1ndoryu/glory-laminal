import type { PerlinNoise } from './PerlinNoise';

export interface FbmOptions {
  octaves: number;
  lacunarity?: number;
  gain?: number;
}

/* Fractal Brownian Motion: suma octavas de ruido con amplitud decreciente y frecuencia creciente.
   El resultado se normaliza por la suma de amplitudes para mantenerse aproximadamente en [-1, 1]. */
export function fbm(noise: PerlinNoise, x: number, y: number, options: FbmOptions): number {
  if (options.octaves < 1) {
    throw new Error('octaves debe ser >= 1');
  }
  let amplitude = 1;
  let frequency = 1;
  let sum = 0;
  let normalization = 0;
  for (let i = 0; i < options.octaves; i++) {
    sum += amplitude * noise.noise2(x * frequency, y * frequency);
    normalization += amplitude;
    amplitude *= options.gain ?? 0.5;
    frequency *= options.lacunarity ?? 2;
  }
  return normalization === 0 ? 0 : sum / normalization;
}
