import { createElement, onDrag } from '../../platform/dom';
import { defaultRegionSize, findLeaf } from '../layout/layoutTree';
import { layoutStore } from '../layout/layoutStore';
import type { RegionType } from '../layout/types';
import { editorStore, type EditorState } from '../store';
import { lucideIcon } from '../widgets/icons';
import { createMenu } from '../widgets/menu';
import { buildViewportSidebar, type ViewportSidebar } from './viewport3dSidebar';

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

type ToolId = 'select' | 'cursor' | 'move' | 'rotate' | 'scale' | 'annotate' | 'measure';

const TOOLS: ReadonlyArray<{ id: ToolId; icon: string; name: string }> = [
  { id: 'select', icon: 'mouse-pointer', name: 'Select Box' },
  { id: 'cursor', icon: 'crosshair', name: '3D Cursor' },
  { id: 'move', icon: 'move', name: 'Move' },
  { id: 'rotate', icon: 'rotate-3d', name: 'Rotate' },
  { id: 'scale', icon: 'scaling', name: 'Scale' },
  { id: 'annotate', icon: 'pen-line', name: 'Annotate' },
  { id: 'measure', icon: 'ruler', name: 'Measure' },
];

/* Construye el chrome DOM del 3D Viewport (HEADER/TOOLS/FOOTER + canvas) y delega el sidebar en
   viewport3dSidebar. Mantiene sus controles en privado y expone `sync` para reflejar el estado
   global. El motor (WebGL/cámara/terreno) vive en Viewport3DEditor, no aquí. */
export function buildViewportChrome(options: ViewportChromeOptions): ViewportChrome {
  const { areaId, onFrameSelected } = options;

  let wireframeIcon: HTMLElement | null = null;
  let solidIcon: HTMLElement | null = null;
  let renderedIcon: HTMLElement | null = null;
  let orbitButton: HTMLElement | null = null;
  let orthoButton: HTMLElement | null = null;
  let fpsEl: HTMLElement | null = null;
  let cameraEl: HTMLElement | null = null;

  const sidebar: ViewportSidebar = buildViewportSidebar({ areaId, onFrameSelected });
  const header = buildHeader();
  const tools = buildTools(sidebar.setActiveTool);
  const window = createElement('div', 'region ventanaViewport');
  const canvas = document.createElement('canvas');
  canvas.className = 'lienzoViewport';
  window.appendChild(canvas);
  const footer = buildFooter();

  for (const [region, name] of [
    [header, 'header'],
    [tools, 'tools'],
    [window, 'window'],
    [sidebar.element, 'ui'],
    [footer, 'footer'],
  ] as const) {
    region.style.gridArea = name;
  }

  const sync = (state: EditorState): void => {
    wireframeIcon?.classList.toggle('activo', state.wireframe);
    solidIcon?.classList.toggle('activo', !state.wireframe);
    renderedIcon?.classList.toggle('activo', false);
    orbitButton?.classList.toggle('activo', state.orbitMethod === 'trackball');
    orbitButton?.setAttribute(
      'title',
      state.orbitMethod === 'turntable' ? 'Órbita: Turntable' : 'Órbita: Trackball',
    );
    orthoButton?.classList.toggle('activo', state.orthographic);
    orthoButton?.setAttribute(
      'title',
      state.orthographic ? 'Proyección: Ortográfica (Numpad 5)' : 'Proyección: Perspectiva (Numpad 5)',
    );
    sidebar.sync(state);
  };

  return {
    elements: { header, tools, ui: sidebar.element, window, footer, canvas },
    readouts: {
      fps: fpsEl!,
      camera: cameraEl!,
      cameraInfo: sidebar.readouts.cameraInfo,
      stats: sidebar.readouts.stats,
    },
    sync,
  };

  function buildHeader(): HTMLElement {
    const element = createElement('header', 'region cabeceraViewport');

    const editorSelector = createElement('button', 'botonMenu selectorEditor');
    editorSelector.type = 'button';
    editorSelector.title = 'Tipo de editor';
    editorSelector.append(lucideIcon('box', 14), createElement('span', '', '3D Viewport'));
    element.appendChild(editorSelector);

    element.appendChild(createMenu('Object Mode', [{ label: 'Próximamente', disabled: true }]));
    element.appendChild(
      createMenu('View', [
        {
          label: 'Split Vertical (Outliner)',
          icon: '▥',
          onClick: () => layoutStore.getState().splitArea(areaId, 'row', 'outliner'),
        },
        {
          label: 'Split Horizontal (Outliner)',
          icon: '▤',
          onClick: () => layoutStore.getState().splitArea(areaId, 'column', 'outliner'),
        },
        { label: 'Join Area', icon: '◫', onClick: () => layoutStore.getState().joinArea(areaId) },
      ]),
    );
    for (const name of ['Select', 'Add', 'Object']) {
      element.appendChild(createMenu(name, [{ label: 'Próximamente', disabled: true }]));
    }

    element.appendChild(createElement('span', 'separador'));

    const shadingGroup = createElement('div', 'grupoIconos');
    wireframeIcon = makeIconToggle('box', 'Wireframe', () => editorStore.getState().setWireframe(true));
    solidIcon = makeIconToggle('circle', 'Sólido', () => editorStore.getState().setWireframe(false));
    renderedIcon = makeIconToggle('sun', 'Renderizado (próximamente)', () =>
      editorStore.getState().setWireframe(false),
    );
    shadingGroup.append(wireframeIcon, solidIcon, renderedIcon);
    element.appendChild(shadingGroup);

    const overlay = makeIconToggle('eye', 'Overlays', () => overlay.classList.toggle('activo'));
    overlay.classList.add('activo');
    element.appendChild(overlay);

    element.appendChild(createElement('span', 'separadorChico'));

    orbitButton = makeIconToggle('orbit', 'Órbita', () => {
      const state = editorStore.getState();
      state.setOrbitMethod(state.orbitMethod === 'turntable' ? 'trackball' : 'turntable');
    });
    orthoButton = makeIconToggle('camera', 'Perspectiva/Ortográfica', () =>
      editorStore.getState().toggleOrthographic(),
    );
    const frameButton = makeIconToggle('frame', 'Frame Selected', onFrameSelected);
    element.append(orbitButton, orthoButton, frameButton);

    return element;
  }

  function makeIconToggle(icon: string, title: string, onClick: () => void): HTMLButtonElement {
    const button = createElement('button', 'botonIcono');
    button.type = 'button';
    button.title = title;
    button.append(lucideIcon(icon, 14));
    button.addEventListener('click', onClick);
    return button;
  }

  function buildTools(onToolChange: (name: string) => void): HTMLElement {
    const tools = createElement('aside', 'region barraLateral');

    const header = createElement('div', 'cabeceraBarra');
    const collapse = createElement('button', 'boton botonIcono botonColapsar');
    collapse.type = 'button';
    collapse.title = 'Ocultar herramientas (T)';
    collapse.append(lucideIcon('chevron-left', 14));
    collapse.addEventListener('click', () =>
      layoutStore.getState().setRegionVisible(areaId, 'TOOLS', false),
    );
    header.appendChild(collapse);
    tools.appendChild(header);

    const list = createElement('div', 'listaHerramientas');
    for (const tool of TOOLS) {
      const button = createElement('button', 'boton botonHerramienta');
      button.type = 'button';
      button.title = tool.name;
      button.append(lucideIcon(tool.icon, 18));
      button.classList.toggle('botonHerramientaActiva', tool.id === 'move');
      button.addEventListener('click', () => {
        for (const child of list.children) {
          child.classList.remove('botonHerramientaActiva');
        }
        button.classList.add('botonHerramientaActiva');
        onToolChange(tool.name);
      });
      list.appendChild(button);
    }
    tools.appendChild(list);

    attachSidebarResize(tools, 'TOOLS');
    return tools;
  }

  function buildFooter(): HTMLElement {
    const footer = createElement('footer', 'region pieViewport');

    const left = createElement('div', 'grupoPie');
    left.append(
      createElement('span', 'datoViewport', 'Object Mode'),
      createElement(
        'span',
        'ayudaViewport',
        'MMB órbita · Shift+MMB pan · rueda/Ctrl+MMB zoom · numpad 1/3/7/9 vistas · 5 orto · . frame',
      ),
    );
    footer.appendChild(left);

    footer.appendChild(createElement('span', 'separador'));

    const right = createElement('div', 'grupoPie grupoPieDerecha');
    fpsEl = createElement('span', 'datoViewport');
    cameraEl = createElement('span', 'datoViewport');
    right.append(
      fpsEl,
      createElement('span', 'datoViewport punto', '·'),
      cameraEl,
      createElement('span', 'version', 'Glory Laminal 0.1.0'),
    );
    footer.appendChild(right);

    return footer;
  }

  function attachSidebarResize(sidebar: HTMLElement, region: RegionType): void {
    const handle = createElement('div', 'asaRedimension');
    sidebar.appendChild(handle);
    onDrag(handle, (dx) => {
      const leaf = findLeaf(layoutStore.getState().root, areaId);
      const current =
        leaf?.regions.find((item) => item.type === region)?.size ?? defaultRegionSize(region);
      layoutStore.getState().setRegionSize(areaId, region, current + dx);
    });
  }
}
