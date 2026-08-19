import { createElement, onDrag } from '../../platform/dom';
import { defaultRegionSize, findLeaf } from '../layout/layoutTree';
import { layoutStore } from '../layout/layoutStore';
import { editorStore, type EditorState } from '../store';
import { fieldRow, makeCheckbox, makeNumber, makeRange, makeSelect } from '../widgets/fields';
import { createPanel } from '../widgets/panel';

export interface ViewportSidebar {
  element: HTMLElement;
  readouts: { cameraInfo: HTMLElement; stats: HTMLElement };
  sync: (state: EditorState) => void;
}

export interface ViewportSidebarOptions {
  areaId: string;
  onFrameSelected: () => void;
}

/* Sidebar derecho del viewport (equivale a la region UI de Blender). Solo contiene controles que
   funcionan: vista (órbita/proyección/frame), terreno y estadísticas de render. */
export function buildViewportSidebar(options: ViewportSidebarOptions): ViewportSidebar {
  const { areaId, onFrameSelected } = options;

  let orbitSelect: HTMLSelectElement | null = null;
  let orthoCheck: HTMLInputElement | null = null;
  let wireframeCheck: HTMLInputElement | null = null;
  let seedInput: HTMLInputElement | null = null;
  let amplitudeInput: HTMLInputElement | null = null;
  let amplitudeValue: HTMLElement | null = null;
  let octavesInput: HTMLInputElement | null = null;
  let octavesValue: HTMLElement | null = null;
  let cameraInfoEl: HTMLElement | null = null;
  let statsEl: HTMLElement | null = null;

  const ui = createElement('aside', 'region barraLateral');

  const body = createElement('div', 'cuerpoSidebar');
  body.style.overflowY = 'auto';
  body.style.flex = '1 1 auto';
  ui.appendChild(body);

  body.append(buildViewPanel(), buildTerrainPanel(), buildRenderPanel());
  attachResize(ui);

  const sync = (state: EditorState): void => {
    if (orbitSelect !== null) {
      orbitSelect.value = state.orbitMethod;
    }
    if (orthoCheck !== null) {
      orthoCheck.checked = state.orthographic;
    }
    if (wireframeCheck !== null) {
      wireframeCheck.checked = state.wireframe;
    }
    if (seedInput !== null) {
      seedInput.value = String(state.terrain.seed);
    }
    if (amplitudeInput !== null) {
      amplitudeInput.value = String(state.terrain.amplitude);
    }
    if (amplitudeValue !== null) {
      amplitudeValue.textContent = String(state.terrain.amplitude);
    }
    if (octavesInput !== null) {
      octavesInput.value = String(state.terrain.octaves);
    }
    if (octavesValue !== null) {
      octavesValue.textContent = String(state.terrain.octaves);
    }
  };

  return {
    element: ui,
    readouts: { cameraInfo: cameraInfoEl!, stats: statsEl! },
    sync,
  };

  function buildViewPanel(): HTMLElement {
    const bodyPanel = createElement('div', 'camposPanel');
    orbitSelect = makeSelect(
      [
        { value: 'turntable', label: 'Turntable' },
        { value: 'trackball', label: 'Trackball' },
      ],
      (value) =>
        editorStore.getState().setOrbitMethod(value === 'trackball' ? 'trackball' : 'turntable'),
    );
    orthoCheck = makeCheckbox(false, (checked) => {
      if (checked !== editorStore.getState().orthographic) {
        editorStore.getState().toggleOrthographic();
      }
    });
    const frameButton = createElement('button', 'boton botonPanel', 'Frame Selected');
    frameButton.type = 'button';
    frameButton.addEventListener('click', onFrameSelected);
    cameraInfoEl = createElement('div', 'lecturaCampo');
    bodyPanel.append(
      fieldRow('Órbita', orbitSelect),
      fieldRow('Ortográfica', orthoCheck),
      frameButton,
      cameraInfoEl,
    );
    return createPanel({ title: 'Vista', body: bodyPanel });
  }

  function buildTerrainPanel(): HTMLElement {
    const bodyPanel = createElement('div', 'camposPanel');
    const state = editorStore.getState();
    seedInput = makeNumber(state.terrain.seed, (seed) => editorStore.getState().setTerrain({ seed }));
    amplitudeInput = makeRange(1, 60, 1, state.terrain.amplitude, (amplitude) =>
      editorStore.getState().setTerrain({ amplitude }),
    );
    amplitudeValue = createElement('span', 'valorCampo', String(state.terrain.amplitude));
    octavesInput = makeRange(1, 8, 1, state.terrain.octaves, (octaves) =>
      editorStore.getState().setTerrain({ octaves }),
    );
    octavesValue = createElement('span', 'valorCampo', String(state.terrain.octaves));
    wireframeCheck = makeCheckbox(state.wireframe, () => editorStore.getState().toggleWireframe());
    const regenerateButton = createElement('button', 'boton botonPanel', 'Regenerar');
    regenerateButton.type = 'button';
    regenerateButton.addEventListener('click', () => editorStore.getState().regenerateTerrain());

    bodyPanel.append(
      fieldRow('Semilla', seedInput),
      fieldRow('Amplitud', amplitudeInput),
      amplitudeValue,
      fieldRow('Octavas', octavesInput),
      octavesValue,
      fieldRow('Wireframe', wireframeCheck),
      regenerateButton,
    );
    return createPanel({ title: 'Terreno', body: bodyPanel });
  }

  function buildRenderPanel(): HTMLElement {
    const bodyPanel = createElement('div', 'camposPanel');
    statsEl = createElement('div', 'lecturaCampo', '—');
    bodyPanel.appendChild(statsEl);
    return createPanel({ title: 'Render', body: bodyPanel });
  }

  function attachResize(sidebar: HTMLElement): void {
    const handle = createElement('div', 'asaRedimension asaRedimensionIzquierda');
    sidebar.appendChild(handle);
    onDrag(handle, (dx) => {
      const leaf = findLeaf(layoutStore.getState().root, areaId);
      const current = leaf?.regions.find((item) => item.type === 'UI')?.size ?? defaultRegionSize('UI');
      layoutStore.getState().setRegionSize(areaId, 'UI', current - dx);
    });
  }
}
