import { registerBuiltinFactories } from '../editor/editors/factory';
import { registerBuiltinEditors } from '../editor/editors/registry';
import { createShell } from '../editor/shell';
import { attachInput } from '../input/InputManager';

/* Compone el editor: registra los tipos de editor y sus fábricas, conecta el teclado y monta la
   shell (barra superior + árbol de áreas). El bucle de render vive dentro de cada Viewport3D. */
export function boot(container: HTMLDivElement): void {
  registerBuiltinEditors();
  registerBuiltinFactories();
  attachInput(window);
  createShell(container);
}
