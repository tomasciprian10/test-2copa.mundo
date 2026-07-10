# World Cup 2026 — Resultados, Bracket y Apuestas

Página web estática (HTML/CSS/JS puro, sin build) para seguir el Mundial 2026, ver el
detalle de cada partido y armar apuestas con amigos en un leaderboard. Todo se guarda en
el navegador (`localStorage`); no hay servidor.

## Cómo usarla

Abrí `index.html` en cualquier navegador (doble click o `file://`). También podés
servirla con GitHub Pages o cualquier hosting estático.

## Las tres vistas

1. **Bracket** (`#/`) — Bracket eliminatorio radial (16avos → Final, trofeo al centro).
   Tocá cualquier equipo o cruce para abrir su detalle. Debajo: resultados por ronda y
   la fase de grupos con tablas de posiciones calculadas.
2. **Detalle de partido** (`#/match/:id`) — Marcador (con entretiempo, prórroga y
   penales cuando aplica), goleadores con minuto (marca penales y goles en contra),
   fecha, hora y sede. Los partidos sin jugar (o cualquiera) se pueden **editar**: el
   resultado se guarda localmente y hace avanzar el bracket.
3. **Apuestas** (`#/pools`) — Creá pools, sumá amigos y cargá los pronósticos de cada
   uno. Puntaje: **+3** por resultado exacto, **+1** por acertar el ganador (o empate).
   El leaderboard se ordena solo y podés elegir qué fases cuentan.

## Datos

Los partidos vienen del archivo `worldcup_1.json` (fuente: openfootball), embebido en
`js/data.js`. Las banderas se cargan desde flagcdn.

## Estructura

| Archivo | Rol |
|---|---|
| `js/data.js` | Datos del torneo (embebidos) |
| `js/flags.js` | Mapa país → bandera |
| `js/store.js` | Persistencia en `localStorage` |
| `js/model.js` | Normalización, árbol del bracket, ganadores, tablas, puntaje |
| `js/bracket.js` | Render SVG del bracket radial |
| `js/views.js` | Vistas 1 y 2 |
| `js/pools.js` | Vista 3 (apuestas/leaderboard) |
| `js/app.js` | Router por hash |
