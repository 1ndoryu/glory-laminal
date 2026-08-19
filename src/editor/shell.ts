import { createElement } from '../platform/dom';
import { LayoutView } from './layout/LayoutView';

/* Compone el marco del editor: un único contenedor de contenido donde vive el LayoutView (árbol
   de áreas). Sin topbar: el viewport ocupa toda la ventana y la marca/versión se reintroducirán
   sólo si aportan valor. */
export function createShell(root: HTMLElement): void {
  const content = createElement('main', 'contenidoEditor');
  root.appendChild(content);
  new LayoutView(content);
}
