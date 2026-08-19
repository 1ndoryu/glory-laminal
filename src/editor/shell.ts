import { createElement } from '../platform/dom';
import { LayoutView } from './layout/LayoutView';
import { lucideIcon } from './widgets/icons';
import { createMenu } from './widgets/menu';

interface Workspace {
  id: string;
  name: string;
  icon: string;
}

/* Workspaces equivalentes a los de Blender. Iconos lucide análogos a los de Blender
   (panel-izquierdo, cubo, esfera, terminal). El resto son reserva para fases futuras. */
const WORKSPACES: Workspace[] = [
  { id: 'layout', name: 'Layout', icon: 'layout-panel-left' },
  { id: 'modeling', name: 'Modeling', icon: 'box' },
  { id: 'shading', name: 'Shading', icon: 'circle' },
  { id: 'scripting', name: 'Scripting', icon: 'terminal' },
];

/* Compone la topbar global (pestañas de workspace + menús + selectores de escena/versión) y el
   contenedor de contenido donde vive el LayoutView. Refleja la barra superior de Blender 4.x. */
export function createShell(root: HTMLElement): void {
  const shell = createElement('div', 'contenedorEditor');
  shell.appendChild(buildTopbar());

  const content = createElement('main', 'contenidoEditor');
  shell.appendChild(content);
  root.appendChild(shell);

  new LayoutView(content);
}

function buildTopbar(): HTMLElement {
  const topbar = createElement('header', 'barraSuperior');

  const tabs = createElement('nav', 'pestanas');
  for (const workspace of WORKSPACES) {
    const active = workspace.id === 'layout';
    const tab = createElement('button', active ? 'pestana pestanaActiva' : 'pestana');
    tab.type = 'button';
    tab.title = active ? 'Workspace activo' : 'Próximamente';
    tab.append(lucideIcon(workspace.icon, 14), createElement('span', '', workspace.name));
    tabs.appendChild(tab);
  }
  const addTab = createElement('button', 'pestana pestanaNueva');
  addTab.type = 'button';
  addTab.title = 'Añadir workspace (próximamente)';
  addTab.append(lucideIcon('plus', 14));
  tabs.appendChild(addTab);
  topbar.appendChild(tabs);

  const menus = createElement('nav', 'menusTopbar');
  for (const name of ['File', 'Edit', 'Render', 'Window', 'Help']) {
    menus.appendChild(createMenu(name, [{ label: 'Próximamente', disabled: true }]));
  }
  topbar.appendChild(menus);

  topbar.appendChild(createElement('span', 'separador'));

  const controls = createElement('div', 'controlesTopbar');
  controls.appendChild(
    createMenu('Escena', [
      { label: 'Escena (activa)', disabled: true },
      { label: 'Nueva escena', disabled: true },
    ]),
  );
  controls.appendChild(createElement('span', 'version', 'Glory Laminal 0.1.0'));
  topbar.appendChild(controls);

  return topbar;
}
