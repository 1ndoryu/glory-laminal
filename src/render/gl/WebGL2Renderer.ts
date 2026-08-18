export class WebGL2Renderer {
  private readonly gl: WebGL2RenderingContext;

  private constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: true, depth: true });
    if (gl === null) {
      throw new Error('WebGL2 no está disponible en este navegador');
    }
    this.gl = gl;
    gl.enable(gl.DEPTH_TEST);
  }

  static create(canvas: HTMLCanvasElement): WebGL2Renderer {
    return new WebGL2Renderer(canvas);
  }

  /* El contexto queda expuesto a los editores del boundary de render para configurar estado GL
     (culling, profundidad) sin atravesar una API intermedia innecesaria. */
  get context(): WebGL2RenderingContext {
    return this.gl;
  }

  /* Ajusta el buffer del canvas a su tamaño CSS por devicePixelRatio (máx. 2 para acotar coste). */
  resizeToDisplaySize(): void {
    const { canvas, gl } = this;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  clear(r: number, g: number, b: number, a = 1): void {
    const { gl } = this;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
}
