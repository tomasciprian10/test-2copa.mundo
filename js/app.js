// Hash router + app bootstrap.
(function () {
  var routes = {
    home: function (root) { window.Views.renderHome(root); },
    match: function (root, id) { window.Views.renderMatch(root, id); },
    pools: function (root) { window.PoolsView.render(root); }
  };

  function setNav(view) {
    document.querySelectorAll(".nav-link").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-view") === view);
    });
  }

  function router() {
    // No renderizar vistas si Supabase está configurado y todavía no hay sesión
    // (en ese caso #app muestra la pantalla de login).
    if (window.Auth && !window.Auth.canRender()) return;
    var root = document.getElementById("app");
    var hash = location.hash.replace(/^#\/?/, "");
    var parts = hash.split("/").filter(Boolean);
    window.scrollTo(0, 0);

    if (parts[0] === "match" && parts[1]) {
      setNav("home");
      routes.match(root, parts[1]);
    } else if (parts[0] === "pools") {
      setNav("pools");
      routes.pools(root);
    } else {
      setNav("home");
      routes.home(root);
    }
  }

  // Exponer el render para que Auth (y el sync en tiempo real) puedan redibujar.
  window.WCApp = { render: router };

  window.addEventListener("hashchange", router);
  window.addEventListener("DOMContentLoaded", function () {
    window.Auth.start();
  });
})();
