import type { RegionState } from '../layout/types';

/* Contrato de un editor concreto (equivalente al "space" de Blender). El LayoutView crea la
   instancia una vez y la reutiliza aunque el área se mueva por el árbol de splits. */
export interface EditorInstance {
  mount(host: HTMLElement): void;
  updateRegions(regions: RegionState[]): void;
  dispose(): void;
}
