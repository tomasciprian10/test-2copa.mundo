---
name: design-plan
description: >-
  Use AFTER the user has approved the design spec (the approval gate in the
  design-spec skill passes), to turn that spec into an implementation plan.
  It writes the plan to docs/plans/YYYY-MM-DD-title.md with the objective, the
  problem context, a reference to the approved spec, and a detailed task list
  ready to implement. Triggers on phrases like "spec approved, make the plan",
  "let's plan the implementation", "spec aprobado", "generá el plan",
  "plan de implementación".
---

# Design Plan

This skill converts an **approved design spec** into an actionable
**implementation plan**. It's the step between "we agree on what to build"
(design-spec, approved) and actually building it. The output is a written plan
that a developer — or Claude Code — can execute task by task.

> **Language:** Mirror the user's language in every interaction and in the
> document itself.

## When to use it

Use it **only after the spec's approval gate has passed** — i.e. the user
explicitly approved `docs/specs/YYYY-MM-DD-title.md`. If the spec isn't
approved yet, go back to `design-spec` and iterate; don't plan against a moving
target.

## How it works

### 1. Load the approved spec

Read the approved spec in `docs/specs/`. It is the source of truth for the
objective, scope, expected behavior, and error handling. Don't add scope that
isn't in the spec — if something's missing, flag it and update the spec first.

### 2. Choose the file path

Write the plan to:

```
docs/plans/YYYY-MM-DD-title.md
```

- `YYYY-MM-DD` = today's date (get it, don't guess).
- `title` = the **same slug** as the spec it derives from, so spec and plan
  line up (e.g. spec `2026-07-12-buscador.md` → plan `2026-07-12-buscador.md`).
- Create the `docs/plans/` folder if it doesn't exist.

### 3. Write the plan

Use the exact four sections below, in order.

## Required sections

```markdown
# <Título de la feature> — Plan de implementación

> Fecha: YYYY-MM-DD · Estado: Draft

## 1. Objetivo
Qué vamos a lograr con esta implementación, en 2-4 frases. Alineado con el
objetivo del spec.

## 2. Contexto del problema
Resumen del problema que se resuelve y por qué importa (tomado del spec, no
reinventado). Suficiente para que alguien entienda el plan sin abrir el spec.

## 3. Spec de referencia
Enlace/ruta al spec aprobado que este plan implementa:
`docs/specs/YYYY-MM-DD-title.md`. Notá la versión/estado aprobado.

## 4. Lista de tareas a implementar
Tareas concretas y ordenadas, con detalle suficiente para ejecutar. Para cada
tarea:
- **Qué**: la acción concreta.
- **Detalle**: archivos/áreas afectadas, enfoque, dependencias entre tareas.
- **Criterio de hecho**: cómo se sabe que la tarea está completa (idealmente
  atado a un comportamiento del spec).

Ejemplo:
- [ ] **T1 — <título>**
  - Detalle: ...
  - Hecho cuando: ...
- [ ] **T2 — <título>** (depende de T1)
  - Detalle: ...
  - Hecho cuando: ...
```

### 4. Deliver

- Confirmá la ruta del plan creado y el spec del que deriva.
- Mostrá la lista de tareas como resumen.
- El plan es un **Draft**: ofrecé revisarlo antes de empezar a implementar. Al
  terminar la implementación, corresponde usar el skill `verify-after-changes`.

## Guidelines

- **Trazable al spec.** Cada tarea debería mapear a algo del spec (alcance,
  comportamiento esperado o mitigación de errores). Nada de tareas "porque sí".
- **Ordenado y con dependencias claras.** Que se pueda ejecutar de arriba hacia
  abajo.
- **Detalle ejecutable, no código.** Describí qué hacer y dónde, no pegues la
  implementación completa.
- **Sin scope creep.** Si aparece algo fuera del spec aprobado, no lo agregues
  en silencio: marcálo y proponé actualizar el spec.
