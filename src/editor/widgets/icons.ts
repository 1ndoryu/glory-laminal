import {
  Box,
  Camera,
  ChevronDown,
  ChevronRight,
  Circle,
  createElement as createLucideElement,
  Frame,
  Globe,
  ListTree,
  Mountain,
  Orbit,
  Sun,
  type IconNode,
} from 'lucide';

/* Índice local de iconos del editor. Importa SÓLO los que se usan para no arrastrar los ~1800
   iconos de lucide al bundle (el export `icons` completo dispara un chunk > 700 kB). */
const iconIndex: Record<string, IconNode> = {
  box: Box,
  circle: Circle,
  camera: Camera,
  frame: Frame,
  orbit: Orbit,
  'list-tree': ListTree,
  globe: Globe,
  mountain: Mountain,
  sun: Sun,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
};

/* Adaptador de Lucide: convierte un IconNode en un <svg> con currentColor, para colorearlo por
   CSS. Centraliza el tamaño y el grosor de trazo (stroke-width) de todo el editor. */
export function lucideIcon(name: string, size = 16): SVGElement {
  const node = iconIndex[name];
  if (node === undefined) {
    throw new Error(`Icono lucide no registrado: ${name}`);
  }
  const svg = createLucideElement(node, {
    width: size,
    height: size,
    'stroke-width': 1.6,
  });
  svg.classList.add('icono');
  return svg;
}
