import type { EditorInstance } from './types';
import { OutlinerEditor } from './outliner';
import { Viewport3DEditor } from './viewport3d';

type EditorFactory = () => EditorInstance;

const factories = new Map<string, EditorFactory>();

export function registerEditorFactory(id: string, factory: EditorFactory): void {
  factories.set(id, factory);
}

export function createEditor(id: string): EditorInstance {
  const factory = factories.get(id);
  if (factory === undefined) {
    throw new Error(`Sin fábrica para el editor: ${id}`);
  }
  return factory();
}

export function registerBuiltinFactories(): void {
  registerEditorFactory('viewport3d', () => new Viewport3DEditor());
  registerEditorFactory('outliner', () => new OutlinerEditor());
}
