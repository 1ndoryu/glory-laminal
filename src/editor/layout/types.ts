/* Modelo de layout inspirado en Blender: la pantalla es un árbol de áreas; cada área reserva
   espacio para un editor y se subdivide en regiones. Los nodos de tipo `split` dividen el
   rectángulo en dos, lo que permite split/join/dock/swap como operaciones de primer orden. */

export type RegionType = 'HEADER' | 'TOOLS' | 'UI' | 'FOOTER' | 'WINDOW';

/* `row` = hijos lado a lado (división vertical en términos de Blender);
   `column` = hijos apilados (división horizontal). */
export type SplitOrientation = 'row' | 'column';

export interface RegionState {
  id: string;
  type: RegionType;
  visible: boolean;
  /** Ancho (TOOLS/UI) o alto (HEADER/FOOTER) en píxeles. */
  size: number;
}

export interface EditorArea {
  kind: 'leaf';
  id: string;
  /** Identificador del tipo de editor registrado. */
  editor: string;
  regions: RegionState[];
}

export interface SplitArea {
  kind: 'split';
  id: string;
  orientation: SplitOrientation;
  /** Fracción del primer hijo (0..1). */
  ratio: number;
  first: AreaNode;
  second: AreaNode;
}

export type AreaNode = EditorArea | SplitArea;
