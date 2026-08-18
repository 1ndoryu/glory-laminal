/* Programa de shaders WebGL2 con compilación/enlace verificados y caché de uniformes.
   Lanza errores explícitos con el log del driver en lugar de fallar silenciosamente. */
export class ShaderProgram {
  readonly program: WebGLProgram;
  private readonly gl: WebGL2RenderingContext;
  private readonly uniformCache = new Map<string, WebGLUniformLocation | null>();

  constructor(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
    this.gl = gl;
    this.program = ShaderProgram.link(gl, vertexSource, fragmentSource);
  }

  private static compile(
    gl: WebGL2RenderingContext,
    type: number,
    source: string,
  ): WebGLShader {
    const shader = gl.createShader(type);
    if (shader === null) {
      throw new Error('No se pudo crear el shader');
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? 'sin log';
      gl.deleteShader(shader);
      throw new Error(`Error de compilación de shader: ${log}`);
    }
    return shader;
  }

  private static link(
    gl: WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string,
  ): WebGLProgram {
    const vertex = ShaderProgram.compile(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = ShaderProgram.compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (program === null) {
      throw new Error('No se pudo crear el programa de shaders');
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? 'sin log';
      gl.deleteProgram(program);
      throw new Error(`Error de enlace de programa: ${log}`);
    }
    return program;
  }

  use(): void {
    this.gl.useProgram(this.program);
  }

  uniform(name: string): WebGLUniformLocation | null {
    let location = this.uniformCache.get(name);
    if (location === undefined) {
      location = this.gl.getUniformLocation(this.program, name);
      this.uniformCache.set(name, location);
    }
    return location;
  }

  setMat4(name: string, elements: Float32Array): void {
    this.gl.uniformMatrix4fv(this.uniform(name), false, elements);
  }

  setVec3(name: string, value: { x: number; y: number; z: number }): void {
    this.gl.uniform3f(this.uniform(name), value.x, value.y, value.z);
  }

  setFloat(name: string, value: number): void {
    this.gl.uniform1f(this.uniform(name), value);
  }

  dispose(): void {
    this.gl.deleteProgram(this.program);
  }
}
