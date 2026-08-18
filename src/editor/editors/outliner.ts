import { createElement } from '../../platform/dom';
import type { RegionState } from '../layout/types';
import type { EditorInstance } from './types';

const SCENE_ITEMS: ReadonlyArray<readonly [string, string]> = [
  ['🌐', 'Escena'],
  ['⛰️', 'Terreno'],
  ['🎥', 'Cámara'],
  ['💡', 'Luz direccional'],
];

/* Editor de prueba para demostrar el registro de tipos: un Outliner estático equivalente al de
   Blender. No tiene WebGL; sólo HEADER + WINDOW. */
export class OutlinerEditor implements EditorInstance {
  private host: HTMLElement | null = null;
  private header: HTMLElement | null = null;

  mount(host: HTMLElement): void {
    this.host = host;
    host.style.display = 'flex';
    host.style.flexDirection = 'column';

    const header = createElement('div', 'region cabeceraOutliner', 'Outliner');
    const window = createElement('div', 'region ventanaOutliner');
    const list = createElement('ul', 'listaOutliner');

    for (const [icon, name] of SCENE_ITEMS) {
      const item = createElement('li', 'elementoOutliner');
      item.append(createElement('span', 'iconoOutliner', icon), createElement('span', '', name));
      list.appendChild(item);
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
    this.header.style.height = `${header?.visible ? header.size : 0}px`;
    this.header.style.display = header?.visible ? '' : 'none';
  }

  dispose(): void {
    this.host = null;
    this.header = null;
  }
}
