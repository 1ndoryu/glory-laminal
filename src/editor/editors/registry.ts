import type { RegionType } from '../layout/types';

export interface EditorDefinition {
  id: string;
  name: string;
  /** Regiones por defecto del editor (equivalente a las ARegion de un SpaceType). */
  regions: RegionType[];
}

const definitions = new Map<string, EditorDefinition>();

export function registerEditor(definition: EditorDefinition): void {
  if (definitions.has(definition.id)) {
    throw new Error(`Editor ya registrado: ${definition.id}`);
  }
  definitions.set(definition.id, definition);
}

export function getEditorDefinition(id: string): EditorDefinition {
  const definition = definitions.get(id);
  if (definition === undefined) {
    throw new Error(`Editor no registrado: ${id}`);
  }
  return definition;
}

export function registerBuiltinEditors(): void {
  registerEditor({
    id: 'viewport3d',
    name: '3D Viewport',
    regions: ['HEADER', 'TOOLS', 'UI', 'FOOTER', 'WINDOW'],
  });
  registerEditor({
    id: 'outliner',
    name: 'Outliner',
    regions: ['HEADER', 'WINDOW'],
  });
}
