# Roadmap — Glory-Laminal

**Contexto.** Motor de videojuego web en TypeScript puro: interfaz inspirada en Blender, terreno
procedural y cámara estilo Blender. Rama primaria `main`. Stack: TS estricto + Vite + Vitest +
WebGL2 propio + DOM/CSS vanilla + Zustand + Sentinel. Fuentes canónicas: `README.md` y
`Agente/documentacion/arquitectura/`.

## Siguiente bloque

Nada en cola. `188A-5` se borró el 2026-10-20: su premisa («el binario `varsense` está ausente y el
proyecto no publica `quality-tools.json` ni `quality:setup`») era falsa — varsense **2.2.9** está
fijado en `sentinel.lock.json:19-23` y el proyecto ya publica `quality-tools.json`,
`varsense.config.json` y los scripts `quality:*`.

## Pendientes

- [ ] `188A-6` — **Backlog lejano** (fuera de alcance inmediato): manejo de assets, ECS/entidades,
  sistemas de juego, voxel/Minecraft.

## Bloqueos

Nada bloqueado. El antiguo bloqueo de VarSense («clonar/compilar el binario, commit `88f281f…`,
v2.2.1») era falso y se retiró el 2026-10-20 con `188A-5`.

## Planes activos

- `Agente/planes/plan-glory-laminal-2026-08-18.md` — plan maestro por fases (fases 1–3 completadas,
  fase 4 bloqueada).
