import { createElement } from '../../platform/dom';
import { listEditorDefinitions } from '../editors/registry';
import { layoutStore } from '../layout/layoutStore';
import { lucideIcon } from './icons';
import { createDropdown } from './menu';

const EDITOR_ICONS: Record<string, string> = {
  viewport3d: 'box',
  outliner: 'list-tree',
};

/* Selector de tipo de editor compartido (equivale al selector de \"space\" de Blender): muestra el
   nombre del editor actual y abre un menú para cambiar el área entre los editores registrados. */
export function buildEditorSelector(areaId: string, currentEditorId: string): HTMLElement {
  const current = listEditorDefinitions().find((definition) => definition.id === currentEditorId);
  const trigger = createElement('button', 'selectorEditor');
  trigger.append(
    lucideIcon(EDITOR_ICONS[currentEditorId] ?? 'box', 14),
    createElement('span', '', current?.name ?? currentEditorId),
  );

  const items = listEditorDefinitions().map((definition) => ({
    label: definition.name,
    onClick: () => layoutStore.getState().setEditorType(areaId, definition.id),
  }));
  return createDropdown(trigger, items);
}
