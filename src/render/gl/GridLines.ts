import type { GridLinesData } from '../grid';

/* VAO de líneas para el grid del viewport: posiciones (vec3) + color (vec4). Se dibuja con
   gl.LINES y blending para fundirse con el degradado del fondo. */
export class GridLines {
  private readonly gl: WebGL2RenderingContext;
  private readonly vao: WebGLVertexArrayObject;
  private readonly vertexCount: number;

  constructor(gl: WebGL2RenderingContext, data: GridLinesData) {
    this.gl = gl;
    this.vertexCount = data.vertexCount;

    const vao = gl.createVertexArray();
    if (vao === null) {
      throw new Error('No se pudo crear el VAO del grid');
    }
    this.vao = vao;
    gl.bindVertexArray(vao);

    this.uploadAttribute(0, data.positions, 3);
    this.uploadAttribute(1, data.colors, 4);

    gl.bindVertexArray(null);
  }

  private uploadAttribute(location: number, data: Float32Array, components: number): void {
    const { gl } = this;
    const vbo = gl.createBuffer();
    if (vbo === null) {
      throw new Error('No se pudo crear el VBO del grid');
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, components, gl.FLOAT, false, 0, 0);
  }

  bind(): void {
    this.gl.bindVertexArray(this.vao);
  }

  draw(): void {
    this.gl.drawArrays(this.gl.LINES, 0, this.vertexCount);
  }

  dispose(): void {
    this.gl.deleteVertexArray(this.vao);
  }
}
