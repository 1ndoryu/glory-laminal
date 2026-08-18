/* Ruido de Perlin 2D clásico (gradientes), determinista por semilla. La permutación se deriva
   de mulberry32 para que la misma semilla produzca exactamente la misma malla en cualquier máquina. */
export class PerlinNoise {
  private readonly perm: Uint8Array;

  constructor(seed = 0) {
    this.perm = PerlinNoise.buildPermutation(seed);
  }

  private static buildPermutation(seed: number): Uint8Array {
    const source = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      source[i] = i;
    }
    const rand = PerlinNoise.mulberry32(seed >>> 0);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const a = source[i] ?? 0;
      const b = source[j] ?? 0;
      source[i] = b;
      source[j] = a;
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      perm[i] = source[i & 255] ?? 0;
    }
    return perm;
  }

  /* PRNG compacto y estable; no es criptográfico, sólo garantiza determinismo entre semillas. */
  private static mulberry32(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    switch (hash & 7) {
      case 0:
        return x + y;
      case 1:
        return x - y;
      case 2:
        return -x + y;
      case 3:
        return -x - y;
      case 4:
        return x;
      case 5:
        return -x;
      case 6:
        return y;
      default:
        return -y;
    }
  }

  /** Devuelve un valor suave aproximado en [-1, 1]; en los enteros de la red vale 0. */
  noise2(x: number, y: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const xf = x - x0;
    const yf = y - y0;
    const xi = x0 & 255;
    const yi = y0 & 255;
    const p = this.perm;

    const aa = p[(p[xi] ?? 0) + yi] ?? 0;
    const ba = p[(p[xi + 1] ?? 0) + yi] ?? 0;
    const ab = p[(p[xi] ?? 0) + yi + 1] ?? 0;
    const bb = p[(p[xi + 1] ?? 0) + yi + 1] ?? 0;

    const u = this.fade(xf);
    const v = this.fade(yf);
    const x1 = this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u);
    const x2 = this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u);
    return this.lerp(x1, x2, v);
  }
}
