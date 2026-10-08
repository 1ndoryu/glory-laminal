import { createElement } from '../../platform/dom';
import type { RegionState } from '../layout/types';
import { buildEditorSelector } from '../widgets/editorSelector';
import { lucideIcon } from '../widgets/icons';
import type { EditorInstance } from './types';

interface SceneItem {
  icon: string;
  name: string;
  active?: boolean;
}

const SCENE_ITEMS: SceneItem[] = [
  { icon: 'globe', name: 'Escena', active: true },
  { icon: 'mountain', name: 'Terreno' },
  { icon: 'camera', name: 'Cámara' },
  { icon: 'sun', name: 'Luz direccional' },
];

/* Editor de prueba para demostrar el registro de tipos: un Outliner estático equivalente al de
   Blender. No tiene WebGL; sólo HEADER + WINDOW. Su cabecera incluye el selector de editor para
   poder volver al 3D Viewport. */
export class OutlinerEditor implements EditorInstance {
  private host: HTMLElement | null = null;
  private header: HTMLElement | null = null;

  mount(host: HTMLElement): void {
    this.host = host;
    host.classList.add('areaOutliner');

    const header = createElement('div', 'region cabeceraOutliner');
    header.append(buildEditorSelector(host.dataset.areaId ?? 'outliner', 'outliner'));

    const window = createElement('div', 'region ventanaOutliner');
    const list = createElement('ul', 'listaOutliner');

    for (const item of SCENE_ITEMS) {
      const entry = createElement('li', item.active ? 'elementoOutliner activo' : 'elementoOutliner');
      const icon = createElement('span', 'iconoOutliner');
      icon.appendChild(lucideIcon(item.icon, 14));
      entry.append(icon, createElement('span', '', item.name));
      list.appendChild(entry);
    }
    window.appendChild(list);
    host.append(header, window);
    this.header = header;
  }

  updateRegions(regions: RegionState[]): void {
    if (this.host === null || this.header === null) {
      return;
    }
    const header = regions.find((region) => region.type === 'HEADER');
    /* Altura viva vía custom property (patrón exento); visibilidad con clase. */
    this.header.style.setProperty('--altoCabeceraOutliner', `${header?.visible ? header.size : 0}px`);
    this.header.classList.toggle('oculto', !(header?.visible ?? false));
  }

  dispose(): void {
    this.host?.classList.remove('areaOutliner');
    this.host = null;
    this.header = null;
  }
}
