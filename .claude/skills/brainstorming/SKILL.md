---
name: brainstorming
description: >-
  Usar SIEMPRE al comenzar un nuevo desarrollo, feature o cambio no trivial,
  ANTES de escribir código. Hace preguntas al usuario para eliminar
  ambigüedades sobre alcance, requisitos y restricciones, y al final presenta
  2 o 3 alternativas de enfoque para empezar a trabajar. Se activa con frases
  como "quiero desarrollar", "empecemos una nueva feature", "vamos a construir",
  "nuevo desarrollo", "implementar algo nuevo".
---

# Brainstorming

Este skill estructura el arranque de cualquier desarrollo nuevo. Su objetivo es
**evitar ambigüedades antes de escribir una sola línea de código** y cerrar con
**2 o 3 alternativas concretas** de por dónde empezar.

## Cuándo usarlo

Al comenzar un nuevo desarrollo: una feature nueva, un módulo nuevo, un cambio
de arquitectura o cualquier tarea cuyo alcance no esté totalmente claro. Si la
tarea es un fix trivial o una edición puntual ya especificada, **no** hace falta
este skill.

## Cómo funciona

### 1. Entender el contexto (silencioso)

Antes de preguntar, revisá el estado actual: qué hay en el repo, qué patrones y
convenciones existen, y qué de lo pedido ya está resuelto. No preguntes cosas
que puedas averiguar leyendo el código.

### 2. Preguntar para eliminar ambigüedades

Hacé preguntas hasta que el problema quede sin zonas grises. Priorizá lo que
más cambia la solución. Cubrí, según aplique:

- **Objetivo y usuario**: ¿qué problema resuelve y para quién?
- **Alcance**: ¿qué entra y qué queda explícitamente afuera de esta iteración?
- **Entradas/salidas**: datos, formatos, casos borde esperados.
- **Restricciones**: tecnología, dependencias permitidas, rendimiento, plazos.
- **Criterio de éxito**: ¿cómo sabemos que está terminado y bien hecho?
- **Integración**: cómo convive con lo que ya existe en el proyecto.

Usá la herramienta `AskUserQuestion` para las decisiones donde la respuesta
cambia lo que vas a hacer y no tenés un default obvio. Agrupá las preguntas;
no interrogues de a una si podés resolver varias juntas. Si un punto tiene una
respuesta razonable por defecto, asumila y decilo, en vez de preguntar.

### 3. Presentar 2 o 3 alternativas

Cuando el problema esté claro, **no empieces a codear todavía**. Presentá
2 o 3 caminos posibles para arrancar. Para cada alternativa incluí:

- **Nombre / resumen** en una línea.
- **En qué consiste**: el enfoque en pocas frases.
- **Pros y contras**: trade-offs honestos (esfuerzo, riesgo, mantenibilidad,
  extensibilidad).
- **Cuándo conviene**: en qué escenario es la mejor opción.

Marcá tu recomendación y por qué. Cerrá pidiendo al usuario que elija (o que
ajuste) antes de implementar.

## Salida esperada

1. Un breve resumen del problema ya sin ambigüedades (lo que entendiste).
2. Las 2–3 alternativas comparadas.
3. Una recomendación y la pregunta de cierre para decidir el camino.

No avances a la implementación hasta que el usuario confirme la alternativa.
