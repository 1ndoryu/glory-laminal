import type { OrbitCamera } from '../../camera/OrbitCamera';
import { Vec3 } from '../../core/math/Vec3';
import { createElement } from '../../platform/dom';
import { editorStore } from '../store';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CX = 34;
const CY = 34;
const RADIUS = 26;
const UP = new Vec3(0, 0, 1);

/* Colores de eje del tema Blender (tokens --ejeX/--ejeY/--ejeZ de variables.css). */
const AXES: ReadonlyArray<{ id: string; label: string; axis: Vec3; color: string }> = [
  { id: 'X', label: 'X', axis: new Vec3(1, 0, 0), color: '#ff3352' },
  { id: 'Y', label: 'Y', axis: new Vec3(0, 1, 0), color: '#8bdc00' },
  { id: 'Z', label: 'Z', axis: new Vec3(0, 0, 1), color: '#2890ff' },
];

interface AxisHandle {
  line: SVGLineElement;
  positive: SVGCircleElement;
  negative: SVGCircleElement;
  text: SVGTextElement;
}

export interface NavigationGizmo {
  element: HTMLElement;
  sync: (camera: OrbitCamera) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* Base de la cámara en espacio mundo, derivada igual que en OrbitCamera.pan/zoomAt. */
function cameraBasis(camera: OrbitCamera): { right: Vec3; up: Vec3; forward: Vec3 } {
  const forward = camera.target.clone().subtract(camera.eye()).normalize();
  const right = Vec3.cross(forward, UP).normalize();
  const up = Vec3.cross(right, forward).normalize();
  return { right, up, forward };
}

/* Gizmo de navegación estilo Blender: los ejes X/Y/Z se proyectan con la orientación actual de la
   cámara (giran con ella), arrastrar orbita, clic en un eje salta a esa vista, clic en el centro
   alterna orto/perspectiva. */
export function buildNavigationGizmo(getCamera: () => OrbitCamera | null): NavigationGizmo {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 68 68');
  svg.classList.add('gizmoNavegacion');

  const background = document.createElementNS(SVG_NS, 'circle');
  background.setAttribute('cx', String(CX));
  background.setAttribute('cy', String(CY));
  background.setAttribute('r', String(RADIUS));
  background.setAttribute('fill', 'rgba(20,20,20,0.55)');
  background.setAttribute('stroke', 'rgba(255,255,255,0.18)');
  svg.appendChild(background);

  const center = document.createElementNS(SVG_NS, 'circle');
  center.setAttribute('cx', String(CX));
  center.setAttribute('cy', String(CY));
  center.setAttribute('r', '8');
  center.setAttribute('fill', 'transparent');
  center.setAttribute('data-center', 'toggle');
  svg.appendChild(center);

  const handles: AxisHandle[] = AXES.map((axis) => {
    const group = document.createElementNS(SVG_NS, 'g');

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(CX));
    line.setAttribute('y1', String(CY));
    line.setAttribute('stroke', axis.color);
    line.setAttribute('stroke-width', '1.4');
    line.setAttribute('opacity', '0.7');
    group.appendChild(line);

    const positive = document.createElementNS(SVG_NS, 'circle');
    positive.setAttribute('r', '5');
    positive.setAttribute('fill', axis.color);
    positive.setAttribute('data-axis', axis.id);
    positive.setAttribute('data-sign', '+');
    positive.classList.add('gizmoEje');
    group.appendChild(positive);

    const negative = document.createElementNS(SVG_NS, 'circle');
    negative.setAttribute('r', '3');
    negative.setAttribute('fill', axis.color);
    negative.setAttribute('opacity', '0.7');
    negative.setAttribute('data-axis', axis.id);
    negative.setAttribute('data-sign', '-');
    negative.classList.add('gizmoEje');
    group.appendChild(negative);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', axis.color);
    text.setAttribute('data-axis', axis.id);
    text.setAttribute('data-sign', '+');
    text.textContent = axis.label;
    text.classList.add('gizmoEje');
    group.appendChild(text);

    svg.appendChild(group);
    return { line, positive, negative, text };
  });

  const sync = (camera: OrbitCamera): void => {
    const { right, up, forward } = cameraBasis(camera);
    AXES.forEach((axis, index) => {
      const handle = handles[index]!;
      const x = axis.axis.dot(right);
      const y = axis.axis.dot(up);
      const depth = axis.axis.dot(forward);

      const posX = CX + x * RADIUS;
      const posY = CY - y * RADIUS;
      const negX = CX - x * RADIUS;
      const negY = CY + y * RADIUS;

      handle.line.setAttribute('x2', String(posX));
      handle.line.setAttribute('y2', String(posY));
      handle.positive.setAttribute('cx', String(posX));
      handle.positive.setAttribute('cy', String(posY));
      handle.negative.setAttribute('cx', String(negX));
      handle.negative.setAttribute('cy', String(negY));
      handle.text.setAttribute('x', String(posX + (x > 0 ? 8 : x < 0 ? -8 : 0)));
      handle.text.setAttribute('y', String(posY + (y > 0 ? -8 : y < 0 ? 8 : 0)));

      /* El eje que apunta hacia el fondo se atenúa, como en el gizmo de Blender. */
      const positiveBack = depth > 0.15;
      handle.positive.setAttribute('opacity', positiveBack ? '0.3' : '1');
      handle.text.setAttribute('opacity', positiveBack ? '0.25' : '1');
      handle.negative.setAttribute('opacity', depth < -0.15 ? '0.3' : '0.7');
    });
  };

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
    if (moved) {
      return;
    }
    const target = event.target as Element | null;
    const camera = getCamera();
    if (camera === null) {
      return;
    }
    if (target?.closest('[data-center]') !== null) {
      editorStore.getState().toggleOrthographic();
      return;
    }
    const axisEl = target?.closest<Element>('[data-axis]');
    const axisId = axisEl?.getAttribute('data-axis');
    const sign = axisEl?.getAttribute('data-sign');
    if (axisId === null || sign === null) {
      return;
    }
    const definition = AXES.find((axis) => axis.id === axisId);
    if (definition === undefined) {
      return;
    }
    const direction = definition.axis.scale(sign === '+' ? 1 : -1);
    const elevation = Math.acos(clamp(direction.z, -1, 1));
    const azimuth = Math.atan2(direction.y, direction.x);
    camera.smoothView(azimuth, elevation);
  };
  svg.addEventListener('pointerup', release);
  svg.addEventListener('pointercancel', release);

  const wrapper = createElement('div');
  wrapper.appendChild(svg);
  return { element: wrapper, sync };
}
