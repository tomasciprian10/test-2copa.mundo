// Rendering for the three views: bracket/results, match detail, pools/leaderboard.
(function () {
  var WC = window.WC, Store = window.Store;

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; }

  function flagImg(team, size, cls) {
    var url = window.flagUrl(team, size || "w40");
    if (url) return '<img class="flag ' + (cls || "") + '" src="' + url + '" alt="" loading="lazy"/>';
    return '<span class="flag placeholder ' + (cls || "") + '">' + esc(window.teamCode(team)) + '</span>';
  }
  function teamName(t) { return esc(WC.resolveTeam(t)); }

  function scoreStr(m) {
    if (!WC.isPlayed(m)) return "vs";
    var s = m.score, out = s.ft[0] + " – " + s.ft[1];
    if (s.p) out += ' <span class="deco">(' + s.p[0] + "–" + s.p[1] + " pen)</span>";
    else if (s.et) out += ' <span class="deco">(t.e.)</span>';
    return out;
  }

  // -------- Match row (clickable) --------
  function matchRow(m) {
    var w = WC.winnerOf(m);
    var t1 = WC.resolveTeam(m.team1), t2 = WC.resolveTeam(m.team2);
    return '<a class="mrow" href="#/match/' + m.id + '">' +
      '<span class="mrow-date">' + esc(m.date || "") + '</span>' +
      '<span class="mrow-team t1 ' + (w && w === t1 ? "adv" : "") + '">' + esc(t1) + " " + flagImg(t1, "w40") + '</span>' +
      '<span class="mrow-score">' + scoreStr(m) + '</span>' +
      '<span class="mrow-team t2 ' + (w && w === t2 ? "adv" : "") + '">' + flagImg(t2, "w40") + " " + esc(t2) + '</span>' +
      '</a>';
  }

  // ============ VIEW 1: Bracket + results ============
  function renderHome(root) {
    root.innerHTML =
      '<section class="hero">' +
      '<h2>Bracket eliminatorio</h2>' +
      '<p class="muted">Tocá cualquier equipo o cruce para ver el detalle del partido.</p>' +
      '<div id="bracket" class="bracket-wrap"></div>' +
      '</section>' +
      '<section><h2>Resultados por ronda</h2><div id="ko-rounds"></div></section>' +
      '<section><h2>Fase de grupos</h2><div id="groups" class="groups-grid"></div></section>';

    window.Bracket.render(document.getElementById("bracket"));

    // Knockout rounds
    var order = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Match for third place", "Final"];
    var byRound = {};
    WC.all().forEach(function (m) { if (m.num) { (byRound[m.round] = byRound[m.round] || []).push(m); } });
    var koHtml = order.filter(function (r) { return byRound[r]; }).map(function (r) {
      var rows = byRound[r].sort(function (a, b) { return a.num - b.num; }).map(matchRow).join("");
      return '<div class="round-block"><h3>' + esc(r) + '</h3>' + rows + '</div>';
    }).join("");
    document.getElementById("ko-rounds").innerHTML = koHtml;

    // Groups
    var gHtml = WC.groupLabels().map(function (g) {
      var st = WC.standings(g);
      var rows = st.map(function (r, i) {
        return '<tr class="' + (i < 2 ? "qual" : "") + '"><td class="pos">' + (i + 1) + '</td>' +
          '<td class="tn">' + flagImg(r.team, "w40") + " " + esc(r.team) + '</td>' +
          '<td>' + r.pj + '</td><td>' + r.g + '</td><td>' + r.e + '</td><td>' + r.p + '</td>' +
          '<td>' + r.gf + ":" + r.gc + '</td><td class="pts">' + r.pts + '</td></tr>';
      }).join("");
      var matches = WC.all().filter(function (m) { return m.group === g; }).map(matchRow).join("");
      return '<div class="group-card"><h3>' + esc(g) + '</h3>' +
        '<table class="standings"><thead><tr><th></th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF:GC</th><th>Pts</th></tr></thead><tbody>' +
        rows + '</tbody></table>' +
        '<details class="grp-matches"><summary>Partidos</summary>' + matches + '</details></div>';
    }).join("");
    document.getElementById("groups").innerHTML = gHtml;
  }

  // ============ VIEW 2: Match detail ============
  function goalItem(g, side) {
    var marks = "";
    if (g.penalty) marks += ' <span class="gmark">(pen)</span>';
    if (g.owngoal) marks += ' <span class="gmark og">(e.c.)</span>';
    return '<li class="goal ' + side + '"><span class="gmin">' + esc(g.minute) + "'</span> " +
      '<span class="gname">' + esc(g.name) + '</span>' + marks + '</li>';
  }

  function renderMatch(root, id) {
    var m = WC.byId(id);
    if (!m) { root.innerHTML = '<p>Partido no encontrado. <a href="#/">Volver</a></p>'; return; }
    var t1 = WC.resolveTeam(m.team1), t2 = WC.resolveTeam(m.team2);
    var played = WC.isPlayed(m);
    var meta = [m.round, m.group, m.date, m.time].filter(Boolean).map(esc).join(" &middot; ");

    var goals1 = m.goals1.map(function (g) { return goalItem(g, "left"); }).join("") || '<li class="none">—</li>';
    var goals2 = m.goals2.map(function (g) { return goalItem(g, "right"); }).join("") || '<li class="none">—</li>';

    var scoreBig = played ? (m.score.ft[0] + " – " + m.score.ft[1]) : "—";
    var breakdown = "";
    if (played) {
      var parts = [];
      if (m.score.ht) parts.push("Entretiempo " + m.score.ht[0] + "–" + m.score.ht[1]);
      if (m.score.et) parts.push("Prórroga " + m.score.et[0] + "–" + m.score.et[1]);
      if (m.score.p) parts.push("Penales " + m.score.p[0] + "–" + m.score.p[1]);
      breakdown = parts.length ? '<div class="score-breakdown">' + parts.map(esc).join(" &middot; ") + '</div>' : "";
    }

    var isKO = m.num != null;
    var edit = Store.getEdit(id);
    var s1 = edit && edit.score ? edit.score.ft[0] : (played ? m.score.ft[0] : "");
    var s2 = edit && edit.score ? edit.score.ft[1] : (played ? m.score.ft[1] : "");

    root.innerHTML =
      '<a class="back" href="#/">&larr; Volver al bracket</a>' +
      '<div class="match-detail">' +
      '<div class="md-meta">' + meta + '</div>' +
      '<div class="md-ground">📍 ' + esc(m.ground || "") + '</div>' +
      '<div class="md-head">' +
      '<div class="md-team">' + flagImg(t1, "w160", "big") + '<div class="md-name">' + esc(t1) + '</div></div>' +
      '<div class="md-score">' + scoreBig + breakdown + (m.edited ? '<div class="edited-tag">editado</div>' : "") + '</div>' +
      '<div class="md-team">' + flagImg(t2, "w160", "big") + '<div class="md-name">' + esc(t2) + '</div></div>' +
      '</div>' +
      '<div class="md-goals"><ul class="glist">' + goals1 + '</ul><ul class="glist right">' + goals2 + '</ul></div>' +
      '<details class="edit-box" ' + (played ? "" : "open") + '>' +
      '<summary>' + (played ? "Editar resultado" : "Cargar resultado") + '</summary>' +
      '<div class="edit-form">' +
      '<div class="ef-row"><label>' + esc(t1) + '<input type="number" min="0" id="ef-s1" value="' + s1 + '"></label>' +
      '<label>' + esc(t2) + '<input type="number" min="0" id="ef-s2" value="' + s2 + '"></label></div>' +
      (isKO ? '<div class="ef-row"><label>Penales ' + esc(t1) + '<input type="number" min="0" id="ef-p1" value="' + (edit && edit.score && edit.score.p ? edit.score.p[0] : "") + '"></label>' +
        '<label>Penales ' + esc(t2) + '<input type="number" min="0" id="ef-p2" value="' + (edit && edit.score && edit.score.p ? edit.score.p[1] : "") + '"></label></div>' +
        '<p class="hint">En eliminatorias, completá los penales para desempatar y hacer avanzar el bracket.</p>' : "") +
      '<div class="ef-row"><label class="ta">Goleadores ' + esc(t1) + '<textarea id="ef-g1" rows="3" placeholder="Ej: 45 Nombre Jugador">' + goalsToText(m.goals1) + '</textarea></label>' +
      '<label class="ta">Goleadores ' + esc(t2) + '<textarea id="ef-g2" rows="3" placeholder="Ej: 90+2 Otro Jugador">' + goalsToText(m.goals2) + '</textarea></label></div>' +
      '<div class="ef-actions"><button class="btn primary" id="ef-save">Guardar</button>' +
      (m.edited ? '<button class="btn ghost" id="ef-reset">Restaurar original</button>' : "") + '</div>' +
      '</div></details>' +
      '</div>';

    document.getElementById("ef-save").addEventListener("click", function () {
      var a = parseInt(document.getElementById("ef-s1").value, 10);
      var b = parseInt(document.getElementById("ef-s2").value, 10);
      if (isNaN(a) || isNaN(b)) { alert("Ingresá ambos marcadores."); return; }
      var score = { ft: [a, b], ht: [0, 0] };
      if (isKO) {
        var pa = parseInt(document.getElementById("ef-p1").value, 10);
        var pb = parseInt(document.getElementById("ef-p2").value, 10);
        if (!isNaN(pa) && !isNaN(pb)) { score.et = [a, b]; score.p = [pa, pb]; }
      }
      var g1 = parseGoals(document.getElementById("ef-g1").value);
      var g2 = parseGoals(document.getElementById("ef-g2").value);
      Store.setEdit(id, score, g1, g2);
      WC.invalidate();
      window.dispatchEvent(new HashChangeEvent("hashchange")); // re-render
    });
    var reset = document.getElementById("ef-reset");
    if (reset) reset.addEventListener("click", function () {
      Store.clearEdit(id); WC.invalidate();
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
  }

  function goalsToText(goals) {
    return (goals || []).map(function (g) {
      return g.minute + " " + g.name + (g.penalty ? " (p)" : "") + (g.owngoal ? " (og)" : "");
    }).join("\n");
  }
  function parseGoals(text) {
    return (text || "").split("\n").map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
      var mt = /^(\d+\+?\d*'?)\s+(.*)$/.exec(l);
      var minute, name;
      if (mt) { minute = mt[1].replace("'", ""); name = mt[2]; }
      else { minute = ""; name = l; }
      var g = { minute: minute, name: name.replace(/\s*\((p|og|pen|e\.c\.)\)\s*/gi, "").trim() };
      if (/\((p|pen)\)/i.test(name)) g.penalty = true;
      if (/\((og|e\.c\.)\)/i.test(name)) g.owngoal = true;
      return g;
    });
  }

  window.Views = {
    renderHome: renderHome,
    renderMatch: renderMatch,
    matchRow: matchRow,
    flagImg: flagImg,
    scoreStr: scoreStr,
    esc: esc,
    el: el
  };
})();
