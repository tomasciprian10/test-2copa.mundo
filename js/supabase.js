// Crea el cliente de Supabase a partir de js/config.js.
// Expone window.SB (el cliente) o null si todavía no está configurado.
(function () {
  var cfg = window.SUPABASE_CONFIG || {};
  var lib = window.supabase; // UMD de @supabase/supabase-js (cargado por CDN en index.html)

  if (cfg.url && cfg.anonKey && lib && lib.createClient) {
    window.SB = lib.createClient(cfg.url, cfg.anonKey);
  } else {
    window.SB = null;
    if (cfg.url || cfg.anonKey) {
      console.warn("Supabase: falta la librería o la config está incompleta; se usa modo local.");
    }
  }
})();
