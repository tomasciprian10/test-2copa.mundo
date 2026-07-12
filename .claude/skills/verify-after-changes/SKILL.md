---
name: verify-after-changes
description: >-
  Use when Claude Code believes the implementation of the plan is DONE, to
  shift focus from building to proving the changes work. It launches the app
  server, picks the 5 most important test cases, exercises them directly in
  the browser, gathers the results, compares them against the plan and the
  design spec, and then either fixes what fails / falls short or gives the
  green light and finishes. Triggers on phrases like "I think I'm done",
  "implementation complete", "let's verify the changes", "terminé la
  implementación", "probemos los cambios", "verificar los cambios".
---

# Verify After Changes

This skill runs **after** an implementation is believed complete. Its job is to
**prove the changes actually work** against what was promised — not to trust
that the code compiles. It ends in one of two states: **fixes applied** (and
re-verified) or **green light** to finish.

> **Language:** Mirror the user's language in every interaction.

## When to use it

Trigger it the moment Claude Code considers the plan implemented. Don't declare
a task "done" without running this skill on any change that has a runtime
surface (a UI, a server, an interactive flow). Pure docs/config edits with no
observable behavior can skip it.

## The loop

### 1. Recover the intent

Before testing, re-read what "done" means:

- The **plan** that was implemented, en `docs/plans/YYYY-MM-DD-title.md` —
  especialmente la lista de tareas y su criterio de hecho.
- The **design spec** (`docs/specs/YYYY-MM-DD-title.md`) if one exists —
  especially section 5 (Comportamiento esperado) and section 6 (Posibles
  errores y mitigaciones).

These are your source of truth for what to test and what "correct" looks like.

### 2. Launch the server

Start the app the way this project runs it. For a static site, serve the folder
(e.g. `python3 -m http.server`) rather than opening files via `file://`, so
relative paths and fetches behave. Note the local URL.

### 3. Pick the 5 most important test cases

Choose **exactly 5** test cases that best cover the objective. Prioritize:

- The **core happy path(s)** — the main reason the feature exists.
- The **expected behaviors** from the spec (section 5).
- At least one **error / edge case** and its mitigation (section 6): empty
  state, invalid input, network failure, boundary/limit.

Write the 5 cases down explicitly before running them, each with: what you do
and what you expect to see.

### 4. Test directly in the browser

Drive each case in a real browser (Chromium via Playwright is preinstalled in
this environment — do not run `playwright install`). For each case:

- Perform the interaction (navigate, click, type, submit).
- Observe the actual result (DOM, visible text, console errors, screenshots).
- Record **pass / fail** and the evidence.

Don't substitute unit tests for this — the point is to observe real behavior.

### 5. Gather feedback and compare

Put the actual results side by side with the plan and the spec:

- Does each case match the **expected behavior**?
- Is anything in scope **missing or falling short** of the objective?
- Did any **error case** behave worse than the spec's mitigation?

Summarize as a short checklist (✅ / ❌ per case) with the gaps.

### 6. Fix or give the green light

- **If anything fails or falls short:** fix the smallest thing that closes the
  gap, then **go back to step 4** and re-test the affected cases. Repeat until
  all 5 pass. Don't rationalize a failing case as acceptable — fix it or, if
  it's genuinely out of scope, say so explicitly and check with the user.
- **If all 5 pass and nothing is missing:** give the **green light** — report
  the results and declare the task done.

## Output

Always end with:

1. The **5 test cases** and their pass/fail result with evidence.
2. Any **fixes applied** during the loop.
3. A clear verdict: **🟢 Green light — done**, or **🔴 Blocked** with the
   specific gap and what's needed.

Never claim success you didn't observe. If a case couldn't be run, say so —
don't mark it green.
