import { createElement, onDrag } from '../../platform/dom';
import { defaultRegionSize, findLeaf } from '../layout/layoutTree';
import { layoutStore } from '../layout/layoutStore';
import { editorStore, type EditorState } from '../store';
import { fieldRow, makeCheckbox, makeNumber, makeRange, makeSelect } from '../widgets/fields';
import { createPanel } from '../widgets/panel';

export interface ViewportSidebar {
  element: HTMLElement;
  readouts: { cameraInfo: HTMLElement; stats: HTMLElement };
  setActiveTool: (name: string) => void;
  sync: (state: EditorState) => void;
}

export interface ViewportSidebarOptions {
  areaId: string;
  onFrameSelected: () => void;
}

type SidebarTab = 'item' | 'tool' | 'view';

/* Sidebar derecho del viewport (equivale a la region UI de Blender): pestañas Item/Tool/View y
   sus paneles. Expone los readouts que el viewport actualiza (cámara, estadísticas) y un setter
   para reflejar la herramienta activa elegida en el toolbar. */
export function buildViewportSidebar(options: ViewportSidebarOptions): ViewportSidebar {
  const { areaId, onFrameSelected } = options;

  let activeTab: SidebarTab = 'view';
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
  let toolNameEl: HTMLElement | null = null;
  const tabPanels = new Map<SidebarTab, HTMLElement>();

  const ui = createElement('aside', 'region barraLateral');

  const tabs = createElement('div', 'pestanasSidebar');
  const tabDefs: ReadonlyArray<{ id: SidebarTab; label: string }> = [
    { id: 'item', label: 'Item' },
    { id: 'tool', label: 'Tool' },
    { id: 'view', label: 'View' },
  ];
  for (const tab of tabDefs) {
    const button = createElement('button', 'boton pestanaSidebar', tab.label);
    button.type = 'button';
    button.classList.toggle('pestanaSidebarActiva', tab.id === activeTab);
    button.addEventListener('click', () => {
      activeTab = tab.id;
      for (const child of tabs.children) {
        child.classList.remove('pestanaSidebarActiva');
      }
      button.classList.add('pestanaSidebarActiva');
      for (const [id, panel] of tabPanels) {
        panel.style.display = id === tab.id ? '' : 'none';
      }
    });
    tabs.appendChild(button);
  }
  ui.appendChild(tabs);

  const body = createElement('div', 'cuerpoSidebar');
  body.style.overflowY = 'auto';
  body.style.flex = '1 1 auto';
  ui.appendChild(body);

  tabPanels.set('item', buildItemTab());
  tabPanels.set('tool', buildToolTab());
  tabPanels.set('view', buildViewTab());
  body.append(tabPanels.get('view')!, tabPanels.get('item')!, tabPanels.get('tool')!);
  tabPanels.get('item')!.style.display = 'none';
  tabPanels.get('tool')!.style.display = 'none';

  attachResize(ui, 'UI');

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
    setActiveTool: (name) => {
      if (toolNameEl !== null) {
        toolNameEl.textContent = name;
      }
    },
    sync,
  };

  function buildItemTab(): HTMLElement {
    const tab = createElement('div', 'pestanaCuerpo');

    const transformBody = createElement('div', 'camposPanel');
    transformBody.append(fieldRow('Location', makeVector('location')), fieldRow('Rotation', makeVector('rotation')), fieldRow('Scale', makeVector('scale', '1.000')));
    tab.appendChild(createPanel({ title: 'Transform', body: transformBody }));

    const terrainBody = createElement('div', 'camposPanel');
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

    terrainBody.append(
      fieldRow('Semilla', seedInput),
      fieldRow('Amplitud', amplitudeInput),
      amplitudeValue,
      fieldRow('Octavas', octavesInput),
      octavesValue,
      fieldRow('Wireframe', wireframeCheck),
      regenerateButton,
    );
    tab.appendChild(createPanel({ title: 'Terreno', body: terrainBody }));
    return tab;
  }

  function buildToolTab(): HTMLElement {
    const tab = createElement('div', 'pestanaCuerpo');
    const body = createElement('div', 'camposPanel');
    toolNameEl = createElement('div', 'lecturaCampo', 'Move');
    body.append(fieldRow('Active Tool', toolNameEl));
    tab.appendChild(createPanel({ title: 'Herramienta', body }));
    return tab;
  }

  function buildViewTab(): HTMLElement {
    const tab = createElement('div', 'pestanaCuerpo');

    const viewBody = createElement('div', 'camposPanel');
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
    viewBody.append(
      fieldRow('Órbita', orbitSelect),
      fieldRow('Ortográfica', orthoCheck),
      frameButton,
      cameraInfoEl,
    );
    tab.appendChild(createPanel({ title: 'Vista', body: viewBody }));

    const renderBody = createElement('div', 'camposPanel');
    statsEl = createElement('div', 'lecturaCampo', '—');
    renderBody.appendChild(statsEl);
    tab.appendChild(createPanel({ title: 'Render', body: renderBody }));
    return tab;
  }

  function makeVector(kind: 'location' | 'rotation' | 'scale', initial = '0.000'): HTMLElement {
    const row = createElement('div', 'filaVector');
    for (const axis of ['X', 'Y', 'Z'] as const) {
      const input = createElement('input', 'numeroCampo numeroVector');
      input.type = 'number';
      input.step = '0.001';
      input.value = initial;
      input.disabled = true;
      input.title = `${kind} ${axis}`;
      row.appendChild(input);
    }
    return row;
  }

  function attachResize(sidebar: HTMLElement, region: 'TOOLS' | 'UI'): void {
    const handle = createElement('div', 'asaRedimension asaRedimensionIzquierda');
    sidebar.appendChild(handle);
    onDrag(handle, (dx) => {
      const leaf = findLeaf(layoutStore.getState().root, areaId);
      const current =
        leaf?.regions.find((item) => item.type === region)?.size ?? defaultRegionSize(region);
      layoutStore.getState().setRegionSize(areaId, region, current - dx);
    });
  }
}
