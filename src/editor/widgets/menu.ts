import { createElement } from '../../platform/dom';

export interface MenuItem {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

const openDropdowns = new Set<HTMLElement>();

function closeAllMenus(): void {
  for (const dropdown of openDropdowns) {
    dropdown.hidden = true;
  }
  openDropdowns.clear();
}

/* Menú desplegable de los headers, equivalente a los menús de Blender. Cerrar uno cierra el
   resto; un clic fuera cierra todos (listener global instalado una única vez). */
export function createMenu(label: string, items: MenuItem[]): HTMLElement {
  const root = createElement('div', 'menu');
  const trigger = createElement('button', 'boton disparadorMenu', label);
  trigger.type = 'button';
  const dropdown = createElement('div', 'desplegableMenu');
  dropdown.hidden = true;

  const close = (): void => {
    dropdown.hidden = true;
    openDropdowns.delete(dropdown);
  };
  const open = (): void => {
    closeAllMenus();
    dropdown.hidden = false;
    openDropdowns.add(dropdown);
  };

  for (const item of items) {
    const entry = createElement('button', 'boton elementoMenu', item.label);
    entry.type = 'button';
    entry.disabled = item.disabled ?? false;
    entry.addEventListener('click', () => {
      close();
      if (!entry.disabled) {
        item.onClick?.();
      }
    });
    dropdown.appendChild(entry);
  }

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
        openDropdowns.delete(dropdown);
      }
    }
  });
}
