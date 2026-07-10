// View 3: betting pools + leaderboard (all persisted in localStorage).
(function () {
  var WC = window.WC, Store = window.Store;
  var esc = window.Views.esc, flagImg = window.Views.flagImg;

  var state = { poolId: null, partId: null, phase: "Grupos" };

  function phases() {
    var list = ["Grupos"];
    var seen = {};
    WC.all().forEach(function (m) {
      if (m.num && !seen[m.round]) { seen[m.round] = true; }
    });
    ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Match for third place", "Final"]
      .forEach(function (r) { if (seen[r]) list.push(r); });
    return list;
  }

  function matchesForPhase(phase) {
    return WC.all().filter(function (m) {
      return phase === "Grupos" ? !!m.group : (m.num && m.round === phase);
    });
  }

  function render(root) {
    var pools = Store.getPools();
    if (state.poolId && !Store.getPool(state.poolId)) state.poolId = null;
    if (!state.poolId && pools.length) state.poolId = pools[0].id; // auto-select first

    var chips = pools.map(function (p) {
      return '<button class="chip ' + (p.id === state.poolId ? "active" : "") + '" data-pool="' + p.id + '">' + esc(p.name) + '</button>';
    }).join("");

    root.innerHTML =
      '<section class="pools-head">' +
      '<h2>Apuestas &amp; Leaderboard</h2>' +
      '<p class="muted">Creá un pool, sumá a tus amigos y cargá sus pronósticos. ' +
      '<strong>+3</strong> por resultado exacto, <strong>+1</strong> por acertar el ganador.</p>' +
      '<div class="pool-chips">' + chips + '<button class="chip new" id="new-pool">＋ Nuevo pool</button></div>' +
      '</section>' +
      '<div id="pool-panel"></div>';

    root.querySelector("#new-pool").addEventListener("click", function () {
      var name = prompt("Nombre del pool:", "La Copa de Amigos");
      if (!name) return;
      var pool = { id: Store.newId(), name: name.trim(), participants: [], predictions: {}, scopeRounds: [] };
      Store.savePool(pool);
      state.poolId = pool.id; state.partId = null;
      render(root);
    });
    root.querySelectorAll("[data-pool]").forEach(function (b) {
      b.addEventListener("click", function () { state.poolId = b.getAttribute("data-pool"); state.partId = null; render(root); });
    });

    var panel = root.querySelector("#pool-panel");
    if (!state.poolId) {
      panel.innerHTML = '<div class="empty">' + (pools.length ? "Elegí un pool arriba." : "Todavía no hay pools. Creá el primero para empezar.") + '</div>';
      return;
    }
    renderPool(root, panel, Store.getPool(state.poolId));
  }

  function renderPool(root, panel, pool) {
    if (!pool.predictions) pool.predictions = {};
    var board = WC.scorePool(pool);
    if (!state.partId && pool.participants[0]) state.partId = pool.participants[0].id;

    // Leaderboard
    var lbRows = board.length ? board.map(function (r, i) {
      var medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
      return '<tr class="' + (r.id === state.partId ? "sel" : "") + '"><td class="pos">' + medal + '</td>' +
        '<td class="tn">' + esc(r.name) + '</td><td>' + r.made + '</td><td>' + r.exact + '</td>' +
        '<td>' + r.correct + '</td><td class="pts">' + r.pts + '</td></tr>';
    }).join("") : '<tr><td colspan="6" class="none">Sin participantes todavía.</td></tr>';

    // Participant chips
    var partChips = pool.participants.map(function (p) {
      return '<span class="part-chip ' + (p.id === state.partId ? "active" : "") + '" data-part="' + p.id + '">' +
        '<button class="pc-name" data-part="' + p.id + '">' + esc(p.name) + '</button>' +
        '<button class="pc-del" data-del="' + p.id + '" title="Quitar">✕</button></span>';
    }).join("");

    // Scope config
    var scopeHtml = phases().map(function (ph) {
      var on = !pool.scopeRounds.length || pool.scopeRounds.indexOf(ph) >= 0;
      var label = ph === "Grupos" ? "Grupos" : phaseLabel(ph);
      return '<label class="scope-item"><input type="checkbox" data-scope="' + esc(ph) + '" ' + (on ? "checked" : "") + '> ' + esc(label) + '</label>';
    }).join("");

    panel.innerHTML =
      '<div class="pool-toolbar"><h3>' + esc(pool.name) + '</h3>' +
      '<div class="pt-actions"><button class="btn ghost" id="rename-pool">Renombrar</button>' +
      '<button class="btn danger" id="delete-pool">Eliminar pool</button></div></div>' +

      '<div class="pool-grid">' +
      '<section class="lb-box"><h4>Leaderboard</h4>' +
      '<table class="leaderboard"><thead><tr><th></th><th>Amigo</th><th title="Pronósticos resueltos">PR</th><th title="Exactos (+3)">Ex</th><th title="Ganador (+1)">Gan</th><th>Pts</th></tr></thead>' +
      '<tbody>' + lbRows + '</tbody></table>' +
      '<details class="scope-box"><summary>Configurar qué cuenta</summary><div class="scope-list">' + scopeHtml + '</div>' +
      '<p class="hint">Sin marcar nada cuentan todas las fases.</p></details>' +
      '</section>' +

      '<section class="pred-box">' +
      '<h4>Participantes</h4>' +
      '<div class="add-part"><input id="part-name" placeholder="Nombre del amigo" maxlength="24"><button class="btn primary" id="add-part">Agregar</button></div>' +
      '<div class="part-chips">' + (partChips || '<span class="muted">Agregá amigos para cargar pronósticos.</span>') + '</div>' +
      '<div id="pred-area"></div>' +
      '</section>' +
      '</div>';

    // --- wiring ---
    panel.querySelector("#rename-pool").addEventListener("click", function () {
      var n = prompt("Nuevo nombre:", pool.name);
      if (n && n.trim()) { pool.name = n.trim(); Store.savePool(pool); render(root); }
    });
    panel.querySelector("#delete-pool").addEventListener("click", function () {
      if (confirm('¿Eliminar el pool "' + pool.name + '"? Esto borra sus pronósticos.')) {
        Store.deletePool(pool.id); state.poolId = null; render(root);
      }
    });
    panel.querySelector("#add-part").addEventListener("click", function () { addPart(); });
    panel.querySelector("#part-name").addEventListener("keydown", function (e) { if (e.key === "Enter") addPart(); });
    function addPart() {
      var inp = panel.querySelector("#part-name");
      var name = inp.value.trim();
      if (!name) return;
      var p = { id: Store.newId(), name: name };
      pool.participants.push(p);
      pool.predictions[p.id] = pool.predictions[p.id] || {};
      Store.savePool(pool);
      state.partId = p.id;
      render(root);
    }
    panel.querySelectorAll(".pc-name").forEach(function (b) {
      b.addEventListener("click", function () { state.partId = b.getAttribute("data-part"); render(root); });
    });
    panel.querySelectorAll(".pc-del").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-del");
        if (!confirm("¿Quitar a este participante?")) return;
        pool.participants = pool.participants.filter(function (x) { return x.id !== id; });
        delete pool.predictions[id];
        if (state.partId === id) state.partId = pool.participants[0] ? pool.participants[0].id : null;
        Store.savePool(pool); render(root);
      });
    });
    panel.querySelectorAll("[data-scope]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var checked = Array.prototype.slice.call(panel.querySelectorAll("[data-scope]"))
          .filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute("data-scope"); });
        // All checked == no restriction.
        pool.scopeRounds = checked.length === phases().length ? [] : checked;
        Store.savePool(pool);
        refreshBoard(panel, pool);
      });
    });

    renderPredArea(root, panel, pool);
  }

  function renderPredArea(root, panel, pool) {
    var area = panel.querySelector("#pred-area");
    if (!state.partId) { area.innerHTML = ""; return; }

    var phaseOpts = phases().map(function (ph) {
      return '<option value="' + esc(ph) + '" ' + (ph === state.phase ? "selected" : "") + '>' + esc(ph === "Grupos" ? "Fase de grupos" : phaseLabel(ph)) + '</option>';
    }).join("");

    var preds = pool.predictions[state.partId] || {};
    var rows = matchesForPhase(state.phase).map(function (m) {
      var t1 = WC.resolveTeam(m.team1), t2 = WC.resolveTeam(m.team2);
      var pr = preds[m.id] || ["", ""];
      var badge = "";
      if (WC.isPlayed(m) && preds[m.id]) {
        var pts = WC.scorePrediction(preds[m.id], m.score.ft);
        badge = '<span class="pt-badge b' + pts + '">' + (pts === 3 ? "+3" : pts === 1 ? "+1" : "0") + '</span>';
      } else if (WC.isPlayed(m)) {
        badge = '<span class="pt-badge real">' + m.score.ft[0] + "–" + m.score.ft[1] + '</span>';
      }
      return '<div class="pred-row" data-mid="' + m.id + '">' +
        '<span class="pr-t t1">' + esc(t1) + " " + flagImg(t1, "w40") + '</span>' +
        '<input class="pr-in" type="number" min="0" data-mid="' + m.id + '" data-side="0" value="' + pr[0] + '">' +
        '<span class="pr-x">–</span>' +
        '<input class="pr-in" type="number" min="0" data-mid="' + m.id + '" data-side="1" value="' + pr[1] + '">' +
        '<span class="pr-t t2">' + flagImg(t2, "w40") + " " + esc(t2) + '</span>' +
        badge + '</div>';
    }).join("");

    var partName = (pool.participants.filter(function (p) { return p.id === state.partId; })[0] || {}).name || "";
    area.innerHTML =
      '<div class="pred-controls"><span class="pred-for">Pronósticos de <strong>' + esc(partName) + '</strong></span>' +
      '<select id="phase-sel">' + phaseOpts + '</select></div>' +
      '<div class="pred-list">' + rows + '</div>';

    area.querySelector("#phase-sel").addEventListener("change", function () {
      state.phase = this.value; renderPredArea(root, panel, pool);
    });
    area.querySelectorAll(".pr-in").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var mid = inp.getAttribute("data-mid");
        var side = parseInt(inp.getAttribute("data-side"), 10);
        pool.predictions[state.partId] = pool.predictions[state.partId] || {};
        var cur = pool.predictions[state.partId][mid];
        var other = area.querySelector('.pr-in[data-mid="' + mid + '"][data-side="' + (1 - side) + '"]');
        var a = side === 0 ? inp.value : other.value;
        var b = side === 1 ? inp.value : other.value;
        if (a === "" && b === "") { delete pool.predictions[state.partId][mid]; }
        else { pool.predictions[state.partId][mid] = [numOr(a), numOr(b)]; }
        Store.savePool(pool);
        refreshBoard(panel, pool);
        // Update this row's badge without losing focus.
        renderRowBadge(area, pool, mid);
      });
    });
  }

  function renderRowBadge(area, pool, mid) {
    var m = WC.byId(mid);
    var row = area.querySelector('.pred-row[data-mid="' + mid + '"]');
    if (!row) return;
    var old = row.querySelector(".pt-badge");
    if (old) old.remove();
    var preds = pool.predictions[state.partId] || {};
    if (WC.isPlayed(m) && preds[mid]) {
      var pts = WC.scorePrediction(preds[mid], m.score.ft);
      var span = document.createElement("span");
      span.className = "pt-badge b" + pts;
      span.textContent = pts === 3 ? "+3" : pts === 1 ? "+1" : "0";
      row.appendChild(span);
    }
  }

  function refreshBoard(panel, pool) {
    var board = WC.scorePool(pool);
    var tb = panel.querySelector(".leaderboard tbody");
    if (!tb) return;
    tb.innerHTML = board.length ? board.map(function (r, i) {
      var medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
      return '<tr class="' + (r.id === state.partId ? "sel" : "") + '"><td class="pos">' + medal + '</td>' +
        '<td class="tn">' + esc(r.name) + '</td><td>' + r.made + '</td><td>' + r.exact + '</td>' +
        '<td>' + r.correct + '</td><td class="pts">' + r.pts + '</td></tr>';
    }).join("") : '<tr><td colspan="6" class="none">Sin participantes todavía.</td></tr>';
  }

  function numOr(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function phaseLabel(r) {
    return { "Round of 32": "16avos", "Round of 16": "Octavos", "Quarter-final": "Cuartos", "Semi-final": "Semifinal", "Match for third place": "3er puesto", "Final": "Final" }[r] || r;
  }

  window.PoolsView = { render: render };
})();
