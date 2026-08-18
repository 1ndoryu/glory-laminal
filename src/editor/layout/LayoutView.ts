import { createElement, onDrag } from '../../platform/dom';
import { createEditor } from '../editors/factory';
import type { EditorInstance } from '../editors/types';
import { layoutStore } from './layoutStore';
import type { AreaNode, EditorArea, SplitArea, SplitOrientation } from './types';

interface SplitHost {
  root: HTMLElement;
  first: HTMLElement;
  second: HTMLElement;
  handle: HTMLElement;
  orientation: SplitOrientation;
}

/* Reconciliador del árbol de layout → DOM. Reutiliza los contenedores por id para que el canvas
   WebGL2 y el estado de cada editor sobrevivan a split/join/redimensionar. Los editores crean su
   DOM una sola vez en mount; aquí sólo se reubican y se les pasa el estado de regiones. */
export class LayoutView {
  private readonly leafHosts = new Map<string, HTMLElement>();
  private readonly editors = new Map<string, EditorInstance>();
  private readonly splitHosts = new Map<string, SplitHost>();
  private readonly unsubscribe: () => void;

  constructor(private readonly container: HTMLElement) {
    this.unsubscribe = layoutStore.subscribe(() => this.render());
    this.render();
  }

  dispose(): void {
    this.unsubscribe();
    for (const editor of this.editors.values()) {
      editor.dispose();
    }
  }

  private render(): void {
    this.renderNode(layoutStore.getState().root, this.container);
  }

  private renderNode(node: AreaNode, container: HTMLElement): HTMLElement {
    return node.kind === 'split' ? this.renderSplit(node, container) : this.renderLeaf(node, container);
  }

  private renderLeaf(area: EditorArea, container: HTMLElement): HTMLElement {
    let host = this.leafHosts.get(area.id);
    if (host === undefined) {
      host = createElement('div', 'area');
      host.dataset.areaId = area.id;
      this.leafHosts.set(area.id, host);
      const editor = createEditor(area.editor);
      this.editors.set(area.id, editor);
      editor.mount(host);
    }
    if (host.parentElement !== container) {
      container.appendChild(host);
    }
    this.editors.get(area.id)?.updateRegions(area.regions);
    return host;
  }

  private renderSplit(split: SplitArea, container: HTMLElement): HTMLElement {
    let host = this.splitHosts.get(split.id);
    if (host === undefined) {
      host = this.createSplitHost(split.id, split.orientation);
      container.appendChild(host.root);
      this.splitHosts.set(split.id, host);
    } else if (host.root.parentElement !== container) {
      container.appendChild(host.root);
    }
    host.orientation = split.orientation;
    this.applyRatio(host.root, split.orientation, split.ratio);
    this.renderNode(split.first, host.first);
    this.renderNode(split.second, host.second);
    return host.root;
  }

  private createSplitHost(id: string, orientation: SplitOrientation): SplitHost {
    const root = createElement('div', 'division');
    const first = createElement('div', 'panelDivision');
    const second = createElement('div', 'panelDivision');
    const handle = createElement('div', 'asaDivision');
    handle.title = 'Arrastrar para redimensionar';
    root.append(first, handle, second);

    const host: SplitHost = { root, first, second, handle, orientation };
    onDrag(handle, (_dx, _dy, event) => {
      const rect = root.getBoundingClientRect();
      const raw =
        host.orientation === 'row'
          ? (event.clientX - rect.left) / rect.width
          : (event.clientY - rect.top) / rect.height;
      const ratio = Math.min(0.9, Math.max(0.1, raw));
      layoutStore.getState().setSplitRatio(id, ratio);
    });
    return host;
  }

  private applyRatio(root: HTMLElement, orientation: SplitOrientation, ratio: number): void {
    root.classList.toggle('divisionFila', orientation === 'row');
    root.classList.toggle('divisionColumna', orientation === 'column');
    const first = `${(ratio * 100).toFixed(2)}%`;
    const second = `${((1 - ratio) * 100).toFixed(2)}%`;
    if (orientation === 'row') {
      root.style.gridTemplateColumns = `${first} 4px ${second}`;
      root.style.gridTemplateRows = '';
    } else {
      root.style.gridTemplateRows = `${first} 4px ${second}`;
      root.style.gridTemplateColumns = '';
    }
  }
}
