# Glory Laminal — Roadmap

Motor de videojuego web en TypeScript puro. Interfaz inspirada en Blender, terreno procedural,
cámara estilo Blender. Rama primaria: `main`.

Stack: TS estricto + Vite + Vitest + WebGL2 propio + DOM/CSS vanilla + Zustand + Sentinel.
Fuentes canónicas: `README.md`, `AGENTS.md`, `Agente/documentacion/arquitectura/`.

## Siguiente bloque ejecutable

**188A-5 — Gate completo (VarSense).** Bloqueado: el binario `varsense` está ausente en este
entorno y el proyecto aún no publica `quality-tools.json` ni un comando oficial de setup
(`quality:setup`). Provisionar requiere alinear el manifest con el commit de
`https://github.com/1ndoryu/varsense.git`, ejecutar el build publicado y regenerar el lock.

## Bloqueos y decisiones que requiere del usuario

- **VarSense**: confirmar si hay que clonar/compilar el binario (commit `88f281f…`, v2.2.1) o si
  se aporta un artefacto ya compilado. Hasta entonces no se afirma PASS de VarSense.

## Tareas pendientes (orden de dependencia)

1. **188A-5 — Gate completo**: `quality-tools.json` + `varsense.config.json` + `quality:setup`
   (provisionar VarSense) + adaptador de stages. **Bloqueado por binario ausente.**
2. **188A-6 — Backlog lejano** (fuera de alcance inmediato, "no pensemos en el resto"): manejo
   de assets, ECS/entidades, sistemas de juego, voxel/Minecraft.

## Planes activos

- `Agente/planes/plan-glory-laminal-2026-08-18.md` — plan maestro por fases (activo; fases 1–3
  completadas, fase 4 bloqueada).
