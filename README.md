# FriendFrame

El proyecto FriendFrame tiene como objetivo principal el desarrollo de una plataforma móvil nativa diseñada bajo un enfoque multiplataforma (Android, iOS y web) utilizando React Native y Expo. Esta aplicación busca resolver la falta de autenticidad en las redes sociales tradicionales: publicaciones, fragmentos, comentarios, likes, chat, grupos y notificaciones entre amigos.

El proyecto se está extendiendo con un **panel de moderación** (frontend web + API propia) hospedado en **Azure**, para revisar reportes de contenido con evidencia protegida.

---

## Estado del proyecto

| Parte | Carpeta | Estado |
|---|---|---|
| App móvil | `frontend/` | ✅ En desarrollo activo (sobre Supabase) |
| Infraestructura en Azure | `infra/` | ✅ Lista: frontend, backend, base de datos, blob y Key Vault en Terraform |
| API del panel de moderación | `backend/` | 🚧 Por iniciar |
| Panel de moderación (web) | `admin-web/` | 🚧 En desarrollo: Vite + React + TS con datos simulados ([README](admin-web/README.md)) |

---

## Tecnologías

### Lenguajes

| Lenguaje | Dónde |
|---|---|
| **TypeScript** | App móvil (`frontend/`) |
| **SQL** | Esquema y migraciones de Supabase (`frontend/supabase/migrations`) |
| **HCL** (Terraform) | Infraestructura (`infra/terraform`) |
| **PowerShell** | Bootstrap de Azure (`infra/bootstrap`) |
| **YAML** | GitHub Actions (`.github/workflows`) |

### App móvil (`frontend/`)

| Área | Tecnología |
|---|---|
| Framework | **Expo 57** + **React Native 0.86** + **React 19** |
| Navegación | **Expo Router** (rutas basadas en archivos, carpeta `app/`) |
| Estilos | **NativeWind 4** (Tailwind CSS para React Native) |
| Backend as a Service | **Supabase** (`@supabase/supabase-js`): Auth, Postgres, Storage, Realtime |
| Login social | Google Sign-In (`@react-native-google-signin/google-signin`) |
| Monitoreo de errores | **Sentry** (`@sentry/react-native`) con un logger seguro (`lib/logger/safeLogger.ts`) |
| Multimedia | `expo-image`, `expo-image-picker`, `expo-image-manipulator`, `expo-media-library`, `expo-file-system` |
| Animaciones y gestos | `react-native-reanimated`, `react-native-gesture-handler` |
| Notificaciones | `expo-notifications` |
| Pruebas | **Jest** + `jest-expo` + Testing Library (unitarias, de componentes y de integración) |
| Calidad de código | ESLint (`eslint-config-expo`), Prettier, TypeScript |

### Infraestructura (`infra/`)

| Servicio de Azure | Uso |
|---|---|
| Static Web App | Hosting del panel de moderación |
| App Service (Linux, Node 24) | API del panel |
| PostgreSQL Flexible Server 17 | Base de datos del panel |
| Storage Account (Blob) | Multimedia y evidencia de moderación (inmutable) |
| Key Vault | Secretos de la API |
| Managed Identities + OIDC | GitHub Actions y la API entran a Azure **sin contraseñas** |

Todo se define con **Terraform** y se despliega desde **GitHub Actions**. Ver [infra/README.md](infra/README.md).

---

## Organización del repositorio

```
FriendFrame/
├── .github/workflows/
│   ├── ci.yml              # Lint, typecheck, pruebas y Prettier de la app móvil
│   └── infra.yml           # Terraform: plan en PRs, apply al hacer merge a main
├── frontend/               # App móvil (Expo / React Native)
│   ├── app/                # Pantallas y rutas (Expo Router)
│   │   ├── (auth)/         #   Login, registro, verificación
│   │   └── (tabs)/         #   Navegación principal
│   ├── components/         # Componentes reutilizables (ui/ = componentes base)
│   ├── context/            # Contextos de React: Auth, Chat, Notificaciones
│   ├── hooks/              # Hooks: feed, posts, comentarios, búsqueda, ajustes...
│   ├── services/supabase/  # Acceso a datos por dominio: auth, posts, feed, chat,
│   │                       #   social, interactions, notifications, profile, storage
│   ├── lib/                # Cliente de Supabase, Sentry y logger seguro
│   ├── navigation/         # Protección de rutas (RouteGuard)
│   ├── supabase/           # Configuración local y migraciones SQL
│   ├── __tests__/          # unit/, components/, integration/
│   ├── __mocks__/          # Mocks para Jest
│   ├── constants/  types/  assets/
│   ├── Dockerfile          # Imagen para pruebas y build web (nginx)
│   └── .env.example        # Variables que necesita la app (sin valores)
├── backend/                # API del panel de moderación (por iniciar)
├── admin-web/              # Panel de moderación web (Vite + React + TS)
├── infra/
│   ├── bootstrap/          # Script inicial de Azure (solo Owner)
│   ├── terraform/          # Recursos de Azure
│   └── README.md           # Guía de la infraestructura para el equipo
└── .gitleaksignore         # Falsos positivos revisados del escáner de secretos
```

---

## Levantar la app móvil

### Requisitos

- **Node.js 20+** (el CI usa Node 20)
- **npm**
- Para correr en dispositivo o emulador: Android Studio (Android), Xcode (iOS, solo macOS) o la app **Expo Go**
- Acceso al proyecto de Supabase del equipo

### Pasos

```bash
cd frontend
npm install
```

Crea `frontend/.env.local` a partir de `.env.example` y pide los valores al equipo:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `EXPO_PUBLIC_SUPABASE_KEY` | Llave **pública** (anon/publishable) de Supabase |
| `EXPO_PUBLIC_SENTRY_DNS` | DSN de Sentry |
| `EXPO_PUBLIC_SENTRY_DEBUG` | Activa el modo debug de Sentry |
| `EXPO_PUBLIC_APP_ENV` | Ambiente de la app |

> Todo lo que empieza con `EXPO_PUBLIC_` **se compila dentro de la app** y cualquiera puede leerlo. Nunca pongas ahí una llave secreta (por ejemplo, la *service role* de Supabase). Los datos los protegen las políticas **RLS** de Supabase.

Inicia la app:

```bash
npm start            # Expo: menú para Android, iOS, web o Expo Go
npm run android      # Build nativo en Android
npm run ios          # Build nativo en iOS
npm run web          # Versión web
```

### Pruebas

```bash
npm run test:unit          # Unitarias
npm run test:components    # Componentes
npm run test:integration   # Integración contra Supabase (requiere .env.test)
npm run test:ci            # Todo, con cobertura
```

Las pruebas de integración usan `frontend/.env.test` (no está en Git) con `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y usuarios de prueba. Pídelo al equipo. **La service role key se salta RLS: nunca la uses en la app ni la compartas.**

### Calidad de código

```bash
npm run lint             # ESLint
npx tsc --noEmit         # Tipos
npx prettier --check .   # Formato
```

### Docker (opcional)

```bash
docker build --target test -t friendframe-test .
docker build --target web -t friendframe-web --build-arg EXPO_PUBLIC_SUPABASE_URL=... --build-arg EXPO_PUBLIC_SUPABASE_KEY=... .
```

La primera imagen corre las pruebas; la segunda genera el build web y lo sirve con nginx.

---

## Infraestructura

La guía para el equipo (accesos, cómo planear y aplicar cambios, secretos, costos y problemas comunes) está en **[infra/README.md](infra/README.md)**.

---

## Flujo de trabajo

- **Nadie hace push directo a `main`.** Todo entra por Pull Request con **2 aprobaciones**.
- Cada PR corre el CI de la app (`ci.yml`) y el `plan` de Terraform (`infra.yml`), que es obligatorio.
- Antes de aprobar un PR que toca `infra/`, **lee el plan** en el log del job.

## Seguridad y secretos

- Ningún secreto va en el código ni en Git. Los archivos `.env*` (salvo los `.example`), `*.tfvars`, `*.tfstate` y `*.tfplan` están en `.gitignore`.
- Los secretos de la API viven en **Azure Key Vault**, y GitHub Actions entra a Azure con **OIDC** (sin contraseñas guardadas).
- El historial se revisa con [gitleaks](https://github.com/gitleaks/gitleaks):
  ```bash
  gitleaks git . -v
  ```
  Si encuentra un falso positivo, se documenta en `.gitleaksignore` con un comentario que explique por qué.
