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

/* Control de ratón del viewport: MMB órbita, Shift+MMB pan, Ctrl+MMB y rueda zoom. */
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
      camera.zoomByFactor(Math.exp(dy * 0.006));
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
      getCamera()?.zoomByFactor(Math.exp(event.deltaY * 0.0015));
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
    'view.front': () => getCamera()?.frontView(),
    'view.right': () => getCamera()?.rightView(),
    'view.top': () => getCamera()?.topView(),
    'view.opposite': () => getCamera()?.oppositeView(),
    'view.toggle_ortho': () => editorStore.getState().toggleOrthographic(),
    'view.frame_selected': () => getCamera()?.frameSelected(getTerrainRadius()),
    'ui.toggle_tools': () => toggleRegion('TOOLS'),
    'ui.toggle_sidebar': () => toggleRegion('UI'),
  };

  registerEditorInput(areaId, keymap, operators);
  host.addEventListener('pointerenter', () => setActiveEditor(areaId));
}
