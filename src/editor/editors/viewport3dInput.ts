import type { OrbitCamera } from '../../camera/OrbitCamera';
import { Keymap } from '../../input/Keymap';
import {
  registerEditorInput,
  setActiveEditor,
  type OperatorFn,
} from '../../input/InputManager';
import { findLeaf } from '../layout/layoutTree';
import { layoutStore } from '../layout/layoutStore';
import type { RegionType } from '../layout/types';
import { editorStore } from '../store';

type Interaction = 'orbit' | 'pan' | 'zoom';

/* Convierte una posición de puntero a coordenadas de dispositivo normalizadas [-1, 1]. */
function toNdc(canvas: HTMLCanvasElement, clientX: number, clientY: number): [number, number] {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
  const y = 1 - ((clientY - rect.top) / Math.max(1, rect.height)) * 2;
  return [x, y];
}

/* Control de ratón del viewport: MMB órbita, Shift+MMB pan, Ctrl+MMB y rueda zoom (hacia el
   cursor, como Blender). */
export function attachViewportInput(
  canvas: HTMLCanvasElement,
  getCamera: () => OrbitCamera | null,
): void {
  let interaction: Interaction | null = null;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 1) {
      return;
    }
    event.preventDefault();
    interaction = event.shiftKey ? 'pan' : event.ctrlKey ? 'zoom' : 'orbit';
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (interaction === null) {
      return;
    }
    const camera = getCamera();
    if (camera === null) {
      return;
    }
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    if (interaction === 'orbit') {
      camera.orbit(dx, dy);
    } else if (interaction === 'pan') {
      camera.pan(dx, dy);
    } else {
      const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      const [ndcX, ndcY] = toNdc(canvas, event.clientX, event.clientY);
      camera.zoomAt(ndcX, ndcY, aspect, Math.exp(dy * 0.006));
    }
  });

  const endInteraction = (event: PointerEvent): void => {
    if (event.button === 1) {
      interaction = null;
    }
  };
  canvas.addEventListener('pointerup', endInteraction);
  canvas.addEventListener('pointercancel', endInteraction);

  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const camera = getCamera();
      if (camera === null) {
        return;
      }
      const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      const [ndcX, ndcY] = toNdc(canvas, event.clientX, event.clientY);
      camera.zoomAt(ndcX, ndcY, aspect, Math.exp(event.deltaY * 0.0015));
    },
    { passive: false },
  );
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
}

export interface ViewportKeyboardContext {
  areaId: string;
  getCamera: () => OrbitCamera | null;
  getTerrainRadius: () => number;
}

/* Keymap contexto-sensible del viewport: numpad (vistas/orto/frame) y T/N para regiones. */
export function registerViewportKeyboard(
  host: HTMLElement,
  context: ViewportKeyboardContext,
): void {
  const { areaId, getCamera, getTerrainRadius } = context;

  const toggleRegion = (region: RegionType): void => {
    const leaf = findLeaf(layoutStore.getState().root, areaId);
    const current = leaf?.regions.find((item) => item.type === region);
    layoutStore.getState().setRegionVisible(areaId, region, !(current?.visible ?? true));
  };

  const keymap = new Keymap()
    .add({ code: 'Numpad1', operator: 'view.front' })
    .add({ code: 'Numpad3', operator: 'view.right' })
    .add({ code: 'Numpad7', operator: 'view.top' })
    .add({ code: 'Numpad9', operator: 'view.opposite' })
    .add({ code: 'Numpad5', operator: 'view.toggle_ortho' })
    .add({ code: 'Period', operator: 'view.frame_selected' })
    .add({ code: 'NumpadDecimal', operator: 'view.frame_selected' })
    .add({ code: 'KeyT', operator: 'ui.toggle_tools' })
    .add({ code: 'KeyN', operator: 'ui.toggle_sidebar' });

  const operators: Record<string, OperatorFn> = {
    'view.front': () => getCamera()?.smoothFrontView(),
    'view.right': () => getCamera()?.smoothRightView(),
    'view.top': () => getCamera()?.smoothTopView(),
    'view.opposite': () => getCamera()?.smoothOppositeView(),
    'view.toggle_ortho': () => editorStore.getState().toggleOrthographic(),
    'view.frame_selected': () => getCamera()?.smoothFrameSelected(getTerrainRadius()),
    'ui.toggle_tools': () => toggleRegion('TOOLS'),
    'ui.toggle_sidebar': () => toggleRegion('UI'),
  };

  registerEditorInput(areaId, keymap, operators);
  host.addEventListener('pointerenter', () => setActiveEditor(areaId));
}
