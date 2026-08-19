import { createElement } from '../../platform/dom';

export interface MenuItem {
  label: string;
  icon?: string;
  onClick?: () => void;
  disabled?: boolean;
  separatorBefore?: boolean;
}

const openDropdowns = new Set<HTMLElement>();

function closeAllMenus(): void {
  for (const dropdown of openDropdowns) {
    dropdown.hidden = true;
    const trigger = dropdown.previousElementSibling;
    trigger?.classList.remove('abierto');
  }
  openDropdowns.clear();
}

/* Menú desplegable genérico: el trigger lo aporta el consumidor (botón de menú de header, selector
   de editor, etc.). Cerrar uno cierra el resto; un clic fuera cierra todos (listener global instalado
   una única vez). */
export function createDropdown(trigger: HTMLButtonElement, items: MenuItem[]): HTMLElement {
  const root = createElement('div', 'menu');
  const dropdown = createElement('div', 'desplegableMenu');
  dropdown.hidden = true;

  const close = (): void => {
    dropdown.hidden = true;
    trigger.classList.remove('abierto');
    openDropdowns.delete(dropdown);
  };
  const open = (): void => {
    closeAllMenus();
    dropdown.hidden = false;
    trigger.classList.add('abierto');
    openDropdowns.add(dropdown);
  };

  for (const item of items) {
    if (item.separatorBefore) {
      dropdown.appendChild(createElement('div', 'separadorMenu'));
    }
    const entry = createElement('button', 'boton elementoMenu', item.label);
    entry.type = 'button';
    entry.disabled = item.disabled ?? false;
    if (item.icon !== undefined) {
      entry.prepend(createElement('span', 'iconoOutliner', item.icon));
    }
    entry.addEventListener('click', () => {
      close();
      if (!entry.disabled) {
        item.onClick?.();
      }
    });
    dropdown.appendChild(entry);
  }

  trigger.type = 'button';
  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    if (dropdown.hidden) {
      open();
    } else {
      close();
    }
  });
  root.addEventListener('pointerdown', (event) => event.stopPropagation());

  root.append(trigger, dropdown);
  return root;
}

/* Menú desplegable de los headers con trigger estándar (botón de texto). */
export function createMenu(label: string, items: MenuItem[]): HTMLElement {
  const trigger = createElement('button', 'botonMenu', label);
  trigger.type = 'button';
  return createDropdown(trigger, items);
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      closeAllMenus();
      return;
    }
    for (const dropdown of [...openDropdowns]) {
      if (dropdown.parentElement !== null && !dropdown.parentElement.contains(target)) {
        dropdown.hidden = true;
        dropdown.previousElementSibling?.classList.remove('abierto');
        openDropdowns.delete(dropdown);
      }
    }
  });
}
