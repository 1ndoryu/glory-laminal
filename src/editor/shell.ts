import { createElement } from '../platform/dom';
import { LayoutView } from './layout/LayoutView';

const WORKSPACES = ['Layout', 'Modeling', 'Shading', 'Scripting'] as const;

/* Compone el marco del editor: barra superior con marca + pestañas de workspace, y el contenedor
   de contenido donde vive el LayoutView (árbol de áreas). Los workspaces extra son reserva. */
export function createShell(root: HTMLElement): void {
  const shell = createElement('div', 'contenedorEditor');

  const topbar = createElement('div', 'barraSuperior');
  topbar.appendChild(createElement('div', 'marca', 'Glory Laminal'));

  const tabs = createElement('nav', 'pestanas');
  for (const name of WORKSPACES) {
    const active = name === 'Layout';
    const tab = createElement('button', active ? 'pestana pestanaActiva' : 'pestana', name);
    tab.type = 'button';
    tab.title = active ? 'Workspace activo' : 'Próximamente';
    tabs.appendChild(tab);
  }
  topbar.appendChild(tabs);
  shell.appendChild(topbar);

  const content = createElement('main', 'contenidoEditor');
  shell.appendChild(content);
  root.appendChild(shell);

  new LayoutView(content);
}
