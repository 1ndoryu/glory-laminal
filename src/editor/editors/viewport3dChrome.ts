import { createElement } from '../../platform/dom';
import { layoutStore } from '../layout/layoutStore';
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

/* Construye el chrome DOM del 3D Viewport (HEADER/FOOTER + canvas) y delega el sidebar en
   viewport3dSidebar. Solo incluye controles con comportamiento real; el resto se reintroducirá
   cuando exista. El motor (WebGL/cámara/terreno) vive en Viewport3DEditor, no aquí. */
export function buildViewportChrome(options: ViewportChromeOptions): ViewportChrome {
  const { areaId, onFrameSelected } = options;

  let wireframeIcon: HTMLElement | null = null;
  let solidIcon: HTMLElement | null = null;
  let orbitButton: HTMLElement | null = null;
  let orthoButton: HTMLElement | null = null;
  let fpsEl: HTMLElement | null = null;
  let cameraEl: HTMLElement | null = null;

  const sidebar: ViewportSidebar = buildViewportSidebar({ areaId, onFrameSelected });
  const header = buildHeader();
  const window = createElement('div', 'region ventanaViewport');
  const canvas = document.createElement('canvas');
  canvas.className = 'lienzoViewport';
  window.appendChild(canvas);
  const footer = buildFooter();

  header.style.gridArea = 'header';
  window.style.gridArea = 'window';
  sidebar.element.style.gridArea = 'ui';
  footer.style.gridArea = 'footer';

  const sync = (state: EditorState): void => {
    wireframeIcon?.classList.toggle('activo', state.wireframe);
    solidIcon?.classList.toggle('activo', !state.wireframe);
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
    elements: { header, ui: sidebar.element, window, footer, canvas },
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

    const editorLabel = createElement('span', 'selectorEditor');
    editorLabel.append(lucideIcon('box', 14), createElement('span', '', '3D Viewport'));
    element.appendChild(editorLabel);

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

    element.appendChild(createElement('span', 'separador'));

    const shadingGroup = createElement('div', 'grupoIconos');
    wireframeIcon = makeIconToggle('box', 'Wireframe', () => editorStore.getState().setWireframe(true));
    solidIcon = makeIconToggle('circle', 'Sólido', () => editorStore.getState().setWireframe(false));
    shadingGroup.append(wireframeIcon, solidIcon);
    element.appendChild(shadingGroup);

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

  function buildFooter(): HTMLElement {
    const footer = createElement('footer', 'region pieViewport');

    const left = createElement('div', 'grupoPie');
    left.append(
      createElement('span', 'datoViewport', 'Object Mode'),
      createElement(
        'span',
        'ayudaViewport',
        'MMB órbita · Shift+MMB pan · rueda/Ctrl+MMB zoom · numpad 1/3/7/9 vistas · 5 orto · . frame · N sidebar',
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
      createElement('span', 'version', '0.1.0'),
    );
    footer.appendChild(right);

    return footer;
  }
}
