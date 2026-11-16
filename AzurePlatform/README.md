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
| `/users` | Búsqueda de usuarios |
| `/users/u1` … `/users/u6` | Perfil de un usuario |
| `/audit` | Bitácora |
| `/team` | Equipo |

Cualquier otra ruta muestra "No encontramos lo que buscas." con un botón para volver al dashboard.

### Recorrido sugerido

1. **Login.** Escribe cualquier correo y contraseña y presiona **Iniciar sesión**. El modo simulado acepta cualquier credencial y te lleva al dashboard.
2. **Tema.** El selector **Claro / Oscuro** (arriba a la derecha) cambia el tema. La elección se guarda y se conserva al recargar.
3. **Menú lateral.** Lleva a Dashboard, Reportes, Usuarios, Bitácora y Equipo. **Cerrar sesión** regresa al login.
4. **Dashboard.**
   - **Ver cola de reportes** abre la cola.
   - Un caso de **Mis casos en revisión** abre su detalle.
   - **Ver mis casos** abre la cola filtrada a tus casos.
5. **Cola de reportes.**
   - Cada filtro (**Estado**, **Tipo**, **Motivo**) avanza a la siguiente opción con cada clic.
   - **Asignados a mí** muestra solo tus casos y **Limpiar filtros** vuelve al estado inicial.
   - El aviso naranja de reportes nuevos los marca como vistos.
   - Una fila abre el detalle del reporte.
6. **Detalle de un reporte pendiente** (por ejemplo `/reports/r1`).
   - **Contenido potencialmente sensible — clic para revelar** quita el velo de la evidencia. En los datos simulados no hay imagen, así que verás el espacio vacío.
   - **Ver perfil** abre el perfil del autor.
   - Los códigos de **Mismo contenido** abren esos reportes.
   - **Tomar caso** te asigna el reporte y muestra el panel de resolución.
7. **Detalle en revisión.** Elige una acción. Si es **Suspender autor**, elige también la duración. Escribe notas si quieres y aplica: el reporte queda resuelto y vuelves a la cola.
8. **Usuarios.**
   - Escribe un nombre o `@usuario` y presiona **Buscar**.
   - El filtro **Estado** avanza con cada clic.
   - **Ver perfil** abre la cuenta.
9. **Perfil de usuario.**
   - `/users/u1` tiene el perfil completo del diseño. **Restaurar cuenta** lo deja activo.
   - Las pestañas cambian entre **Línea de tiempo** y **Contenido oculto**.
10. **Bitácora.** Los filtros de moderador y acción avanzan con cada clic. Las acciones que hagas en la app (tomar casos, revelar evidencia, resolver, restaurar, quitar roles) aparecen aquí al momento.
11. **Equipo.** **Quitar rol** saca al miembro de la lista. No puedes quitarte tu propio rol.

> Los cambios del modo simulado viven en memoria: al recargar la página todo vuelve a los datos del diseño.

### Lo que todavía no hace nada

Estas acciones aparecen en el diseño pero no tienen una pantalla o un flujo definido:

- **Agregar miembro** en Equipo.
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
hooks/                useAsync (carga datos), useShell (menu lateral), useTheme, useCycle
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
| `signIn` / `signOut` | `supabase.auth.signInWithPassword` y `signOut`. Lanza un error si el usuario no es parte del equipo. |
| `getCurrentUser` | Lee la sesión y el rol del equipo. Devuelve `{ handle, initials, role, avatarUrl }`. |
| `getSectionCounts` | Cuenta los reportes no resueltos para el número del menú. |
| `getDashboard` | Calcula métricas, reportes por semana, porcentaje por motivo y los casos en revisión del moderador actual. `dateLabel` es la fecha de hoy ya formateada. |
| `getReports` | Aplica los filtros de `ReportQuery` en la consulta. `total` cuenta todos los que cumplen el filtro, no solo la página. |
| `getReport` | Devuelve `null` si no existe; la ruta muestra entonces la pantalla de "no encontrado". |
| `takeCase`, `revealEvidence`, `resolveReport`, `restoreAccount`, `removeRole` | Cambian el estado **y** registran la acción en la bitácora. Conviene hacerlo en una función RPC de Supabase para que ambas cosas ocurran juntas. |
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
- **Errores de login.** `app/index.tsx` no captura errores de `signIn`. El diseño no tiene estado de error, así que hay que agregar uno a `LoginScreen` (por ejemplo una prop `errorMessage`) y llenarlo desde la ruta.
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
