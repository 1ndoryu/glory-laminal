import { createElement } from '../../platform/dom';
import { lucideIcon } from './icons';

export interface PanelOptions {
  title: string;
  collapsed?: boolean;
  body: HTMLElement;
}

/* Panel colapsable equivalente a los paneles de las regions de Blender: cabecera #3d3d3d con
   chevron y cuerpo con los campos. */
export function createPanel(options: PanelOptions): HTMLElement {
  const panel = createElement('section', 'panel');
  const header = createElement('button', 'boton cabeceraPanel');
  header.type = 'button';
  const arrow = createElement('span', 'flechaPanel');
  arrow.append(lucideIcon(options.collapsed ? 'chevron-right' : 'chevron-down', 12));
  header.append(arrow, createElement('span', 'tituloPanel', options.title));

  const body = createElement('div', 'cuerpoPanel');
  body.append(options.body);
  body.hidden = options.collapsed ?? false;

  header.addEventListener('click', () => {
    body.hidden = !body.hidden;
    arrow.replaceChildren(lucideIcon(body.hidden ? 'chevron-right' : 'chevron-down', 12));
  });

  panel.append(header, body);
  return panel;
}
