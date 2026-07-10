// Radial (circular) knockout bracket rendered as SVG — flags on the outer ring,
// rounds spiralling inward, trophy at the centre.
(function () {
  var CX = 500, CY = 500;
  var R = { team: 460, k32: 398, k16: 312, qf: 216, sf: 116 };
  var FLAG_R = 26;

  function radiusForNum(num) {
    if (num >= 73 && num <= 88) return R.k32;
    if (num >= 89 && num <= 96) return R.k16;
    if (num >= 97 && num <= 100) return R.qf;
    if (num === 101 || num === 102) return R.sf;
    return 0; // final -> centre
  }

  function polar(r, deg) {
    var rad = deg * Math.PI / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  }
  function line(p1, p2, cls) {
    return '<line x1="' + p1.x.toFixed(1) + '" y1="' + p1.y.toFixed(1) +
      '" x2="' + p2.x.toFixed(1) + '" y2="' + p2.y.toFixed(1) + '" class="' + cls + '"/>';
  }
  function arc(r, a1, a2, cls) {
    var p1 = polar(r, a1), p2 = polar(r, a2);
    var large = Math.abs(a2 - a1) > 180 ? 1 : 0;
    var sweep = a2 > a1 ? 1 : 0;
    return '<path d="M' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1) + ' A ' + r + ' ' + r +
      ' 0 ' + large + ' ' + sweep + ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1) + '" class="' + cls + '"/>';
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function teamCircle(slot, angle, statusCls) {
    var p = polar(R.team, angle);
    var team = slot.team;
    var url = window.flagUrl(team, "w80");
    var clip = "clip_" + slot.num + "_" + slot.slot;
    var inner = "";
    if (url) {
      inner =
        '<clipPath id="' + clip + '"><circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (FLAG_R - 2) + '"/></clipPath>' +
        '<image href="' + url + '" x="' + (p.x - FLAG_R + 2).toFixed(1) + '" y="' + (p.y - FLAG_R + 2).toFixed(1) +
        '" width="' + (2 * (FLAG_R - 2)) + '" height="' + (2 * (FLAG_R - 2)) +
        '" clip-path="url(#' + clip + ')" preserveAspectRatio="xMidYMid slice"/>';
    } else {
      inner = '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + 4).toFixed(1) + '" class="team-code">' + esc(window.teamCode(team)) + '</text>';
    }
    return '<g class="team ' + statusCls + '" data-mid="k' + slot.num + '" tabindex="0" role="button">' +
      '<title>' + esc(team) + '</title>' +
      '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + FLAG_R + '" class="flag-ring"/>' +
      inner + '</g>';
  }

  function render(container) {
    var ring = window.WC.ringOrder();
    var N = ring.length;
    var teamAngle = {};
    ring.forEach(function (slot, i) {
      teamAngle[slot.num + "_" + slot.slot] = -90 + (i + 0.5) * (360 / N);
    });

    var connectors = [], nodes = [], teams = [];

    // Recursively draw a node; returns its angle.
    function draw(n) {
      var m = n.match;
      var w = m ? window.WC.winnerOf(m) : null;

      if (!n.children) {
        // R32 leaf: two team circles feed one match node.
        var a1 = teamAngle[n.num + "_1"], a2 = teamAngle[n.num + "_2"];
        var s1 = w ? (n.team1 === w ? "adv" : "out") : "";
        var s2 = w ? (n.team2 === w ? "adv" : "out") : "";
        teams.push(teamCircle({ num: n.num, slot: 1, team: n.team1 }, a1, s1));
        teams.push(teamCircle({ num: n.num, slot: 2, team: n.team2 }, a2, s2));
        var rP = radiusForNum(n.num);
        connectors.push(line(polar(R.team - FLAG_R, a1), polar(rP, a1), "conn"));
        connectors.push(line(polar(R.team - FLAG_R, a2), polar(rP, a2), "conn"));
        connectors.push(arc(rP, a1, a2, "conn"));
        var aP = (a1 + a2) / 2;
        nodes.push(nodeMarker(m, aP, rP));
        return aP;
      }

      var c1 = draw(n.children[0]);
      var c2 = draw(n.children[1]);
      var rParent = radiusForNum(n.num);
      var rChild = radiusForNum(n.children[0].num);

      if (n.num === 104) {
        // Final: straight spokes from each semifinal into the centre trophy.
        connectors.push(line(polar(rChild, c1), { x: CX, y: CY }, "conn"));
        connectors.push(line(polar(rChild, c2), { x: CX, y: CY }, "conn"));
        return 90;
      }
      connectors.push(line(polar(rChild, c1), polar(rParent, c1), "conn"));
      connectors.push(line(polar(rChild, c2), polar(rParent, c2), "conn"));
      connectors.push(arc(rParent, c1, c2, "conn"));
      var a = (c1 + c2) / 2;
      nodes.push(nodeMarker(m, a, rParent));
      return a;
    }

    function nodeMarker(m, angle, r) {
      if (!m) return "";
      var p = polar(r, angle);
      var played = window.WC.isPlayed(m);
      return '<g class="node ' + (played ? "played" : "pending") + '" data-mid="' + m.id + '" tabindex="0" role="button">' +
        '<title>' + esc(window.WC.resolveTeam(m.team1)) + " vs " + esc(window.WC.resolveTeam(m.team2)) + '</title>' +
        '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="7" class="node-dot"/></g>';
    }

    draw(window.WC.tree());

    // Centre trophy + final outcome.
    var finalM = window.WC.byNum(104);
    var champ = window.WC.winnerOf(finalM);
    var centre =
      '<circle cx="' + CX + '" cy="' + CY + '" r="46" class="centre-disc"/>' +
      '<text x="' + CX + '" y="' + (CY + 4) + '" class="trophy">🏆</text>' +
      (champ ? '<text x="' + CX + '" y="' + (CY + 34) + '" class="champ-label">' + esc(champ) + '</text>' : "");

    var svg =
      '<svg viewBox="0 0 1000 1000" class="bracket-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bracket eliminatorio Mundial 2026">' +
      '<g class="connectors">' + connectors.join("") + '</g>' +
      '<g class="nodes">' + nodes.join("") + '</g>' +
      '<g class="teams">' + teams.join("") + '</g>' +
      '<g class="centre">' + centre + '</g>' +
      '</svg>';

    container.innerHTML = svg;

    // Delegate clicks: any element carrying data-mid opens that match.
    function go(el) {
      var g = el.closest("[data-mid]");
      if (g) location.hash = "#/match/" + g.getAttribute("data-mid");
    }
    container.querySelector("svg").addEventListener("click", function (e) { go(e.target); });
    container.querySelector("svg").addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { go(e.target); e.preventDefault(); }
    });
  }

  window.Bracket = { render: render };
})();
