export interface KeymapBinding {
  /** `KeyboardEvent.code` (físico, independiente del idioma). */
  code: string;
  operator: string;
  shift?: boolean;
  ctrl?: boolean;
  alt?: boolean;
}

/* Resuelve un evento de teclado a un operador según el keymap del editor activo.
   Es declarativo: el mismo atajo puede mapear a operadores distintos en cada editor. */
export class Keymap {
  private readonly bindings: KeymapBinding[] = [];

  add(binding: KeymapBinding): this {
    this.bindings.push(binding);
    return this;
  }

  match(event: KeyboardEvent): string | null {
    for (const binding of this.bindings) {
      if (binding.code !== event.code) {
        continue;
      }
      if ((binding.shift ?? false) !== event.shiftKey) {
        continue;
      }
      if ((binding.ctrl ?? false) !== event.ctrlKey) {
        continue;
      }
      if ((binding.alt ?? false) !== event.altKey) {
        continue;
      }
      return binding.operator;
    }
    return null;
  }
}
