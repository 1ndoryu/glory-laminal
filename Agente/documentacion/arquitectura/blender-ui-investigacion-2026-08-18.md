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
- **Smooth view**: los cambios de vista (numpad, frame selected, gizmo) se animan con una
  interpolación suave (~0,2 s, ease-out), no saltan. En turntable el azimuth gira por el camino
  más corto.
- **Zoom to mouse position**: el dolly mantiene fijo el punto del mundo bajo el cursor
  (raycast al plano perpendicular a la vista por el target y re-posicionado del target).
- **Navigation gizmo**: esfera con ejes X/Y/Z en la esquina superior derecha; arrastrar orbita,
  hacer clic en un eje salta a esa vista (X=derecha, Y=frente, Z=arriba).

## Tema (referencia visual) — valores exactos del tema Default

Extraídos de `release/datafiles/userdef/userdef_default_theme.c` (fuente oficial):

- Editor: fondo `#1d1d1d`, topbar `#181818`, statusbar `#303030`.
- Header de área (view3d): `#303030`; paneles: cabecera/cuerpo `#3d3d3d` sobre fondo `#303030`.
- Botones (`wcol_regular`): interior `#545454`, borde `#3d3d3d`, texto `#e6e6e6`, roundness 0.2.
- Selección / hover de menú: azul `#4772b3` (`inner_sel`/`panel_active`); texto seleccionado blanco.
- Pestañas de workspace: texto `#989898`, activa con acento naranja `#e87d0d` (objeto activo `#ffaf29`).
- View3D: fondo `#3d3d3d` con degradado, grid `#545454` (alpha 0.5), ejes xaxis `#ff3352`,
  yaxis `#8bdc00`, zaxis `#2890ff`.
- Menús: fondo `#282828`, item seleccionado `#4772b3`, texto `#dddddd`.
- Bordes entre editores: `#161616` (`editor_border`). Tipografía ≈ DejaVu Sans/Inter 11px.

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
