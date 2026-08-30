import { clearWindowTimeout, createElement, setWindowTimeout, viewportSize } from '../../platform/dom';

const DELAY_MS = 250;
const OFFSET_X = 14;
const OFFSET_Y = 18;
const MARGIN = 8;

/* Tooltip global minimalista: una única burbuja para todo el editor. Escucha por delegación en
   `[title]`/`[data-tooltip]`, suprime el tooltip nativo del navegador y aparece junto al cursor
   (o bajo el elemento al navegar con teclado). Se voltea y se clampa contra los bordes de la
   ventana para no salirse de la pantalla. Devuelve la función de cleanup. */
export function initTooltips(): () => void {
  const tooltip = createElement('div', 'tooltipGlobal');
  tooltip.hidden = true;
  document.body.appendChild(tooltip);

  let current: HTMLElement | null = null;
  let showTimer: number | null = null;
  let lastX = 0;
  let lastY = 0;

  const clearTimer = (): void => {
    if (showTimer !== null) {
      clearWindowTimeout(showTimer);
      showTimer = null;
    }
  };

  const hide = (): void => {
    clearTimer();
    tooltip.hidden = true;
    current = null;
  };

  /* Posiciona la burbuja cerca de (anchorX, anchorY) y la mantiene dentro del viewport: voltea a
     la izquierda/arriba si se acercaría al borde derecho/inferior y clampa contra los márgenes. */
  const place = (anchorX: number, anchorY: number): void => {
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const { width: vw, height: vh } = viewportSize();
    const maxX = vw - MARGIN;
    const maxY = vh - MARGIN;

    let left = anchorX + OFFSET_X;
    let top = anchorY + OFFSET_Y;

    if (left + width > maxX) {
      left = anchorX - OFFSET_X - width;
    }
    if (top + height > maxY) {
      top = anchorY - OFFSET_Y - height;
    }

    left = Math.max(MARGIN, Math.min(left, Math.max(MARGIN, maxX - width)));
    top = Math.max(MARGIN, Math.min(top, Math.max(MARGIN, maxY - height)));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const show = (): void => {
    const text = current?.dataset.tooltip ?? '';
    if (text === '') {
      hide();
      return;
    }
    tooltip.textContent = text;
    tooltip.hidden = false;
    place(lastX, lastY);
  };

  const positionNear = (element: HTMLElement): void => {
    const rect = element.getBoundingClientRect();
    place(rect.left, rect.bottom);
  };

  /* Guarda el `title` en data-tooltip y lo retira para que no aparezca el nativo del navegador. */
  const capture = (element: HTMLElement): void => {
    const title = element.getAttribute('title');
    if (title !== null && title !== '') {
      element.dataset.tooltip = title;
      element.removeAttribute('title');
    }
  };

  const onPointerOver = (event: PointerEvent): void => {
    const element = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[title], [data-tooltip]')
      : null;
    if (element === null) {
      hide();
      return;
    }
    if (element === current) {
      return;
    }
    hide();
    current = element;
    capture(element);
    lastX = event.clientX;
    lastY = event.clientY;
    clearTimer();
    showTimer = setWindowTimeout(show, DELAY_MS);
  };

  const onPointerMove = (event: PointerEvent): void => {
    lastX = event.clientX;
    lastY = event.clientY;
    if (current !== null && !tooltip.hidden) {
      place(lastX, lastY);
    }
  };

  const onPointerOut = (event: PointerEvent): void => {
    const element = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[title], [data-tooltip]')
      : null;
    if (element === current) {
      hide();
    }
  };

  const onFocusIn = (event: FocusEvent): void => {
    const element = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[title], [data-tooltip]')
      : null;
    if (element === null) {
      return;
    }
    hide();
    current = element;
    capture(element);
    show();
    positionNear(element);
  };

  const onFocusOut = (event: FocusEvent): void => {
    const element = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[title], [data-tooltip]')
      : null;
    if (element === current) {
      hide();
    }
  };

  document.addEventListener('pointerover', onPointerOver);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerout', onPointerOut);
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);

  return () => {
    document.removeEventListener('pointerover', onPointerOver);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerout', onPointerOut);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    tooltip.remove();
  };
}
