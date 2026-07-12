// Configuración de Supabase.
//
// Pegá acá los dos valores de tu proyecto (Dashboard → Project Settings → API):
//   - Project URL           -> url
//   - anon / public API key  -> anonKey
//
// La "anon key" es PÚBLICA y es seguro dejarla en el código del front: no da
// acceso a nada por sí sola, todo está protegido por las políticas RLS de la
// base (ver supabase/migrations/0001_init.sql). NO uses acá la "service_role".
//
// Mientras estos campos estén vacíos, la app sigue funcionando como antes
// (todo local en el navegador, sin login).
window.SUPABASE_CONFIG = {
  url: "",
  anonKey: ""
};
