type FrameCallback = (deltaSeconds: number, elapsedSeconds: number) => void;

export class RenderLoop {
  private running = false;
  private animationFrame = 0;
  private lastTime = 0;
  private elapsedSeconds = 0;

  constructor(private readonly frame: FrameCallback) {}

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTime = performance.now();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animationFrame);
  }

  /* Vinculado como campo para pasar la misma referencia a requestAnimationFrame en cada frame. */
  private readonly tick = (now: number): void => {
    if (!this.running) {
      return;
    }
    /* El delta se acota a 0.25 s para absorber pausas al volver de una pestaña en segundo plano. */
    const deltaSeconds = Math.min((now - this.lastTime) / 1000, 0.25);
    this.lastTime = now;
    this.elapsedSeconds += deltaSeconds;
    this.frame(deltaSeconds, this.elapsedSeconds);
    this.animationFrame = requestAnimationFrame(this.tick);
  };
}
