# Roadmap — Glory-Laminal

**Contexto.** Motor de videojuego web en TypeScript puro: interfaz inspirada en Blender, terreno
procedural y cámara estilo Blender. Rama primaria `main`. Stack: TS estricto + Vite + Vitest +
WebGL2 propio + DOM/CSS vanilla + Zustand + Sentinel. Fuentes canónicas: `README.md` y
`Agente/documentacion/arquitectura/`.

## Siguiente bloque

- [ ] `188A-5` — **Gate completo (VarSense).** Bloqueado: el binario `varsense` está ausente en este
  entorno y el proyecto aún no publica `quality-tools.json` ni un comando oficial de setup
  (`quality:setup`). Provisionar requiere alinear el manifest con el commit de
  `https://github.com/1ndoryu/varsense.git`, ejecutar el build publicado y regenerar el lock.
  Incluye `varsense.config.json` y el adaptador de stages.

## Pendientes

- [ ] `188A-6` — **Backlog lejano** (fuera de alcance inmediato): manejo de assets, ECS/entidades,
  sistemas de juego, voxel/Minecraft.

## Bloqueos

- **VarSense sin decidir:** clonar/compilar el binario (commit `88f281f…`, v2.2.1) o aportar un
  artefacto ya compilado. Hasta entonces no se afirma PASS de VarSense.

## Planes activos

- `Agente/planes/plan-glory-laminal-2026-08-18.md` — plan maestro por fases (fases 1–3 completadas,
  fase 4 bloqueada).
