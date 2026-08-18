# Glory Laminal

Motor de videojuego para web, escrito íntegramente en TypeScript. Editor con interfaz
inspirada en Blender, generación de terreno procedural y navegación de cámara estilo Blender.

Estado: **fase 0 — bootstrap fundacional**.

## Stack

| Capa        | Herramienta                                                  |
| ----------- | ------------------------------------------------------------ |
| Lenguaje    | TypeScript estricto (sin Rust/C++/WASM)                      |
| Build/dev   | Vite                                                         |
| Tests       | Vitest                                                       |
| Render      | WebGL2 propio, abstraído tras `Renderer` (sin three.js)      |
| UI editor   | DOM/CSS vanilla (sin framework de UI), estado con Zustand    |
| Lint/format | ESLint + Prettier                                            |
| Gate        | Sentinel (doctor/analyze/check) · VarSense (pendiente)       |

## Arranque

```bash
npm install
npm run dev          # servidor de desarrollo
npm run type-check   # TypeScript estricto
npm test             # Vitest
npm run analyze      # Sentinel analyze (workspace)
npm run quality:doctor
```

## Estructura objetivo

```
src/
  core/       # núcleo agnóstico: math, loop, events
  render/     # abstracción de renderizado: gl, camera
  terrain/    # terreno procedural: noise, heightmap, chunk
  editor/     # interfaz tipo Blender: layout, editors, widgets, store
  input/      # teclado/ratón, operators, keymap
  app/        # composición root
styles/
  variables.css  # tokens de diseño centralizados (tema Blender)
```

## Documentación

- `roadmap.md` — cola operativa.
- `Agente/planes/` — planes activos.
- `Agente/documentacion/arquitectura/` — ADRs e investigación de Blender UI.
