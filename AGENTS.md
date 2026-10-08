# Glory-Laminal — instrucciones del proyecto

Especializa el `AGENTS.md` del área (`area-trabajo/AGENTS.md`): el protocolo común,
el gate (§5–§6) y el sistema documental (§7) valen aquí; abajo solo lo propio del proyecto.

Editor/IDE propio en **TypeScript puro** (sin Rust, C++, WASM ni three.js). Núcleo sin framework
(`src/core`, `src/render`, `src/terrain`); UI del editor en DOM/CSS vanilla; estado global con
Zustand vanilla (`createStore`, sin hook React); render solo WebGL2 detrás de `Renderer`; dominios
jerárquicos. Cambios de arquitectura requieren ADR.

- Límites: componentes/estilos ≤ 300 líneas; hooks/utils ≤ 150; 1 componente = 1 responsabilidad.
- Interfaz tipo Blender: decisiones visuales en `styles/variables.css` (prohibido color/fuente/tamaño
  literal en componentes); CSS en archivos separados, clases en español `camelCase`; layout
  `screens → areas → regions → panels`.
- Cámara (objetivo): MMB órbita · Shift+MMB pan · scroll/Ctrl+MMB zoom · Numpad 1/3/7 vistas ·
  Numpad 5 orto/persp · Numpad . frame selected.
- Gate: Sentinel es autoridad de cierre (`npm run quality:doctor`, `npm run analyze`).
  **VarSense aún no está provisionado** (binario ausente); no afirmar PASS de VarSense (tarea en roadmap).
- Sin fallos silenciosos: errores de WebGL/input se lanzan o pasan a estado explícito.
- IDs `{DD}{M}{A}-{N}`; tareas en `roadmap.md`, planes en `Agente/planes/`, evidencia en `Agente/completados/`.
