# Glory Laminal — reglas del proyecto

Este archivo especializa el `AGENTS.md` común del workspace (`area-trabajo/AGENTS.md`); no lo
sustituye. Stack y alcance en `README.md`.

## Arquitectura (firme; cambios requieren ADR)

- **TypeScript puro**: todo el motor en TS. Sin Rust, C++, WASM ni three.js.
- **Núcleo sin framework**: `src/core`, `src/render` y `src/terrain` no dependen de ningún
  framework de UI. La matemática es propia (`core/math`) y se prueba con Vitest.
- **UI del editor en DOM/CSS vanilla**, sin React. Blender dibuja su UI en OpenGL; en web la
  decisión es DOM/CSS para el chrome + un canvas WebGL2 como región WINDOW del editor 3D. Se
  copia el *sistema de layout* de Blender, no su implementación de render.
- **Estado global con Zustand** (`createStore`, API vanilla, no hook de React): estado del
  layout, workspace activo, cámara y selección.
- **Render solo WebGL2** detrás de la abstracción `Renderer`; WebGPU después sin tocar el resto.
- **Dominios jerárquicos**, nunca carpeta plana. Límites: componentes/estilos ≤ 300 líneas,
  hooks/utils ≤ 150. SRP: 1 componente = 1 responsabilidad.

## Interfaz tipo Blender

- Toda decisión visual (colores, fuentes, tamaños, radios) vive en `styles/variables.css`.
  Prohibido color/fuente/tamaño literal dentro de componentes.
- CSS en archivos separados, clases en español `camelCase`.
- Sistema de layout: `screens → areas → regions → panels`. Ver
  `Agente/documentacion/arquitectura/blender-ui-investigacion-2026-08-18.md`.

## Navegación de cámara (objetivo)

MMB órbita · Shift+MMB pan · scroll/Ctrl+MMB zoom · Numpad 1/3/7 vistas front/side/top ·
Numpad 5 orto/perspectiva · Numpad . frame selected. Órbita tipo turntable/trackball.

## Gate y detección de errores

- Sentinel es la autoridad de cierre. Comandos: `npm run quality:doctor`, `npm run analyze`.
- **VarSense aún no está provisionado** (binario ausente en este entorno). No afirmar PASS de
  VarSense hasta provisionar y ejecutar; ver tarea en `roadmap.md`.
- Sin fallos silenciosos: errores de WebGL/input se lanzan o se convierten en estado explícito.

## Convenciones de tareas

- IDs `{DD}{M}{A}-{N}` (mes 8, año A=2026). Tareas abiertas en `roadmap.md`, planes en
  `Agente/planes/`, evidencia de cierre en `Agente/completados/`.
