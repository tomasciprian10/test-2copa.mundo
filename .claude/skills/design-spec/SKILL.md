---
name: design-spec
description: >-
  Use AFTER the problem and desired outcome are clear (e.g. after the
  brainstorming skill), BEFORE implementing. It designs a specification
  document from the USER's point of view and writes it to
  docs/specs/YYYY-MM-DD-title.md with a fixed set of sections. Ends with an
  approval gate: the user iterates the spec or approves it to continue with
  the design-plan skill. Triggers on
  phrases like "write the spec", "design the specification", "let's spec this
  out", "necesito una especificación", "escribamos el spec",
  "documento de especificación".
---

# Design Spec

This skill turns a clarified problem into a written **specification document
from the user's point of view**. It is the bridge between understanding *what*
we want (brainstorming) and building it: no implementation details, no code —
just what the product should do and why, described in user terms.

> **Language:** Mirror the user's language in every interaction and in the
> document itself. If they work in Spanish, write the spec in Spanish.

## When to use it

Use it **after** there is clarity about the problem and the chosen approach
(typically right after the `brainstorming` skill). If the problem is still
ambiguous, run `brainstorming` first — don't spec something undefined.

## How it works

### 1. Confirm you have enough clarity

You need, at minimum: the goal, who the users are, and the agreed scope for
this version. If any of these is missing, ask **before** writing (use
`AskUserQuestion`). Don't invent requirements — a spec built on guesses is
worse than no spec.

### 2. Choose the file path

Write the document to:

```
docs/specs/YYYY-MM-DD-title.md
```

- `YYYY-MM-DD` = today's date (get it, don't guess).
- `title` = short, kebab-case slug of the feature (e.g. `buscador-de-productos`).
- Create the `docs/specs/` folder if it doesn't exist.

### 3. Write the spec from the user's point of view

Keep the focus on **what the user experiences and needs**, not on how it's
implemented. Use the exact sections below, in this order.

## Required sections

The document **must** contain these six sections, in order:

```markdown
# <Título de la feature>

> Fecha: YYYY-MM-DD · Estado: Draft

## 1. Overview
Resumen breve de qué es esto y qué valor entrega, en 2-4 frases.

## 2. Usuarios objetivo
Quiénes van a usar esto. Perfiles, roles o segmentos, y qué necesita cada uno.

## 3. Contexto del problema
Qué problema o necesidad existe hoy, por qué importa, y qué pasa si no se
resuelve. El "porqué" detrás de la feature.

## 4. Alcance v1
Qué entra en esta primera versión y —explícitamente— qué queda afuera
(Fuera de alcance). Ser concreto para evitar scope creep.

## 5. Comportamiento esperado
Cómo se comporta desde la perspectiva del usuario: flujos, casos principales
y casos borde. Preferí una lista de escenarios ("Cuando el usuario…, entonces…").
Sin detalles de implementación.

## 6. Posibles errores y mitigaciones
Qué puede salir mal (entradas inválidas, estados vacíos, fallos de red, límites)
y cómo se mitiga o comunica cada caso al usuario.
```

### 4. Deliver

- Confirmá la ruta del archivo creado.
- Mostrá un resumen corto de lo escrito.
- Marcá el documento como **Draft** hasta pasar el approval gate (abajo).

### 5. Approval gate

El spec **no avanza solo**. Después de entregar el Draft, hacé una pausa
explícita para que el usuario **itere o apruebe**. Usá `AskUserQuestion` con
dos opciones claras:

- **Iterar el spec** → recogé el feedback, aplicá los cambios sobre el mismo
  archivo `docs/specs/YYYY-MM-DD-title.md` y **volvé a presentar el gate**.
  Repetí hasta que el usuario apruebe.
- **Aprobar y continuar** → cambiá el estado del documento de `Draft` a
  `Approved`, confirmá la aprobación y pasá al skill **`design-plan`** para
  generar el plan de implementación a partir de este spec.

Reglas del gate:
- **No implementes ni generes el plan sin aprobación explícita.** Un silencio
  o un "ok" ambiguo no es aprobación; confirmá.
- Mientras el spec esté en `Draft`, no arranques `design-plan`.
- Solo tras la aprobación cambiá el estado a `Approved` y encadená a
  `design-plan`.

## Guidelines

- **Del lado del usuario, no del código.** Nada de nombres de funciones,
  esquemas de base de datos ni librerías. Describí comportamiento observable.
- **Concreto y verificable.** Cada punto de comportamiento debería poder
  comprobarse mirando el producto terminado.
- **Alcance honesto.** La sección "Fuera de alcance" es tan importante como lo
  que entra.
- **No sobre-especifiques.** Un spec v1 corto y claro es mejor que uno largo
  lleno de suposiciones.

## Worked example (path)

Para una feature de buscador acordada el 12/07/2026:

```
docs/specs/2026-07-12-buscador-de-productos.md
```
