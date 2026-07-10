// Tournament model: normalization, bracket tree, winner resolution, standings, scoring.
(function () {
  // Parent knockout match num -> its two feeder match nums.
  // (103 = third-place playoff, fed by the LOSERS of the two semifinals.)
  var CHILDREN = {
    104: [101, 102],
    103: [101, 102],
    101: [97, 98],
    102: [99, 100],
    97: [89, 90], 98: [93, 94], 99: [91, 92], 100: [95, 96],
    89: [74, 77], 90: [73, 75], 91: [76, 78], 92: [79, 80],
    93: [83, 84], 94: [81, 82], 95: [86, 88], 96: [85, 87]
  };

  var _matches = null;   // normalized list (cached, rebuilt on invalidate)
  var _byId = null;
  var _byNum = null;

  function build() {
    var raw = window.WC_DATA.matches;
    _matches = [];
    _byId = {};
    _byNum = {};
    for (var i = 0; i < raw.length; i++) {
      var m = raw[i];
      var id = m.num != null ? "k" + m.num : "g" + i;
      var norm = {
        id: id,
        idx: i,
        num: m.num != null ? m.num : null,
        round: m.round,
        date: m.date,
        time: m.time,
        group: m.group || null,
        ground: m.ground,
        team1: m.team1,
        team2: m.team2,
        score: m.score || null,
        goals1: m.goals1 || [],
        goals2: m.goals2 || []
      };
      // Merge any locally-saved result edit over the base data.
      var edit = window.Store.getEdit(id);
      if (edit && edit.score) {
        norm.score = edit.score;
        norm.goals1 = edit.goals1 || [];
        norm.goals2 = edit.goals2 || [];
        norm.edited = true;
      }
      _matches.push(norm);
      _byId[id] = norm;
      if (norm.num != null) _byNum[norm.num] = norm;
    }
  }

  function ensure() { if (!_matches) build(); }

  function isPlayed(m) {
    return !!(m && m.score && Array.isArray(m.score.ft));
  }

  // Decisive score for a knockout (penalties > extra time > full time).
  function decisive(m) {
    if (!m.score) return null;
    if (m.score.p) return m.score.p;
    if (m.score.et) return m.score.et;
    return m.score.ft || null;
  }

  // "W97" -> winner of match 97 ; "L101" -> loser of match 101.
  function resolveTeam(name, depth) {
    depth = depth || 0;
    if (depth > 10 || !name) return name;
    var mt = /^([WL])(\d+)$/.exec(name);
    if (!mt) return name;
    var feeder = _byNum[parseInt(mt[2], 10)];
    if (!feeder) return name;
    var team = mt[1] === "W" ? winnerOf(feeder) : loserOf(feeder);
    if (!team) return name; // not decided yet -> keep placeholder
    return resolveTeam(team, depth + 1);
  }

  function winnerOf(m) {
    if (!isPlayed(m)) return null;
    var s = decisive(m);
    if (!s || s[0] === s[1]) return null; // draw (group stage)
    return s[0] > s[1] ? resolveTeam(m.team1) : resolveTeam(m.team2);
  }
  function loserOf(m) {
    if (!isPlayed(m)) return null;
    var s = decisive(m);
    if (!s || s[0] === s[1]) return null;
    return s[0] > s[1] ? resolveTeam(m.team2) : resolveTeam(m.team1);
  }

  // Build the nested bracket tree from a root num. Leaves are R32 matches.
  function node(num) {
    var m = _byNum[num];
    var kids = CHILDREN[num];
    return {
      num: num,
      match: m,
      team1: m ? resolveTeam(m.team1) : null,
      team2: m ? resolveTeam(m.team2) : null,
      children: kids ? [node(kids[0]), node(kids[1])] : null
    };
  }

  // In-order traversal collecting the 32 outer team slots (order around the ring).
  function collectLeaves(n, out) {
    if (!n.children) {
      out.push({ num: n.num, slot: 1, team: n.team1, match: n.match });
      out.push({ num: n.num, slot: 2, team: n.team2, match: n.match });
      return;
    }
    collectLeaves(n.children[0], out);
    collectLeaves(n.children[1], out);
  }

  // Group-stage standings for a given group label.
  function standings(group) {
    ensure();
    var table = {};
    function row(t) {
      if (!table[t]) table[t] = { team: t, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 };
      return table[t];
    }
    _matches.forEach(function (m) {
      if (m.group !== group || !isPlayed(m)) return;
      var ft = m.score.ft, a = row(m.team1), b = row(m.team2);
      a.pj++; b.pj++;
      a.gf += ft[0]; a.gc += ft[1];
      b.gf += ft[1]; b.gc += ft[0];
      if (ft[0] > ft[1]) { a.g++; a.pts += 3; b.p++; }
      else if (ft[0] < ft[1]) { b.g++; b.pts += 3; a.p++; }
      else { a.e++; b.e++; a.pts++; b.pts++; }
    });
    return Object.keys(table).map(function (k) { return table[k]; }).sort(function (x, y) {
      return y.pts - x.pts || (y.gf - y.gc) - (x.gf - x.gc) || y.gf - x.gf || x.team.localeCompare(y.team);
    });
  }

  function groupLabels() {
    ensure();
    var seen = {};
    _matches.forEach(function (m) { if (m.group) seen[m.group] = true; });
    return Object.keys(seen).sort();
  }

  // Points for one predicted score vs the real full-time result.
  // 3 = exact score, 1 = correct outcome (winner or draw), 0 = wrong.
  function scorePrediction(pred, ft) {
    if (!pred || !ft) return 0;
    if (pred[0] === ft[0] && pred[1] === ft[1]) return 3;
    var sp = Math.sign(pred[0] - pred[1]);
    var sf = Math.sign(ft[0] - ft[1]);
    return sp === sf ? 1 : 0;
  }

  // Phase label used for pool scope ("Grupos" or the knockout round name).
  function phaseOf(m) { return m.group ? "Grupos" : m.round; }

  // Compute a pool leaderboard. pool.predictions[participantId][matchId] = [a,b].
  // pool.scopeRounds (optional) limits which phases count; empty/undefined = all.
  function scorePool(pool) {
    ensure();
    var scope = pool.scopeRounds && pool.scopeRounds.length ? pool.scopeRounds : null;
    return pool.participants.map(function (p) {
      var pts = 0, exact = 0, correct = 0, made = 0;
      var preds = (pool.predictions && pool.predictions[p.id]) || {};
      Object.keys(preds).forEach(function (mid) {
        var m = _byId[mid];
        if (!m || !isPlayed(m)) return;
        if (scope && scope.indexOf(phaseOf(m)) < 0) return;
        made++;
        var s = scorePrediction(preds[mid], m.score.ft);
        pts += s;
        if (s === 3) exact++;
        else if (s === 1) correct++;
      });
      return { id: p.id, name: p.name, pts: pts, exact: exact, correct: correct, made: made };
    }).sort(function (a, b) {
      return b.pts - a.pts || b.exact - a.exact || a.name.localeCompare(b.name);
    });
  }

  window.WC = {
    invalidate: function () { _matches = null; _byId = null; _byNum = null; },
    all: function () { ensure(); return _matches; },
    byId: function (id) { ensure(); return _byId[id]; },
    byNum: function (n) { ensure(); return _byNum[n]; },
    isPlayed: isPlayed,
    decisive: decisive,
    resolveTeam: function (t) { ensure(); return resolveTeam(t); },
    winnerOf: winnerOf,
    loserOf: loserOf,
    tree: function () { ensure(); return node(104); },
    thirdPlace: function () { ensure(); return node(103); },
    ringOrder: function () { ensure(); var out = []; collectLeaves(node(104), out); return out; },
    standings: standings,
    groupLabels: groupLabels,
    scorePrediction: scorePrediction,
    scorePool: scorePool,
    phaseOf: phaseOf,
    childrenMap: CHILDREN
  };
})();
