// Autenticación (email + contraseña) y arranque de la app.
//
// - Sin Supabase configurado  -> modo local, sin login (comportamiento original).
// - Con Supabase configurado   -> exige sesión: muestra login/registro y, una vez
//   logueado, carga los datos y monta la app.
(function () {
  var SB = window.SB || null;
  var mounted = false;

  // ---- Toast simple (también lo usa store.js para errores) ----
  window.toast = function (msg, isError) {
    var t = document.createElement("div");
    t.className = "toast" + (isError ? " error" : "");
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () { if (t.parentNode) t.remove(); }, 300);
    }, 3400);
  };

  function canRender() { return !SB || mounted; }

  function start() {
    if (!SB) { mountApp(); return; }              // modo local
    SB.auth.onAuthStateChange(function (_event, session) {
      if (session) {
        if (!mounted) { mounted = true; mountApp(); }
      } else {
        mounted = false;
        renderLogin();
      }
    });
  }

  function mountApp() {
    return window.Store.init().then(function () {
      renderUserChip();
      maybeOfferMigration();
      if (!location.hash) location.hash = "#/";
      window.WCApp.render();
    }).catch(function (err) {
      console.error(err);
      document.getElementById("app").innerHTML =
        '<div class="auth-card"><h2>Error al cargar los datos</h2>' +
        '<p class="muted">' + (err && err.message ? String(err.message) : "Revisá la configuración de Supabase.") + '</p></div>';
    });
  }

  // ---- Chip de usuario + logout en la barra superior ----
  function renderUserChip() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var old = document.getElementById("user-chip");
    if (old) old.remove();
    if (!SB) return;

    SB.auth.getUser().then(function (r) {
      var email = r.data && r.data.user ? r.data.user.email : "";
      var span = document.createElement("span");
      span.id = "user-chip";
      span.className = "user-chip";
      span.innerHTML = '<span class="uc-email" title="' + esc(email) + '">' + esc(email) + '</span>' +
        '<button class="uc-out" id="logout-btn">Salir</button>';
      nav.appendChild(span);
      document.getElementById("logout-btn").addEventListener("click", function () {
        SB.auth.signOut();
      });
    });
  }

  // ---- Ofrecer subir datos locales una sola vez ----
  function maybeOfferMigration() {
    if (!SB || !window.Store.hasLocalData()) return;
    if (localStorage.getItem("wc2026.migrated")) return;
    if (confirm("Encontramos datos guardados en este navegador (pools y/o resultados).\n¿Subirlos a tu cuenta de Supabase para no perderlos?")) {
      window.Store.migrateLocalToCloud().then(function (n) {
        localStorage.setItem("wc2026.migrated", "1");
        window.toast("Se subieron " + n + " registros a la nube.");
        window.WC.invalidate();
        window.WCApp.render();
      }).catch(function (e) {
        console.error(e);
        window.toast("No se pudieron subir los datos locales.", true);
      });
    } else {
      localStorage.setItem("wc2026.migrated", "1");
    }
  }

  // ---- Pantalla de login / registro ----
  function renderLogin() {
    var root = document.getElementById("app");
    var chip = document.getElementById("user-chip");
    if (chip) chip.remove();
    var mode = "signin"; // "signin" | "signup"

    function paint() {
      var isSignup = mode === "signup";
      root.innerHTML =
        '<div class="auth-card">' +
        '<h2>' + (isSignup ? "Crear cuenta" : "Iniciar sesión") + '</h2>' +
        '<p class="muted">Para cargar resultados y apuestas compartidas con tus amigos.</p>' +
        '<form id="auth-form" class="auth-form">' +
        '<label>Email<input type="email" id="auth-email" autocomplete="email" required></label>' +
        '<label>Contraseña<input type="password" id="auth-pass" autocomplete="' +
          (isSignup ? "new-password" : "current-password") + '" minlength="6" required></label>' +
        '<button class="btn primary" type="submit" id="auth-submit">' +
          (isSignup ? "Registrarme" : "Entrar") + '</button>' +
        '<p class="auth-msg" id="auth-msg"></p>' +
        '</form>' +
        '<p class="auth-switch">' +
        (isSignup ? "¿Ya tenés cuenta? " : "¿No tenés cuenta? ") +
        '<a href="#" id="auth-toggle">' + (isSignup ? "Iniciá sesión" : "Registrate") + '</a>' +
        '</p>' +
        '</div>';

      document.getElementById("auth-toggle").addEventListener("click", function (e) {
        e.preventDefault();
        mode = isSignup ? "signin" : "signup";
        paint();
      });

      document.getElementById("auth-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var email = document.getElementById("auth-email").value.trim();
        var pass = document.getElementById("auth-pass").value;
        var msg = document.getElementById("auth-msg");
        var btn = document.getElementById("auth-submit");
        btn.disabled = true;
        msg.className = "auth-msg";
        msg.textContent = isSignup ? "Creando cuenta..." : "Entrando...";

        var p = isSignup
          ? SB.auth.signUp({ email: email, password: pass })
          : SB.auth.signInWithPassword({ email: email, password: pass });

        p.then(function (res) {
          btn.disabled = false;
          if (res.error) {
            msg.className = "auth-msg error";
            msg.textContent = translateAuthError(res.error.message);
            return;
          }
          if (isSignup && res.data.user && !res.data.session) {
            // Confirmación por email activada: no hay sesión todavía.
            msg.className = "auth-msg ok";
            msg.textContent = "Revisá tu email para confirmar la cuenta y después iniciá sesión.";
          }
          // Si hay sesión, onAuthStateChange se encarga de montar la app.
        });
      });
    }
    paint();
  }

  function translateAuthError(m) {
    m = String(m || "");
    if (/Invalid login credentials/i.test(m)) return "Email o contraseña incorrectos.";
    if (/already registered/i.test(m)) return "Ese email ya tiene una cuenta. Iniciá sesión.";
    if (/at least 6/i.test(m)) return "La contraseña debe tener al menos 6 caracteres.";
    if (/Email not confirmed/i.test(m)) return "Confirmá tu email antes de entrar.";
    return m;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  window.Auth = { start: start, canRender: canRender };
})();
