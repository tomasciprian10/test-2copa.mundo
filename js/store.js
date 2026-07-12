// Capa de persistencia.
//
// La API que ve el resto de la app es SÍNCRONA (getEdit, getPools, savePool...),
// igual que antes. Por detrás mantenemos un caché en memoria que:
//   - se carga una vez al iniciar (Store.init), desde Supabase o localStorage;
//   - se lee de forma síncrona (para no tener que volver async model/vistas);
//   - en las escrituras se actualiza al toque (render optimista) y, si hay
//     Supabase, se empuja el cambio a la base en segundo plano;
//   - con Supabase, se sincroniza en vivo vía Realtime (cambios de tus amigos).
(function () {
  var K_EDITS = "wc2026.resultEdits";
  var K_POOLS = "wc2026.pools";

  var SB = window.SB || null;
  var useCloud = !!SB;

  var _edits = {};  // { matchId: { score, goals1, goals2 } }
  var _pools = {};  // { poolId: poolObject }   (orden de inserción preservado)
  var _subbed = false;

  function lsRead(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  }
  function lsWrite(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn("localStorage write failed", e); }
  }
  function notify(msg, isError) {
    if (window.toast) window.toast(msg, isError);
    else if (isError) console.warn(msg);
  }
  function persistPoolsLocal() { lsWrite(K_POOLS, Store.getPools()); }

  var Store = {
    isCloud: function () { return useCloud; },

    // Carga inicial del caché. Devuelve una promesa; resolvela antes del primer render.
    init: function () {
      if (!useCloud) {
        _edits = lsRead(K_EDITS, {}) || {};
        _pools = {};
        (lsRead(K_POOLS, []) || []).forEach(function (p) { _pools[p.id] = p; });
        return Promise.resolve();
      }
      return Promise.all([
        SB.from("result_edits").select("match_id, doc"),
        SB.from("pools").select("id, doc").order("created_at", { ascending: true })
      ]).then(function (res) {
        if (res[0].error) throw res[0].error;
        if (res[1].error) throw res[1].error;
        _edits = {};
        (res[0].data || []).forEach(function (r) { _edits[r.match_id] = r.doc; });
        _pools = {};
        (res[1].data || []).forEach(function (r) { _pools[r.id] = r.doc; });
        subscribe();
      });
    },

    // ---- Ediciones de resultados ----
    getEdits: function () { return _edits; },
    getEdit: function (id) { return _edits[id] || null; },
    setEdit: function (id, score, goals1, goals2) {
      var doc = { score: score, goals1: goals1 || [], goals2: goals2 || [] };
      _edits[id] = doc;
      if (useCloud) {
        SB.from("result_edits").upsert({ match_id: id, doc: doc })
          .then(function (r) { if (r.error) notify("No se pudo guardar el resultado.", true); });
      } else lsWrite(K_EDITS, _edits);
    },
    clearEdit: function (id) {
      delete _edits[id];
      if (useCloud) {
        SB.from("result_edits").delete().eq("match_id", id)
          .then(function (r) { if (r.error) notify("No se pudo restaurar el resultado.", true); });
      } else lsWrite(K_EDITS, _edits);
    },

    // ---- Pools ----
    getPools: function () {
      return Object.keys(_pools).map(function (k) { return _pools[k]; });
    },
    getPool: function (id) { return _pools[id] || null; },
    savePool: function (pool) {
      _pools[pool.id] = pool;
      if (useCloud) {
        SB.from("pools").upsert({ id: pool.id, name: pool.name, doc: pool })
          .then(function (r) { if (r.error) notify("No se pudo guardar el pool.", true); });
      } else persistPoolsLocal();
    },
    deletePool: function (id) {
      delete _pools[id];
      if (useCloud) {
        SB.from("pools").delete().eq("id", id)
          .then(function (r) { if (r.error) notify("No se pudo eliminar el pool (¿lo creó otra persona?).", true); });
      } else persistPoolsLocal();
    },

    newId: function () {
      return "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    },

    // Migración one-shot de lo que tengas en localStorage hacia la nube.
    // Devuelve la cantidad de registros subidos.
    migrateLocalToCloud: function () {
      if (!useCloud) return Promise.resolve(0);
      var edits = lsRead(K_EDITS, {}) || {};
      var pools = lsRead(K_POOLS, []) || [];
      var ops = [];
      Object.keys(edits).forEach(function (id) {
        ops.push(SB.from("result_edits").upsert({ match_id: id, doc: edits[id] }));
      });
      pools.forEach(function (p) {
        ops.push(SB.from("pools").upsert({ id: p.id, name: p.name, doc: p }));
      });
      if (!ops.length) return Promise.resolve(0);
      return Promise.all(ops).then(function () {
        // Reflejar en el caché sin esperar al realtime.
        Object.keys(edits).forEach(function (id) { _edits[id] = edits[id]; });
        pools.forEach(function (p) { _pools[p.id] = p; });
        return ops.length;
      });
    },

    hasLocalData: function () {
      var e = lsRead(K_EDITS, {}) || {};
      var p = lsRead(K_POOLS, []) || [];
      return Object.keys(e).length > 0 || p.length > 0;
    }
  };

  // Realtime: aplicar cambios remotos al caché y re-renderizar la vista actual.
  function subscribe() {
    if (!useCloud || _subbed) return;
    _subbed = true;
    SB.channel("wc2026")
      .on("postgres_changes", { event: "*", schema: "public", table: "result_edits" }, function (p) {
        if (p.eventType === "DELETE") { if (p.old) delete _edits[p.old.match_id]; }
        else if (p.new) { _edits[p.new.match_id] = p.new.doc; }
        onRemote();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pools" }, function (p) {
        if (p.eventType === "DELETE") { if (p.old) delete _pools[p.old.id]; }
        else if (p.new) { _pools[p.new.id] = p.new.doc; }
        onRemote();
      })
      .subscribe();
  }

  var _t = null;
  function onRemote() {
    // Debounce leve: varios cambios seguidos = un solo re-render.
    if (_t) clearTimeout(_t);
    _t = setTimeout(function () {
      if (window.WC) window.WC.invalidate();
      if (window.WCApp) window.WCApp.render();
    }, 120);
  }

  window.Store = Store;
})();
