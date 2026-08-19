import type { OrbitCamera } from '../../camera/OrbitCamera';
import { createElement } from '../../platform/dom';

const SVG_NS = 'http://www.w3.org/2000/svg';

const AXES: ReadonlyArray<{
  view: 'right' | 'front' | 'top';
  color: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  labelX: number;
  labelY: number;
}> = [
  { view: 'right', color: '#ff3352', x1: 34, y1: 34, x2: 56, y2: 34, label: 'X', labelX: 62, labelY: 38 },
  { view: 'front', color: '#8bdc00', x1: 34, y1: 34, x2: 19, y2: 49, label: 'Y', labelX: 13, labelY: 58 },
  { view: 'top', color: '#2890ff', x1: 34, y1: 34, x2: 34, y2: 12, label: 'Z', labelX: 34, labelY: 8 },
];

/* Gizmo de navegación del viewport (equivale al "navigation gizmo" de Blender): arrastrar
   orbita la cámara y hacer clic sobre un eje salta a esa vista (X=derecha, Y=frente, Z=arriba). */
export function buildNavigationGizmo(getCamera: () => OrbitCamera | null): HTMLElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 68 68');
  svg.classList.add('gizmoNavegacion');

  const background = document.createElementNS(SVG_NS, 'circle');
  background.setAttribute('cx', '34');
  background.setAttribute('cy', '34');
  background.setAttribute('r', '30');
  background.setAttribute('fill', 'rgba(20,20,20,0.55)');
  background.setAttribute('stroke', 'rgba(255,255,255,0.18)');
  svg.appendChild(background);

  for (const axis of AXES) {
    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'gizmoEje');
    group.setAttribute('data-view', axis.view);

    const hit = document.createElementNS(SVG_NS, 'circle');
    hit.setAttribute('cx', String((axis.x2 + 34) / 2));
    hit.setAttribute('cy', String((axis.y2 + 34) / 2));
    hit.setAttribute('r', '12');
    hit.setAttribute('fill', 'transparent');
    group.appendChild(hit);

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(axis.x1));
    line.setAttribute('y1', String(axis.y1));
    line.setAttribute('x2', String(axis.x2));
    line.setAttribute('y2', String(axis.y2));
    line.setAttribute('stroke', axis.color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');
    group.appendChild(line);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', String(axis.labelX));
    label.setAttribute('y', String(axis.labelY));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', axis.color);
    label.textContent = axis.label;
    group.appendChild(label);

    svg.appendChild(group);
  }

  const origin = document.createElementNS(SVG_NS, 'circle');
  origin.setAttribute('cx', '34');
  origin.setAttribute('cy', '34');
  origin.setAttribute('r', '2.5');
  origin.setAttribute('fill', '#ffffff');
  origin.setAttribute('opacity', '0.9');
  svg.appendChild(origin);

  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;

  svg.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = false;
    lastX = event.clientX;
    lastY = event.clientY;
    svg.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  svg.addEventListener('pointermove', (event) => {
    if (!dragging) {
      return;
    }
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 3) {
      moved = true;
    }
    if (moved) {
      getCamera()?.orbit(dx, dy);
    }
  });

  const release = (event: PointerEvent): void => {
    if (!dragging) {
      return;
    }
    dragging = false;
    if (!moved) {
      const target = event.target as Element | null;
      const axisGroup = target?.closest('.gizmoEje');
      const view = axisGroup?.getAttribute('data-view');
      const camera = getCamera();
      if (camera !== null && view !== null) {
        if (view === 'right') {
          camera.smoothRightView();
        } else if (view === 'front') {
          camera.smoothFrontView();
        } else if (view === 'top') {
          camera.smoothTopView();
        }
      }
    }
  };
  svg.addEventListener('pointerup', release);
  svg.addEventListener('pointercancel', release);

  const wrapper = createElement('div');
  wrapper.appendChild(svg);
  return wrapper;
}
