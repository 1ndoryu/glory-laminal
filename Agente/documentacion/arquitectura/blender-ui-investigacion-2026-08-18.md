# Investigación — Cómo construye Blender su interfaz

Fecha: 2026-08-18. Fuentes: manual oficial de Blender (window system: Areas, Regions) y docs de
desarrollo (RNA, bContext, Screen/Area/Region/SpaceType).

## Modelo conceptual

```
Window
  └─ Screen (layout actual)
       └─ Area (rectángulo reservado a un Editor)
            ├─ Space (lógica del editor: 3D Viewport, Outliner, Properties…)
            └─ Regions
                 ├─ WINDOW      (contenido principal)
                 ├─ HEADER      (barra superior del área)
                 ├─ TOOLS       (sidebar izquierda, tecla T)
                 ├─ UI          (sidebar derecha, tecla N)
                 ├─ FOOTER      (barra inferior)
                 └─ TOOL_HEADER (contexto de herramienta activa)
```

## Conceptos clave a replicar

1. **Areas**: la ventana se divide en rectángulos; cada área reserva espacio para un Editor.
   - Redimensionar: arrastrar el borde (LMB). `Ctrl` ajusta a tamaños; `Shift` mueve bordes
     alineados a la vez.
   - Esquinas = asa de **docking**: cursor en cruz → arrastrar para **split** (izq/der vertical,
     arriba/abajo horizontal), **join**, **swap** (`Ctrl+LMB`) o **duplicar en nueva ventana**.
   - RMB sobre borde → **Area Options** (split, join arriba/abajo/izq/der, swap).
2. **Editors/Spaces**: cada Editor es un tipo de "space" con lógica propia. Se agrupan en
   **Workspaces** orientados a tarea (Layout, Modeling, Sculpting, Shading…), con pestañas.
3. **Regions**: todo editor se divide en regiones (tabla de arriba). Se redimensionan
   arrastrando el borde; se ocultan arrastrándolas hasta cero (queda una flecha para restaurar).
4. **Panels**: dentro de las regions, contenido organizado en paneles colapsables y sub-paneles.
5. **Maximize / Focus**: `Ctrl+Spacebar` maximiza un área; `Ctrl+Alt+Spacebar` focus mode
   (oculta topbar/status/secondary regions). Permiten pantalla completa de un editor sin
   cambiar el layout.
6. **Contexto y operadores**: los atajos dependen del editor bajo el cursor (contexto). Las
   acciones son **operators** con **keymaps** contexto-sensibles; `bContext` provee escena,
   objeto activo y modo.

## Navegación de cámara (objetivo de 188A-3)

- MMB arrastrar = **órbita**. Shift+MMB = **pan**. Scroll o Ctrl+MMB = **zoom**.
- **Orbit Method**: Turntable (eje Z fijo del mundo) vs Trackball (giro libre). Blender usa
  turntable por defecto; sensibilidad configurable por píxel.
- Numpad **1/3/7** = vistas front/side/top; **9** = opuesta; **5** = alternar
  orto/perspectiva; **.** = frame selected; **Alt+MMB** = snap a vista ortográfica cercana.
- Fly mode (`Shift+F`): WASD + R/F (arriba/abajo). Contexto de zoom al cursor.

## Tema (referencia visual)

- Tema oscuro por defecto: fondo ≈ `#1d1d1d`, paneles ≈ `#262626`, headers ≈ `#2e2e2e`,
  bordes ≈ `#3d3d3d`/`#404040`, texto ≈ `#e6e6e6`, acento naranja ≈ `#f5792a`, selección
  azul ≈ `#3b82f6`. Totalmente personalizable por editor. Radios de esquina sutiles, bordes
  de 1 px, contraste moderado.

## Mapeo a nuestra implementación (web)

| Blender (C/OpenGL)           | Glory Laminal (TS/DOM+WebGL)                      |
| ---------------------------- | ------------------------------------------------- |
| `bScreen` → `ScrArea`        | `editor/layout` (estado en Zustand, árbol de áreas)|
| `SpaceType` (Editor)         | `editor/editors/*` (registro de tipos de editor)   |
| `ARegion` (WINDOW/HEADER…)   | regiones DOM dentro del área; WINDOW del 3D = canvas WebGL2 |
| Panels/tabs                  | `editor/widgets` (paneles colapsables, pestañas)   |
| Operadores + keymap          | `input/` (registry de operadores y keymaps)        |
| Tema por editor              | `styles/variables.css` (tokens centralizados)      |

La regla de oro: **cada concepto de layout de Blender tiene un módulo equivalente**, de modo que
split/join/dock/swap y regiones colapsables sean operaciones de primer orden, no parches de CSS.
