# AzurePlatform · Consola de moderación de FriendFrame

Panel web para el equipo de moderación de FriendFrame. Está hecho con el mismo stack que `frontend`: Expo, Expo Router, React Native Web, NativeWind y Jest. Incluye las 9 pantallas del diseño en Figma, en modo claro y oscuro.

Por ahora la app funciona con **datos simulados en memoria**. Puedes recorrerla completa sin backend; cuando quieras conectarla a datos reales, solo cambia una pieza (ver [Conectar datos reales](#conectar-datos-reales)).

## Requisitos

- Node 20 o superior
- npm

## Correr la app

```bash
cd AzurePlatform
npm install
npm run web
```

Expo muestra la dirección en la terminal (normalmente `http://localhost:8081`). Ábrela en el navegador.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | Corre todas las pruebas (componentes, servicio simulado y navegación). |
| `npx tsc --noEmit` | Revisa los tipos. |
| `npm run lint` | Revisa el estilo del código. |

## Cómo navegar la app para probarla

### Rutas

Puedes entrar a cualquier pantalla escribiendo su ruta en la barra del navegador.

| Ruta | Pantalla |
|---|---|
| `/` | Login |
| `/dashboard` | Dashboard |
| `/reports` | Cola de reportes |
| `/reports?mine=1` | Cola filtrada a los casos asignados a ti |
| `/reports/r1` … `/reports/r9` | Detalle de un reporte de la cola |
| `/reports/r3` | Evidencia con enlace expirado |
| `/reports/r6` | Caso en revisión por otra persona (@moderador2) |
| `/reports/r8` | Publicación borrada por el autor |
| `/users` | Búsqueda de usuarios |
| `/users/u1` … `/users/u6` | Perfil de un usuario |
| `/audit` | Bitácora |
| `/team` | Equipo |

Cualquier otra ruta, o un reporte o usuario que no existe, muestra el **Error 404** con un botón para volver al dashboard.

### Cuentas de prueba

El modo simulado acepta cualquier contraseña de 6 o más caracteres con un correo `@friendframe.test`:

| Correo | Entra como |
|---|---|
| `admin@friendframe.test` (o cualquier otro `@friendframe.test`) | `@admin`, con rol Admin |
| `moderador@friendframe.test` (cualquiera que empiece con `moderador`) | `@moderador1`, con rol Moderador: no ve Bitácora ni Equipo, y si abre esas rutas ve el **Error 403** |

Para ver los errores del login:

- Contraseña de menos de 6 caracteres o campos vacíos: "Correo o contraseña incorrectos".
- Correo de otro dominio, como `ana@gmail.com`: "No tienes acceso al panel".

Al abrir una ruta directo en la barra del navegador la página se recarga y la sesión vuelve a ser `@admin`. Para probar como moderador, entra por el login y navega con el menú.

### Recorrido sugerido

1. **Login.** Usa una de las cuentas de prueba y presiona **Iniciar sesión**. Te lleva al dashboard.
2. **Tema.** El selector **Claro / Oscuro** (arriba a la derecha) cambia el tema. La elección se guarda y se conserva al recargar.
3. **Menú lateral.** Lleva a Dashboard, Reportes, Usuarios, Bitácora y Equipo. **Cerrar sesión** regresa al login.
4. **Dashboard.**
   - **Ver cola de reportes** abre la cola.
   - Un caso de **Mis casos en revisión** abre su detalle.
   - **Ver mis casos** abre la cola filtrada a tus casos.
5. **Cola de reportes.**
   - Cada filtro (**Estado**, **Tipo**, **Motivo**) avanza a la siguiente opción con cada clic.
   - **Asignados a mí** muestra solo tus casos y **Limpiar filtros** vuelve al estado inicial.
   - El aviso naranja de reportes nuevos los incorpora a la cola y los deja resaltados.
   - Si ningún reporte cumple los filtros (por ejemplo **Asignados a mí** sin casos tomados) aparece "No hay reportes pendientes 🎉".
   - Mientras carga se ven filas de carga; si falla, "No pudimos cargar los reportes" con **Reintentar**.
   - Una fila abre el detalle del reporte.
6. **Detalle de un reporte pendiente** (por ejemplo `/reports/r1`).
   - **Contenido potencialmente sensible — clic para revelar** quita el velo de la evidencia. En los datos simulados no hay imagen, así que verás el espacio vacío.
   - **Ver perfil** abre el perfil del autor.
   - Los códigos de **Mismo contenido** abren esos reportes.
   - **Tomar caso** te asigna el reporte y muestra el panel de resolución.
   - En `/reports/r3` la evidencia expiró y se ofrece **Recargar**; en `/reports/r8` el autor borró la publicación; en `/reports/r6` el caso lo revisa otra persona y no se puede tomar.
7. **Detalle en revisión.** Elige una acción y aplícala.
   - **Suspender autor** pide la duración y luego una confirmación con la fecha de fin.
   - **Banear autor** exige notas internas; la confirmación pide escribir el `@usuario` del autor.
   - Al aplicar vuelves a la cola con un aviso del resultado ("Cola actualizada · 3 reportes resueltos") y un mensaje abajo a la derecha. El autor queda suspendido o baneado y los otros reportes pendientes del mismo contenido se cierran.
   - Si una acción falla aparece "No se pudo aplicar la acción" y no se guarda nada.
8. **Usuarios.**
   - Escribe un nombre o `@usuario` y presiona **Buscar**.
   - El filtro **Estado** avanza con cada clic.
   - **Ver perfil** abre la cuenta.
9. **Perfil de usuario.**
   - `/users/u1` tiene el perfil completo del diseño. **Restaurar cuenta** pide un motivo en las notas; al confirmar la cuenta queda activa, el botón cambia a **Cuenta activa** y la línea de tiempo suma "Cuenta restaurada".
   - **Contenido oculto** lista lo que moderación ocultó; **Restaurar** lo saca de la lista.
10. **Bitácora.** Los filtros de moderador y acción avanzan con cada clic. Las acciones que hagas en la app (tomar casos, revelar evidencia, resolver, restaurar, quitar roles) aparecen aquí al momento.
11. **Equipo.**
    - **Agregar miembro** busca una cuenta (por ejemplo `@sofia`), deja elegir el rol y la suma a la tabla.
    - **Quitar rol** pide confirmación antes de sacar al miembro. No puedes quitarte tu propio rol.

> Los cambios del modo simulado viven en memoria: al recargar la página todo vuelve a los datos del diseño.

### Lo que todavía no hace nada

Estas acciones aparecen en el diseño pero no tienen una pantalla o un flujo definido:

- **Consultar guía de moderación** en el Dashboard.
- **Cargar más** en las tablas: el servicio simulado devuelve todo de una vez, así que el botón no aparece.
- El filtro de rango de fechas de la Bitácora.
- **¿Olvidaste tu contraseña?** en el login.

## Cómo está organizado

```
app/                  rutas (expo-router): piden datos al servicio y conectan la navegacion
screens/              pantallas completas; solo reciben datos y callbacks por props
components/           piezas de cada pantalla (ui/, layout/, dashboard/, reports/, users/, audit/, team/)
services/moderation/  fuente de datos de la consola
  types.ts            contrato ModerationService: lo que cualquier fuente de datos debe ofrecer
  mock.ts             implementacion simulada en memoria
  index.ts            elige que implementacion usa la app
hooks/                useAsync (carga datos), useShell (menu lateral), useTheme, useCycle, useToast (avisos)
fixtures/             datos de ejemplo del diseno (los usan el servicio simulado y las pruebas)
types/moderation.ts   tipos de dominio: reportes, usuarios, sanciones, bitacora, equipo
constants/            colores, rutas del menu, opciones de filtros, etiquetas
```

La regla importante: **las pantallas y componentes no saben de dónde vienen los datos**. Solo las rutas de `app/` hablan con `services/moderation`, y solo `services/moderation/index.ts` decide qué implementación se usa.

## Conectar datos reales

El objetivo es reemplazar el servicio simulado por uno que lea de Supabase, sin tocar pantallas ni componentes.

### 1. Crear las tablas de moderación

El esquema actual de `frontend/supabase` no tiene tablas de moderación. Necesitas al menos:

- **Reportes**: quién reporta, qué contenido (post, fragment, comentario, mensaje o perfil y su id), motivo, declaración, estado (`pending`, `in_review`, `resolved`), moderador asignado, si la evidencia es sensible y fechas.
- **Acciones de moderación** (la bitácora): moderador, acción (ver `AuditAction` en `types/moderation.ts`), objetivo, reporte relacionado, notas y fecha. Las sanciones del historial de un usuario salen de aquí.
- **Equipo**: usuario, rol (`admin` o `moderator`), quién otorgó el rol y fecha de alta.
- **Estado de la cuenta**: estado (`active`, `suspended`, `banned`) y fecha de fin de la suspensión, como columnas en `users` o en una tabla aparte.

Agrégalas como migración en `frontend/supabase/migrations`, con políticas RLS que solo dejen leer y escribir a miembros del equipo. Las acciones de equipo deben quedar limitadas a admins.

### 2. Agregar el cliente de Supabase

```bash
npx expo install @supabase/supabase-js
```

Crea `lib/supabase.ts` igual que `frontend/lib/supabase/client.ts`, y un archivo `.env` (no se sube al repo) con:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_KEY=...
```

### 3. Implementar el servicio real

Crea `services/moderation/supabase.ts` y exporta un objeto que cumpla `ModerationService` (de `services/moderation/types.ts`). TypeScript te marcará cualquier método que falte o que devuelva otra forma.

Pautas por método:

| Método | Qué debe hacer |
|---|---|
| `signIn` / `signOut` | `supabase.auth.signInWithPassword` y `signOut`. Ante un rechazo lanza `new AuthError("invalid_credentials")`, y si la cuenta no es parte del equipo `new AuthError("not_authorized")`; el login muestra el mensaje de cada caso. |
| `getCurrentUser` | Lee la sesión y el rol del equipo. Devuelve `{ handle, initials, role, avatarUrl }` con `role` igual a `"admin"` o `"moderator"`; con eso se ocultan Bitácora y Equipo a los moderadores. |
| `getSectionCounts` | Cuenta los reportes no resueltos para el número del menú. |
| `getDashboard` | Calcula métricas, reportes por semana, porcentaje por motivo y los casos en revisión del moderador actual. `dateLabel` es la fecha de hoy ya formateada. |
| `getReports` | Aplica los filtros de `ReportQuery` en la consulta. `total` cuenta todos los que cumplen el filtro, no solo la página. |
| `getReport` | Devuelve `null` si no existe; la ruta muestra entonces el Error 404. `content.evidenceStatus` vale `"expired"` si el enlace firmado de la evidencia caducó y `"deleted"` si el autor borró la publicación. |
| `takeCase`, `revealEvidence`, `resolveReport`, `restoreAccount`, `restoreContent`, `addMember`, `removeRole` | Cambian el estado **y** registran la acción en la bitácora. Conviene hacerlo en una función RPC de Supabase para que ambas cosas ocurran juntas. |
| `resolveReport` | Además cierra los otros reportes pendientes del mismo contenido, sanciona al autor si la acción es suspender o banear, y devuelve `{ closedCount }` con el total de reportes cerrados. |
| `findUserIdByHandle` | Busca el id de un usuario por su `@handle`. |
| `getUsers`, `getUser`, `getAuditLog`, `getTeam` | Consultas de lectura con la forma de los tipos de `types/moderation.ts`. |

Los textos que la UI muestra tal cual (fechas como `"8 nov 2026 · 10:45"`, `"Hace 3 min"`) se calculan en el servicio. Para fechas cortas puedes usar `formatDate` de `lib/format.ts`.

### 4. Cambiar la fuente de datos

En `services/moderation/index.ts` cambia una línea:

```ts
// antes
export const moderation: ModerationService = mockModeration;

// despues
import { supabaseModeration } from "./supabase";
export const moderation: ModerationService = supabaseModeration;
```

No hay que tocar nada más: rutas, pantallas y componentes siguen igual.

### 5. Ajustes en las rutas que dependen del backend real

- **Proteger rutas.** Hoy cualquiera puede abrir `/dashboard` sin iniciar sesión. Agrega en `app/_layout.tsx` una redirección a `/` cuando no haya sesión, como hace `frontend/navigation/RouteGuard.tsx`.
- **Permisos en el servidor.** Bitácora y Equipo ya muestran el Error 403 a moderadores, pero esa es solo la interfaz: las políticas RLS deben impedir también que un moderador lea la bitácora o cambie roles.
- **Fecha de suspensión.** `ReportDetailScreen` calcula "Suspendido hasta" con la fecha del dispositivo. Si prefieres la del servidor, pásala en la prop `referenceDate` desde `app/reports/[id].tsx`.
- **Paginación.** Si `getReports` o `getUsers` devuelven páginas, agrega un parámetro de página a `ReportQuery` o `UserQuery` y conecta `onLoadMore` en `app/reports/index.tsx` y `app/users/index.tsx`.
- **Filtros.** Los filtros avanzan opción por opción (`hooks/use-cycle.ts`). Para un menú desplegable real, cambia `SelectField` y deja las opciones en `constants/filters.ts`.

### 6. Pruebas

- Las pruebas de componentes (`__tests__/components`) no dependen de los datos y siguen igual.
- `__tests__/navigation/app-navigation-test.tsx` recorre la app con el servicio simulado. Para que no llame a Supabase, agrega al inicio del archivo:

  ```ts
  jest.mock("@/services/moderation", () => ({
    moderation: require("@/services/moderation/mock").mockModeration,
  }));
  ```

- Para el servicio real, agrega pruebas de integración como las de `frontend/__tests__/integration`.

El modo simulado puede seguir existiendo para demos: basta con volver a apuntar `index.ts` a `mockModeration`.
