import type { MeshData } from '../mesh';

/* Malla WebGL2: un VAO con posiciones/normales/colores y un único EBO que concatena
   triángulos sólidos y aristas wireframe, de modo que ambos modos comparten vértices. */
export class Mesh {
  private readonly gl: WebGL2RenderingContext;
  private readonly vao: WebGLVertexArrayObject;
  private readonly triangleCount: number;
  private readonly lineCount: number;
  private readonly wireframeOffsetBytes: number;

  constructor(gl: WebGL2RenderingContext, data: MeshData) {
    this.gl = gl;
    const vao = gl.createVertexArray();
    if (vao === null) {
      throw new Error('No se pudo crear el VAO');
    }
    this.vao = vao;
    gl.bindVertexArray(vao);

    this.triangleCount = data.indices.length;
    this.lineCount = data.wireframeIndices.length;
    this.wireframeOffsetBytes = data.indices.byteLength;

    this.uploadAttribute(0, data.positions, 3);
    this.uploadAttribute(1, data.normals, 3);
    this.uploadAttribute(2, data.colors, 3);

    const indexBuffer = gl.createBuffer();
    if (indexBuffer === null) {
      throw new Error('No se pudo crear el buffer de índices');
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      data.indices.byteLength + data.wireframeIndices.byteLength,
      gl.STATIC_DRAW,
    );
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, data.indices);
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, data.indices.byteLength, data.wireframeIndices);

    gl.bindVertexArray(null);
  }

  private uploadAttribute(location: number, data: Float32Array, components: number): void {
    const { gl } = this;
    const vbo = gl.createBuffer();
    if (vbo === null) {
      throw new Error('No se pudo crear el VBO');
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, components, gl.FLOAT, false, 0, 0);
  }

  bind(): void {
    this.gl.bindVertexArray(this.vao);
  }

  drawTriangles(): void {
    this.gl.drawElements(this.gl.TRIANGLES, this.triangleCount, this.gl.UNSIGNED_INT, 0);
  }

  drawLines(): void {
    this.gl.drawElements(
      this.gl.LINES,
      this.lineCount,
      this.gl.UNSIGNED_INT,
      this.wireframeOffsetBytes,
    );
  }

  dispose(): void {
    this.gl.deleteVertexArray(this.vao);
  }
}
