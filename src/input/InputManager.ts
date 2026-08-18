import { Keymap } from './Keymap';

export interface OperatorContext {
  editorId: string;
}

export type OperatorFn = (context: OperatorContext) => void;

interface EditorInput {
  keymap: Keymap;
  operators: Map<string, OperatorFn>;
}

/* Despacha teclado al keymap del editor bajo el cursor (contexto). Cada editor registra sus
   operadores con closures sobre su propia cámara/estado, así dos viewports no colisionan. */
const inputs = new Map<string, EditorInput>();

let activeEditorId: string | null = null;
let attached = false;

export function registerEditorInput(
  editorId: string,
  keymap: Keymap,
  operators: Record<string, OperatorFn>,
): void {
  inputs.set(editorId, { keymap, operators: new Map(Object.entries(operators)) });
}

export function unregisterEditorInput(editorId: string): void {
  inputs.delete(editorId);
  if (activeEditorId === editorId) {
    activeEditorId = null;
  }
}

export function setActiveEditor(editorId: string): void {
  activeEditorId = editorId;
}

export function attachInput(target: Window): void {
  if (attached) {
    return;
  }
  attached = true;
  target.addEventListener('keydown', onKeyDown);
}

function onKeyDown(event: KeyboardEvent): void {
  const editorId = activeEditorId;
  if (editorId === null) {
    return;
  }
  const input = inputs.get(editorId);
  if (input === undefined) {
    return;
  }
  const operatorId = input.keymap.match(event);
  if (operatorId === null) {
    return;
  }
  const operator = input.operators.get(operatorId);
  if (operator === undefined) {
    return;
  }
  event.preventDefault();
  operator({ editorId });
}
