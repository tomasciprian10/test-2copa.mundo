# Migrar a Supabase (base de datos + usuarios)

Guía paso a paso para pasar la app de `localStorage` a Supabase, con login por
**email + contraseña**, **pools compartidos** entre amigos y **resultados globales**
sincronizados en vivo.

Ya tenés un proyecto de Supabase creado. Falta: crear las tablas, pegar las
credenciales y (opcional) subir tus datos locales.

---

## 1. Crear las tablas y las políticas

Todo el esquema está en [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
Crea dos tablas (`result_edits` y `pools`), las políticas de seguridad (RLS) y activa
Realtime. Elegí **una** forma de aplicarlo:

**Opción A — SQL Editor (la más rápida, sin instalar nada):**

1. Dashboard de Supabase → tu proyecto → **SQL Editor** → **New query**.
2. Copiá y pegá el contenido de `supabase/migrations/0001_init.sql`.
3. **Run**. Debería terminar sin errores.

**Opción B — Supabase CLI:**

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

---

## 2. Configurar el login por email + contraseña

En el Dashboard:

1. **Authentication → Providers → Email**: dejá **Email** habilitado.
2. **Confirm email**:
   - Si lo dejás **activado**, cada usuario nuevo recibe un mail y tiene que confirmar
     antes de poder entrar (más seguro).
   - Si lo **desactivás**, se puede entrar apenas se registra (más cómodo para probar
     con amigos). Podés cambiarlo cuando quieras.
3. **Authentication → URL Configuration → Site URL**: poné la URL desde donde vas a
   servir la página (por ejemplo tu dominio de GitHub Pages, o `http://localhost:3000`
   si la servís local). Es la URL a la que apuntan los links de confirmación.

---

## 3. Pegar las credenciales en la app

En el Dashboard: **Project Settings → API**. Copiá:

- **Project URL**
- **anon / public** key  ← esta, **no** la `service_role`.

Pegalas en [`js/config.js`](js/config.js):

```js
window.SUPABASE_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "eyJhbGciOi...."   // la anon/public
};
```

> La `anon key` es **pública** y es seguro dejarla en el front: por sí sola no da acceso
> a nada, todo está protegido por las políticas RLS del paso 1. Nunca pongas acá la
> `service_role`.

Con esos dos campos completos, la app arranca en modo nube: pide login y guarda todo en
Supabase. Si los dejás vacíos, sigue funcionando 100% local como antes.

---

## 4. Servir la página

Con Supabase **no alcanza** con abrir el `index.html` por `file://` (el login necesita
`http`/`https`). Serví la carpeta, por ejemplo:

```bash
python3 -m http.server 3000
# y abrí http://localhost:3000
```

En producción funciona igual con GitHub Pages o cualquier hosting estático. Acordate de
que esa URL coincida con la **Site URL** del paso 2.

---

## 5. Subir tus datos actuales (opcional)

Si ya venías usando la app en local, la **primera vez** que inicies sesión te va a
preguntar si querés subir a tu cuenta los pools y resultados guardados en el navegador.
Aceptá y listo. (Se hace una sola vez por navegador.)

---

## Cómo quedó el modelo de datos

| Tabla | Qué guarda | Quién puede |
|---|---|---|
| `result_edits` | Resultados editados de partidos (marcador + goleadores), una fila por partido | Cualquier usuario logueado lee y edita (resultados globales) |
| `pools` | Cada pool completo como documento JSON (participantes, pronósticos, fases) | Cualquier logueado lee/edita; **borrar** solo quien lo creó |

- **Anónimos:** sin acceso. Hay que iniciar sesión.
- **Realtime:** cuando un amigo carga un resultado o un pronóstico, al resto se le
  actualiza la pantalla solo.

### Ajustes que quizás quieras hacer

- **Que cualquiera pueda borrar pools:** en `0001_init.sql`, política `pools_delete`,
  cambiá `using (owner = auth.uid())` por `using (true)` y re-ejecutá.
- **Cerrar el registro** (que no se sume cualquiera): desactivá "Enable sign ups" en
  Authentication, y creá las cuentas a mano desde el Dashboard.
