// localStorage persistence layer: result edits + betting pools.
(function () {
  var K_EDITS = "wc2026.resultEdits";
  var K_POOLS = "wc2026.pools";

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("localStorage write failed", e);
    }
  }

  var Store = {
    // ---- Result edits (overrides merged over base JSON, keyed by match id) ----
    getEdits: function () {
      return read(K_EDITS, {});
    },
    getEdit: function (id) {
      return this.getEdits()[id] || null;
    },
    setEdit: function (id, score, goals1, goals2) {
      var edits = this.getEdits();
      edits[id] = { score: score, goals1: goals1 || [], goals2: goals2 || [] };
      write(K_EDITS, edits);
    },
    clearEdit: function (id) {
      var edits = this.getEdits();
      delete edits[id];
      write(K_EDITS, edits);
    },

    // ---- Pools ----
    getPools: function () {
      return read(K_POOLS, []);
    },
    getPool: function (id) {
      return this.getPools().filter(function (p) { return p.id === id; })[0] || null;
    },
    savePool: function (pool) {
      var pools = this.getPools();
      var idx = -1;
      for (var i = 0; i < pools.length; i++) {
        if (pools[i].id === pool.id) { idx = i; break; }
      }
      if (idx >= 0) pools[idx] = pool; else pools.push(pool);
      write(K_POOLS, pools);
    },
    deletePool: function (id) {
      write(K_POOLS, this.getPools().filter(function (p) { return p.id !== id; }));
    },

    newId: function () {
      return "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }
  };

  window.Store = Store;
})();
