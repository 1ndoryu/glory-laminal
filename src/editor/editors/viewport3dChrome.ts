import { createElement, onDrag } from '../../platform/dom';
import { defaultRegionSize, findLeaf } from '../layout/layoutTree';
import { layoutStore } from '../layout/layoutStore';
import type { RegionType } from '../layout/types';
import { editorStore, type EditorState } from '../store';
import { fieldRow, makeCheckbox, makeNumber, makeRange, makeSelect } from '../widgets/fields';
import { createMenu } from '../widgets/menu';
import { createPanel } from '../widgets/panel';

export interface ViewportReadouts {
  fps: HTMLElement;
  camera: HTMLElement;
  cameraInfo: HTMLElement;
  stats: HTMLElement;
}

export interface ViewportChrome {
  elements: {
    header: HTMLElement;
    tools: HTMLElement;
    ui: HTMLElement;
    window: HTMLElement;
    footer: HTMLElement;
    canvas: HTMLCanvasElement;
  };
  readouts: ViewportReadouts;
  sync: (state: EditorState) => void;
}

export interface ViewportChromeOptions {
  areaId: string;
  onFrameSelected: () => void;
}

/* Construye el chrome DOM del 3D Viewport (HEADER/TOOLS/UI/FOOTER + canvas). Mantiene sus
   controles en privado y expone `sync` para reflejar el estado global del editor en los widgets.
   El motor (WebGL/cámara/terreno) vive en Viewport3DEditor, no aquí. */
export function buildViewportChrome(options: ViewportChromeOptions): ViewportChrome {
  const { areaId, onFrameSelected } = options;

  let wireframeButton: HTMLButtonElement | null = null;
  let orthoButton: HTMLButtonElement | null = null;
  let orbitButton: HTMLButtonElement | null = null;
  let orbitSelect: HTMLSelectElement | null = null;
  let orthoCheck: HTMLInputElement | null = null;
  let wireframeCheck: HTMLInputElement | null = null;
  let seedInput: HTMLInputElement | null = null;
  let amplitudeInput: HTMLInputElement | null = null;
  let amplitudeValue: HTMLElement | null = null;
  let octavesInput: HTMLInputElement | null = null;
  let octavesValue: HTMLElement | null = null;
  let fpsEl: HTMLElement | null = null;
  let cameraEl: HTMLElement | null = null;
  let cameraInfoEl: HTMLElement | null = null;
  let statsEl: HTMLElement | null = null;

  const header = buildHeader();
  const tools = buildTools();
  const ui = buildUi();
  const window = createElement('div', 'region ventanaViewport');
  const canvas = document.createElement('canvas');
  canvas.className = 'lienzoViewport';
  window.appendChild(canvas);
  const footer = buildFooter();

  for (const [region, name] of [
    [header, 'header'],
    [tools, 'tools'],
    [window, 'window'],
    [ui, 'ui'],
    [footer, 'footer'],
  ] as const) {
    region.style.gridArea = name;
  }

  const sync = (state: EditorState): void => {
    if (wireframeButton !== null) {
      wireframeButton.textContent = state.wireframe ? 'Wireframe' : 'Sólido';
    }
    if (orthoButton !== null) {
      orthoButton.textContent = state.orthographic ? 'Ortográfica' : 'Perspectiva';
    }
    if (orbitButton !== null) {
      orbitButton.textContent = state.orbitMethod === 'turntable' ? 'Turntable' : 'Trackball';
    }
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
    elements: { header, tools, ui, window, footer, canvas },
    readouts: {
      fps: fpsEl!,
      camera: cameraEl!,
      cameraInfo: cameraInfoEl!,
      stats: statsEl!,
    },
    sync,
  };

  function buildHeader(): HTMLElement {
    const element = createElement('header', 'region cabeceraViewport');
    element.appendChild(createElement('span', 'nombreEditor', '3D Viewport'));

    element.appendChild(createMenu('Object Mode', [{ label: 'Próximamente', disabled: true }]));
    element.appendChild(
      createMenu('View', [
        {
          label: 'Split Vertical (Outliner)',
          onClick: () => layoutStore.getState().splitArea(areaId, 'row', 'outliner'),
        },
        {
          label: 'Split Horizontal (Outliner)',
          onClick: () => layoutStore.getState().splitArea(areaId, 'column', 'outliner'),
        },
        { label: 'Join Area', onClick: () => layoutStore.getState().joinArea(areaId) },
      ]),
    );
    for (const name of ['Select', 'Add', 'Object']) {
      element.appendChild(createMenu(name, [{ label: 'Próximamente', disabled: true }]));
    }

    element.appendChild(createElement('span', 'separador'));

    wireframeButton = createElement('button', 'boton botonCabecera');
    wireframeButton.type = 'button';
    wireframeButton.addEventListener('click', () => editorStore.getState().toggleWireframe());

    orthoButton = createElement('button', 'boton botonCabecera');
    orthoButton.type = 'button';
    orthoButton.addEventListener('click', () => editorStore.getState().toggleOrthographic());

    orbitButton = createElement('button', 'boton botonCabecera');
    orbitButton.type = 'button';
    orbitButton.addEventListener('click', () => {
      const state = editorStore.getState();
      state.setOrbitMethod(state.orbitMethod === 'turntable' ? 'trackball' : 'turntable');
    });

    element.append(wireframeButton, orthoButton, orbitButton);
    return element;
  }

  function buildTools(): HTMLElement {
    const tools = createElement('aside', 'region barraLateral');

    const sidebarHeader = createElement('div', 'cabeceraBarra');
    const collapse = createElement('button', 'boton botonColapsar', '◂');
    collapse.type = 'button';
    collapse.title = 'Ocultar herramientas (T)';
    collapse.addEventListener('click', () =>
      layoutStore.getState().setRegionVisible(areaId, 'TOOLS', false),
    );
    sidebarHeader.append(collapse, createElement('span', 'tituloBarra', 'Herramientas'));
    tools.appendChild(sidebarHeader);

    const body = createElement('div', 'listaHerramientas');
    const move = createElement('button', 'boton botonHerramienta botonHerramientaActiva', 'Move');
    const rotate = createElement('button', 'boton botonHerramienta', 'Rotate');
    const scale = createElement('button', 'boton botonHerramienta', 'Scale');
    move.type = 'button';
    rotate.type = 'button';
    scale.type = 'button';
    body.append(move, rotate, scale);
    tools.appendChild(createPanel({ title: 'Herramientas', body }));

    attachSidebarResize(tools, 'TOOLS');
    return tools;
  }

  function buildUi(): HTMLElement {
    const ui = createElement('aside', 'region barraLateral');

    const sidebarHeader = createElement('div', 'cabeceraBarra');
    const collapse = createElement('button', 'boton botonColapsar', '▸');
    collapse.type = 'button';
    collapse.title = 'Ocultar sidebar (N)';
    collapse.addEventListener('click', () =>
      layoutStore.getState().setRegionVisible(areaId, 'UI', false),
    );
    sidebarHeader.append(collapse, createElement('span', 'tituloBarra', 'Sidebar'));
    ui.appendChild(sidebarHeader);

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
    const frameButton = createElement('button', 'boton botonRelleno botonPanel', 'Frame Selected');
    frameButton.type = 'button';
    frameButton.addEventListener('click', onFrameSelected);
    cameraInfoEl = createElement('div', 'lecturaCampo');
    viewBody.append(
      fieldRow('Órbita', orbitSelect),
      fieldRow('Ortográfica', orthoCheck),
      frameButton,
      cameraInfoEl,
    );
    ui.appendChild(createPanel({ title: 'Vista', body: viewBody }));

    const terrainBody = createElement('div', 'camposPanel');
    const state = editorStore.getState();
    seedInput = makeNumber(state.terrain.seed, (seed) =>
      editorStore.getState().setTerrain({ seed }),
    );
    amplitudeInput = makeRange(1, 60, 1, state.terrain.amplitude, (amplitude) =>
      editorStore.getState().setTerrain({ amplitude }),
    );
    amplitudeValue = createElement('span', 'valorCampo', String(state.terrain.amplitude));
    octavesInput = makeRange(1, 8, 1, state.terrain.octaves, (octaves) =>
      editorStore.getState().setTerrain({ octaves }),
    );
    octavesValue = createElement('span', 'valorCampo', String(state.terrain.octaves));
    wireframeCheck = makeCheckbox(state.wireframe, () => editorStore.getState().toggleWireframe());
    const regenerateButton = createElement('button', 'boton botonRelleno botonPanel', 'Regenerar');
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
    ui.appendChild(createPanel({ title: 'Terreno', body: terrainBody }));

    const renderBody = createElement('div', 'camposPanel');
    statsEl = createElement('div', 'lecturaCampo', '—');
    renderBody.appendChild(statsEl);
    ui.appendChild(createPanel({ title: 'Render', body: renderBody }));

    attachSidebarResize(ui, 'UI');
    return ui;
  }

  function buildFooter(): HTMLElement {
    const footer = createElement('footer', 'region pieViewport');
    fpsEl = createElement('span', 'datoViewport');
    cameraEl = createElement('span', 'datoViewport');
    const hint = createElement(
      'span',
      'ayudaViewport',
      'MMB órbita · Shift+MMB pan · rueda zoom · 1/3/7 vistas · 5 orto · T/N barras',
    );
    footer.append(
      createElement('span', 'separador'),
      cameraEl,
      fpsEl,
      createElement('span', 'separador'),
      hint,
    );
    return footer;
  }

  function attachSidebarResize(sidebar: HTMLElement, region: RegionType): void {
    const className =
      region === 'UI' ? 'asaRedimension asaRedimensionIzquierda' : 'asaRedimension';
    const handle = createElement('div', className);
    sidebar.appendChild(handle);
    onDrag(handle, (dx) => {
      const leaf = findLeaf(layoutStore.getState().root, areaId);
      const current =
        leaf?.regions.find((item) => item.type === region)?.size ?? defaultRegionSize(region);
      const delta = region === 'TOOLS' ? dx : -dx;
      layoutStore.getState().setRegionSize(areaId, region, current + delta);
    });
  }
}
