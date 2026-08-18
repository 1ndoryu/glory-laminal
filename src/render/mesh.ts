/* Contrato de datos de malla, agnóstico de WebGL: los productores (terrain, futuro modelado)
   entregan buffers intercalados y el adaptador WebGL2 los sube a la GPU. */
export interface MeshData {
  /** xyz por vértice. */
  positions: Float32Array;
  /** xyz normalizada por vértice. */
  normals: Float32Array;
  /** rgb por vértice, en [0,1]. */
  colors: Float32Array;
  /** Índices de los triángulos sólidos. */
  indices: Uint32Array;
  /** Índices de las aristas (líneas) para el modo wireframe. */
  wireframeIndices: Uint32Array;
}
