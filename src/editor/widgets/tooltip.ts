import { createElement } from '../../platform/dom';

const DELAY_MS = 250;
const OFFSET_X = 14;
const OFFSET_Y = 18;

/* Tooltip global minimalista: una única burbuja para todo el editor. Escucha por delegación en
   `[title]`/`[data-tooltip]`, suprime el tooltip nativo del navegador y aparece junto al cursor
   (o bajo el elemento al navegar con teclado). Devuelve la función de cleanup. */
export function initTooltips(): () => void {
  const tooltip = createElement('div', 'tooltipGlobal');
  tooltip.hidden = true;
  document.body.appendChild(tooltip);

  let current: HTMLElement | null = null;
  let showTimer: number | null = null;

  const clearTimer = (): void => {
    if (showTimer !== null) {
      window.clearTimeout(showTimer);
      showTimer = null;
    }
  };

  const hide = (): void => {
    clearTimer();
    tooltip.hidden = true;
    current = null;
  };

  const show = (): void => {
    const text = current?.dataset.tooltip ?? '';
    if (text === '') {
      hide();
      return;
    }
    tooltip.textContent = text;
    tooltip.hidden = false;
  };

  const positionAt = (x: number, y: number): void => {
    tooltip.style.left = `${x + OFFSET_X}px`;
    tooltip.style.top = `${y + OFFSET_Y}px`;
  };

  const positionNear = (element: HTMLElement): void => {
    const rect = element.getBoundingClientRect();
    positionAt(rect.left, rect.bottom);
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
    positionAt(event.clientX, event.clientY);
    clearTimer();
    showTimer = window.setTimeout(show, DELAY_MS);
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (current !== null && !tooltip.hidden) {
      positionAt(event.clientX, event.clientY);
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
