# ADR 001 — Arquitectura del motor Glory Laminal

Fecha: 2026-08-18. Estado: aceptado (fundación).

## Contexto

Se construye un motor de videojuego web "desde cero" en TypeScript, con editor tipo Blender,
terreno procedural y cámara tipo Blender. Los proyectos hermanos del workspace usan Rust + React;
aquí la decisión del usuario es **TS puro**.

## Decisiones

### 1. UI del editor en DOM/CSS vanilla (sin React)

Blender dibuja toda su UI en OpenGL. Replicar eso en web implicaría recrear un toolkit de
renderizado de texto/widgets completo: coste enorme, beneficio nulo. En web el navegador ya
ofrece un motor de layout, tipografía, accesibilidad, scroll, inspección y depuración.

**Se copia el *sistema de layout* de Blender** (screens → areas → regions → panels), no su
implementación de render: el chrome se hace en DOM/CSS con tokens, y solo el viewport 3D es un
canvas WebGL2 incrustado como región WINDOW del editor 3D.

Se evita React porque el layout de Blender es imperativo y muta dinámicamente (split/join/dock/
swap de áreas), lo que no casa con el modelo declarativo de React. Estado global con **Zustand
en API vanilla** (`createStore`), que es agnóstico de framework.

### 2. WebGL2 puro detrás de la abstracción `Renderer`

Sin three.js: el render es parte del "desde cero". `src/render` define el contrato
(`Renderer`, `Camera`, `Mesh`, `Material`) e `src/render/gl` lo implementa con WebGL2. WebGPU
entra después como otra implementación sin tocar el resto del motor.

### 3. Matemática propia (`core/math`)

Vectores/matrices/cuaterniones propios, probados con Vitest. Justificación: determinismo,
cero dependencias runtime en el núcleo y control del modelo de memoria. Estilo **mutable con
encadenamiento** (como three.js/Unity) para evitar presión de GC en el bucle de juego.

### 4. Bucle de juego con delta-time acotado

`RenderLoop` con `requestAnimationFrame`, delta en segundos acotado a 0.25 s para absorber
pausas de pestaña. La lógica (más adelante) se actualizará con paso fijo desacoplado del render.

### 5. Operadores + keymap contexto-sensible (filosofía Blender)

Las acciones son **operadores** registrados; los atajos se resuelven por **keymap según el área
bajo el cursor**. Replica el comportamiento real de Blender (el mismo atajo hace cosas distintas
según el editor) y evita un `switch` global de teclas.

## Consecuencias

- El editor es imperativo y de bajo nivel: más control, más código manual. Se compensa con
  componentes/widgets reutilizables y límites de tamaño.
- El núcleo del motor no depende de React ni de three.js; sí permite Zustand (store vanilla).
- La matemática propia exige tests rigurosos desde el inicio.

## Alternativas descartadas

- React para el editor: modelo declarativo poco adecuado a layout dinámico; rompe "TS puro" en
  espíritu y añade reconciliación en un entorno en tiempo real.
- three.js/Babylon: contradice "desde cero".
- Dibujar toda la UI en WebGL (como Blender): coste desproporcionado, sin beneficio en web.
