import { Vec3 } from '../core/math/Vec3';

export interface GridLinesData {
  positions: Float32Array;
  /** RGBA por vértice, en [0,1]. */
  colors: Float32Array;
  vertexCount: number;
}

export interface GridOptions {
  /** Mitad del lado del grid (de -extent a +extent). */
  extent?: number;
  /** Separación entre líneas mayores (más visibles). */
  majorStep?: number;
  /** Separación entre líneas menores. */
  minorStep?: number;
}

/* Colores del tema Default de Blender: grid #545454 con alpha, ejes xaxis/yaxis/zaxis. */
const GRID_COLOR: [number, number, number, number] = [0.33, 0.33, 0.33, 0.5];
const GRID_MAJOR_COLOR: [number, number, number, number] = [0.33, 0.33, 0.33, 0.9];
const AXIS_X: [number, number, number, number] = [1.0, 0.2, 0.32, 0.9];
const AXIS_Y: [number, number, number, number] = [0.55, 0.86, 0.0, 0.9];
const AXIS_Z: [number, number, number, number] = [0.16, 0.56, 1.0, 0.9];

/* Construye las líneas del grid (plano XY, Z=0) como pares de vértices coloreados. Cada eje se
   dibuja por separado; la línea vertical Z sale del origen para dar la referencia 3D. */
export function buildGridLinesData(options: GridOptions = {}): GridLinesData {
  const { extent = 60, majorStep = 10, minorStep = 2 } = options;

  const positions: number[] = [];
  const colors: number[] = [];

  const pushLine = (
    a: Vec3,
    b: Vec3,
    color: [number, number, number, number],
  ): void => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    colors.push(...color, ...color);
  };

  for (let i = -extent; i <= extent; i += minorStep) {
    const isMajor = Math.abs(i) % majorStep === 0;
    const isAxis = i === 0;
    const color = isAxis ? GRID_MAJOR_COLOR : isMajor ? GRID_MAJOR_COLOR : GRID_COLOR;
    // Línea paralela al eje X (y = i).
    pushLine(new Vec3(-extent, i, 0), new Vec3(extent, i, 0), color);
    // Línea paralela al eje Y (x = i).
    pushLine(new Vec3(i, -extent, 0), new Vec3(i, extent, 0), color);
  }

  // Ejes principales encima del grid, con el color de cada eje.
  pushLine(new Vec3(-extent, 0, 0), new Vec3(extent, 0, 0), AXIS_X);
  pushLine(new Vec3(0, -extent, 0), new Vec3(0, extent, 0), AXIS_Y);
  pushLine(new Vec3(0, 0, 0), new Vec3(0, 0, extent), AXIS_Z);

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    vertexCount: positions.length / 3,
  };
}
