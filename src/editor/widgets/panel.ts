import { createElement } from '../../platform/dom';

export interface PanelOptions {
  title: string;
  collapsed?: boolean;
  body: HTMLElement;
}

/* Panel colapsable equivalente a los paneles de las regions de Blender. */
export function createPanel(options: PanelOptions): HTMLElement {
  const panel = createElement('section', 'panel');
  const header = createElement('button', 'boton cabeceraPanel');
  header.type = 'button';
  const arrow = createElement('span', 'flechaPanel', options.collapsed ? '▸' : '▾');
  header.append(arrow, createElement('span', 'tituloPanel', options.title));

  const body = createElement('div', 'cuerpoPanel');
  body.append(options.body);
  body.hidden = options.collapsed ?? false;

  header.addEventListener('click', () => {
    body.hidden = !body.hidden;
    arrow.textContent = body.hidden ? '▸' : '▾';
  });

  panel.append(header, body);
  return panel;
}
