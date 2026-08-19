import { createElement } from '../platform/dom';
import { LayoutView } from './layout/LayoutView';

/* Compone el marco del editor: topbar mínima (marca + versión) y el contenedor de contenido donde
   vive el LayoutView (árbol de áreas). Las pestañas de workspace y menús se añadirán cuando tengan
   comportamiento real. */
export function createShell(root: HTMLElement): void {
  const shell = createElement('div', 'contenedorEditor');

  const topbar = createElement('header', 'barraSuperior');
  topbar.append(
    createElement('span', 'marca', 'Glory Laminal'),
    createElement('span', 'separador'),
    createElement('span', 'version', '0.1.0'),
  );
  shell.appendChild(topbar);

  const content = createElement('main', 'contenidoEditor');
  shell.appendChild(content);
  root.appendChild(shell);

  new LayoutView(content);
}
