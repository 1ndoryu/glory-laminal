/* Boundary de plataforma: único lugar autorizado para acceder al DOM de forma directa.
   Aísla al motor del navegador para que el núcleo siga siendo agnóstico y testeable sin DOM.
   Los editores (src/editor) también son boundary DOM por diseño (ADR 001): el chrome es DOM/CSS. */

export function requireRootElement(selector: string): HTMLDivElement {
  const element = document.querySelector<HTMLDivElement>(selector);
  if (element === null) {
    throw new Error(`No se encontró el contenedor raíz "${selector}"`);
  }
  return element;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

/* Convierte un arrastre de puntero en deltas (dx, dy) con pointer capture. */
export function onDrag(
  element: HTMLElement,
  onMove: (dx: number, dy: number, event: PointerEvent) => void,
): void {
  let lastX = 0;
  let lastY = 0;

  element.addEventListener('pointerdown', (downEvent) => {
    downEvent.preventDefault();
    element.setPointerCapture(downEvent.pointerId);
    lastX = downEvent.clientX;
    lastY = downEvent.clientY;

    const move = (moveEvent: PointerEvent): void => {
      const dx = moveEvent.clientX - lastX;
      const dy = moveEvent.clientY - lastY;
      lastX = moveEvent.clientX;
      lastY = moveEvent.clientY;
      onMove(dx, dy, moveEvent);
    };
    const release = (): void => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', release);
      element.removeEventListener('pointercancel', release);
    };

    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);
  });
}
