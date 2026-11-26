# admin-web · Consola de moderación de FriendFrame

Panel web del equipo de moderación. La interfaz está en inglés. Reemplaza a `admin-panel/` (Expo + React Native Web): mismas 9 pantallas y mismo diseño, pero con un stack hecho para la web. El build es un sitio estático que sirve Azure Static Web Apps.

Por ahora la app funciona con **datos simulados en memoria**: se puede recorrer completa sin backend. Para conectarla al backend solo hay que cambiar una pieza (ver [Conectar el backend](#conectar-el-backend)).

## Stack

| Pieza                 | Herramienta                                    | Para qué                                                                           |
| --------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| Base                  | React 19 + Vite + TypeScript                   | Arranque rápido y build estático                                                   |
| Rutas                 | React Router (modo datos)                      | Rutas, loaders que adelantan datos, 404 y errores por ruta                         |
| Datos del servidor    | TanStack Query                                 | Caché, reintentos e invalidación tras cada acción; la cola se actualiza cada 30 s  |
| Estilos y componentes | Tailwind v4 + shadcn/ui                        | Tabla, diálogos, menús, pestañas y switches accesibles, con el tema de FriendFrame |
| Formularios           | react-hook-form + zod                          | Validación declarativa; los esquemas en `src/schemas` no dependen de React         |
| Gráficas              | Recharts (vía `components/ui/chart` de shadcn) | Barras y dona del dashboard                                                        |
| Avisos                | sonner                                         | Avisos de resultado abajo a la derecha                                             |
| Pruebas               | Vitest + Testing Library, Playwright           | Unitarias e integración en jsdom; E2E en navegador real                            |

## Correr la app

Requisitos: Node 20.19 o superior.

```bash
cd admin-web
npm install
npm run dev
```

Abre `http://localhost:5173`.

| Comando             | Qué hace                                                        |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con recarga al instante                  |
| `npm run build`     | Revisa tipos y genera `dist/`, lo que se sube a Static Web Apps |
| `npm run preview`   | Sirve `dist/` para probar el build                              |
| `npm test`          | Pruebas unitarias y de integración (Vitest)                     |
| `npm run test:ci`   | Igual, con reporte de cobertura                                 |
| `npm run test:e2e`  | Pruebas E2E con Playwright (hace el build y lo sirve solo)      |
| `npm run lint`      | ESLint                                                          |
| `npm run typecheck` | TypeScript                                                      |
| `npm run format`    | Prettier (ordena también las clases de Tailwind)                |

Playwright necesita un navegador. La primera vez: `npx playwright install chromium`. Si no quieres descargarlo, usa el Edge que ya trae Windows: `$env:PW_CHANNEL="msedge"; npm run test:e2e`.

### Cuentas de prueba

El modo simulado acepta cualquier contraseña de 6 o más caracteres con un correo `@friendframe.test`:

| Correo                                                                | Entra como                                                |
| --------------------------------------------------------------------- | --------------------------------------------------------- |
| `admin@friendframe.test` (o cualquier otro `@friendframe.test`)       | `@admin`, rol Admin                                       |
| `moderator@friendframe.test` (cualquiera que empiece con `moderator`) | `@moderator1`, rol Moderator: sin Audit log ni Team (403) |

Un correo de otro dominio muestra "You don't have access to the panel". Al recargar, los datos simulados vuelven a su estado inicial y la sesión vuelve a ser `@admin`.

### Rutas

Los filtros viven en la URL, así que un enlace comparte exactamente la vista.

| Ruta                                   | Pantalla                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `/`                                    | Login                                                                                          |
| `/dashboard`                           | Dashboard                                                                                      |
| `/reports`                             | Cola (pendientes)                                                                              |
| `/reports?status=all&type=post&mine=1` | Cola filtrada: todos los estados, posts, míos                                                  |
| `/reports/r1` … `/reports/r9`          | Detalle (`r3` evidencia expirada, `r6` en revisión por otra persona, `r8` publicación borrada) |
| `/users?q=ana&status=banned`           | Búsqueda de usuarios                                                                           |
| `/users/u1?tab=hidden`                 | Perfil, en la pestaña de contenido oculto                                                      |
| `/audit?action=granted_role`           | Bitácora filtrada                                                                              |
| `/team`                                | Equipo                                                                                         |

Cualquier otra ruta, o un reporte o usuario que no existe, muestra el Error 404 dentro de la consola.

## Cómo está organizado

```
src/
  main.tsx, App.tsx      arranque: QueryClient, router y avisos
  router.tsx             tabla de rutas; cada pagina se descarga al visitarla y su loader adelanta los datos
  api/
    queries.ts           llaves y queryOptions de TanStack Query (staleTime, polling de 30 s)
    mutations.ts         acciones (tomar caso, resolver, restaurar...): invalidan la cache y avisan si fallan
  services/moderation/   fuente de datos
    types.ts             contrato ModerationService: lo que cualquier fuente debe ofrecer
    mock.ts              implementacion simulada en memoria
    index.ts             elige que implementacion usa la app
  schemas/               zod: formularios (forms.ts) y filtros de la URL (search.ts)
  pages/                 una pagina por ruta; leen datos con TanStack Query
  components/
    ui/                  componentes de shadcn/ui (copiados, se pueden editar)
    common/              piezas propias reutilizables: DataTable, ConfirmDialog, FilterSelect, campos...
    layout/              AppLayout (menu lateral) y Page (cabecera de cada pagina)
    dashboard/ reports/ users/   tarjetas de cada seccion
  constants/             etiquetas, opciones de filtros, rutas del menu
  fixtures/              datos de ejemplo del diseno
  lib/                   formato de fechas y textos derivados (funciones puras)
  styles.css             Tailwind + colores del diseno por tema (claro y oscuro)
e2e/                     pruebas de Playwright
public/staticwebapp.config.json   rutas y cabeceras para Azure Static Web Apps
```

La regla de siempre se mantiene: **las páginas no saben de dónde vienen los datos**. Solo `api/` habla con `services/moderation`, y solo `services/moderation/index.ts` decide qué implementación se usa.

### Por qué es eficiente

- **Código por ruta**: cada página es un archivo aparte que se descarga la primera vez que se visita. Recharts (la librería más pesada) solo baja al abrir el dashboard.
- **Datos en paralelo**: el loader de cada ruta pide los datos mientras se descarga el código de la página.
- **Caché**: los datos se consideran frescos 30 s; volver a una página ya vista es instantáneo. Tras una acción solo se vuelve a pedir lo que está en pantalla.
- **Sin parpadeo**: al cambiar un filtro se siguen viendo los resultados anteriores hasta que llegan los nuevos.
- **Static Web Apps**: `staticwebapp.config.json` manda todas las rutas a `index.html` (recargar `/reports/r1` funciona) y deja en caché un año los archivos de `assets/`, que llevan hash en el nombre.

## Conectar el backend

1. Crea `src/services/moderation/api.ts` que exporte un objeto que cumpla `ModerationService` llamando al backend (`fetch` a `import.meta.env.VITE_API_URL`). TypeScript marcará cualquier método que falte.
2. Ante un rechazo de login lanza `new AuthError("invalid_credentials")` o `new AuthError("not_authorized")`. Para un reporte o usuario que no existe, devuelve `null` (la ruta muestra 404).
3. En `src/services/moderation/index.ts` cambia `export const moderation = mock` por la implementación nueva.
4. Agrega `VITE_API_URL` al build. Las variables `VITE_*` quedan escritas en el JavaScript público: **nunca pongas secretos ahí**, solo URLs.
5. Protege las rutas: el loader de `AppLayout` (en `router.tsx`) ya pide la sesión; si el backend responde 401, lanza `redirect("/")` desde ahí.
6. Los permisos reales van en el backend: el 403 de Bitácora y Equipo es solo la interfaz.

Los esquemas de `src/schemas/forms.ts` no usan nada de React y se pueden mover a un paquete compartido para que el backend valide con las mismas reglas.
