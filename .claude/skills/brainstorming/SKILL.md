---
name: brainstorming
description: >-
  Use ALWAYS when starting a new development, feature, or non-trivial change,
  BEFORE writing any code. It asks the user clarifying questions to remove
  ambiguity about scope, requirements, and constraints, and ends by presenting
  2 or 3 approach alternatives to start working. Triggers on phrases like
  "I want to build", "let's start a new feature", "new development",
  "implement something new", "quiero desarrollar", "empecemos una feature",
  "nuevo desarrollo".
---

# Brainstorming

This skill structures the kickoff of any new development. Its goal is to
**remove ambiguity before writing a single line of code** and to close with
**2 or 3 concrete alternatives** for where to start.

> **Language:** Mirror the user's language in every interaction. If they write
> in Spanish, respond in Spanish; if in English, respond in English. Keep the
> tone direct and collaborative.

## When to use it

At the start of a new development: a new feature, a new module, an architecture
change, or any task whose scope isn't fully clear. If the task is a trivial fix
or a well-specified one-line edit, **skip** this skill.

## How it works

### 1. Understand the context (silently)

Before asking anything, review the current state: what's in the repo, what
patterns and conventions already exist, and what part of the request is already
solved. **Never ask what you can find out by reading the code.**

### 2. Ask questions to remove ambiguity

Ask as many questions as needed — **there is no fixed limit**. Keep asking until
the problem has no gray areas, but prioritize what most changes the solution and
group related questions together. Cover, as applicable:

- **Goal & user**: what problem does it solve and for whom?
- **Scope**: what's in and what's explicitly out for this iteration?
- **Inputs/outputs**: data, formats, expected edge cases.
- **Constraints**: technology, allowed dependencies, performance, deadlines.
- **Success criteria**: how do we know it's done and done well?
- **Integration**: how it coexists with what already exists in the project.

Use the `AskUserQuestion` tool for decisions where the answer changes what you
will do and there's no obvious default. Don't interrogate one question at a
time if you can resolve several at once. If a point has a reasonable default,
assume it and say so instead of asking.

### 3. Present 2 or 3 alternatives

Once the problem is clear, **don't start coding yet**. Present 2 or 3 possible
paths to begin. Use the template below for each.

## Alternatives template

```
## Problem (no ambiguity)
<one short paragraph restating what you understood>

## Alternatives

### Option A — <one-line name>
- **What it is:** <the approach in a few sentences>
- **Pros:** <effort, risk, maintainability, extensibility>
- **Cons:** <trade-offs>
- **Best when:** <the scenario where this wins>

### Option B — <one-line name>
- **What it is:** ...
- **Pros:** ...
- **Cons:** ...
- **Best when:** ...

### Option C — <one-line name>   (optional)
...

## Recommendation
<which one and why — 1-2 sentences>

## Next step
Which path do you want (or how would you adjust it) before I implement?
```

## Worked example

> **User:** "Quiero agregar un buscador al sitio."

**1. Context:** static site with `index.html`, `css/`, `js/`, no backend.

**2. Questions (via `AskUserQuestion`):**
- ¿Qué buscás: contenido de la página, un listado de productos, otra cosa?
- ¿Los datos están en el HTML actual o vienen de un archivo/API?
- ¿Necesitás que funcione sin conexión / sin servidor?
- ¿Búsqueda instantánea mientras se escribe, o al apretar Enter?

**3. Alternatives (after answers):**

- **Option A — Client-side filter over the DOM.** Pros: zero dependencies,
  instant, no backend. Cons: doesn't scale past a few hundred items.
  Best when: the searchable content is already on the page.
- **Option B — Prebuilt JSON index + fuzzy search (e.g. a small JS lib).**
  Pros: fast, fuzzy matching, still static. Cons: extra dependency and a build
  step to generate the index. Best when: many items or you want typo tolerance.
- **Option C — Search backed by an API.** Pros: scales, server-side ranking.
  Cons: needs a backend — big jump for a static site. Best when: data grows or
  lives elsewhere.

**Recommendation:** Option A to start, migrating to B if the dataset grows.

## Expected output

1. A short, ambiguity-free restatement of the problem.
2. The 2–3 compared alternatives.
3. A recommendation and the closing question to pick the path.

**Do not proceed to implementation until the user confirms an alternative.**
