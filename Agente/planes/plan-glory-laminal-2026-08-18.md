# Plan maestro — Glory Laminal (2026-08-18)

## Objetivo

Construir desde cero un motor de videojuego para web en TypeScript puro, con un editor cuya
interfaz copia fielmente la filosofía de Blender, capaz de generar terreno procedural y de
navegar la cámara como Blender. Meta de producto: juegos tipo Genshin Impact / Minecraft.

## Alcance (inmediato, "vamos por parte")

1. Arquitectura firme y modular.
2. Interfaz tipo Blender (sistema de layout + tema).
3. Navegación de cámara tipo Blender.
4. Generación de terreno procedural.
5. Detección de errores: TS estricto, ESLint/Prettier, Vitest, Sentinel.

## No alcance (ahora)

- Manejo de assets, animación, física, audio, red, multiplayer.
- ECS completo (se adopta cuando haya necesidad real de muchos sistemas; no ahora).
- Voxel/Minecraft en detalle (el terreno comienza por heightmap suave tipo Genshin).
- WebGPU, soporte móvil/VR, deploy a producción.

## Dependencias

- Node 24 + npm 11 (presentes). Sentinel 0.7.4 (presente, binario global).
- VarSense: **ausente** → se difiere su provisionamiento (188A-5).

## Fases verificables

| Fase | ID     | Entregable | Evidencia de cierre |
| ---- | ------ | ---------- | ------------------- |
| 0    | 188A-1 | Bootstrap: Vite+TS estricto, render loop WebGL2 que limpia el canvas, `Vec3`+test, Sentinel init, doctor | `type-check` PASS, `vitest` PASS, `vite build` PASS, `sentinel doctor` listo para analizar |
| 1    | 188A-2 | Layout tipo Blender: screens/areas/regions/editors/tabs; tema oscuro con tokens; viewport 3D como área | tests de layout + captura visual + doctor PASS |
| 2    | 188A-3 | Cámara: órbita/pan/zoom (turntable/trackball), numpad, orto/persp, frame selected | tests de matemática de cámara + verificación manual de controles |
| 3    | 188A-4 | Terreno: ruido + fBm, heightmap→mesh, chunking, color por altura | tests de ruido/heightmap/chunk + render de malla en viewport |
| 4    | 188A-5 | Gate completo: VarSense + quality-tools + adaptador de stages | ⛔ bloqueado (binario `varsense` ausente) |
| —    | 188A-6 | Backlog lejano (assets, ECS, juego) | — |

## Estado

Fases 0–3 completadas y verificadas (188A-1 → 188A-4). Fase 4 (188A-5, VarSense)
**bloqueada**: binario `varsense` ausente y sin comando oficial de setup en el proyecto.
Evidencia en `Agente/completados/tareas-2026-08-18.md`. Próximo paso: provisionar VarSense
(requiere decisión del usuario sobre clonar/compilar) o continuar con 188A-6.

## Gate

Sentinel como autoridad de cierre. En fase 0 basta `sentinel doctor` listo para análisis
(`readyForAnalyze`); el gate coordinado completo (`readyForGate`) se alcanza en 188A-5.

## Definition of Done (por fase)

- Código con type-check estricto y tests (caso positivo y negativo cuando aplique).
- Sin fallos silenciosos; errores explícitos con contexto.
- Convenciones de estilo y tokens respetadas (VarSense cuando esté provisionado).
- `roadmap.md` actualizado y evidencia en `Agente/completados/`.
- Gate/doctor PASS con reporte verificable y reproducible.
