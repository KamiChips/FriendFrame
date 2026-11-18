# Infraestructura de FriendFrame (Azure + Terraform)

Esta carpeta define **toda la infraestructura de Azure** del proyecto como código. Nadie crea ni cambia recursos a mano en el portal: todo pasa por Terraform y por un Pull Request.

```
infra/
├── bootstrap/
│   └── bootstrap.ps1      # Lo corre UNA vez el Owner: state, permisos, identidades
└── terraform/             # Los recursos de la app (lo que maneja Terraform)
```

---

## 1. Qué hay en Azure

| Servicio | Recurso | Archivo | ¿Siempre encendido? |
|---|---|---|---|
| **Frontend** (panel de moderación) | Static Web App (Free) | `static_web_app.tf` | ✅ Sí (gratis) |
| **Backend** (API) | App Service Plan B1 + Linux Web App (Node) | `app_service.tf` | ⏸️ Solo con `enable_compute = true` |
| **Base de datos** | PostgreSQL Flexible Server 17 (B1ms) | `database.tf` | ⏸️ Solo con `enable_compute = true` |
| **Blob** | Storage Account + contenedores `media` y `moderation-evidence` | `storage.tf` | ✅ Sí |
| **Secretos** | Key Vault (RBAC) | `key_vault.tf` | ✅ Sí |
| **Costos** | Budget mensual con alertas por correo | `budget.tf` | ✅ Sí |

Todo vive en el resource group **`rg-friendframe-dev`** (región `centralus`).

### Cómo se conectan

```
Navegador del moderador ──► Static Web App (panel)
                                 │ llama a la API (CORS)
                                 ▼
                           Web App (API) ── identidad id-friendframe-api
                                 │                 │ rol: Key Vault Secrets User
                                 │                 ▼
                                 │           Key Vault ── database-url, jwt-secret,
                                 │                         blob-connection-string,
                                 │                         db-admin-password
                                 ├──► PostgreSQL (firewall: solo IPs de la API y del equipo)
                                 └──► Blob Storage (media pública por URL, evidencia privada)
```

- La API **nunca** tiene contraseñas en su configuración: sus `app_settings` son referencias `@Microsoft.KeyVault(SecretUri=...)`.
- Las contraseñas las genera Terraform (`random_password`); **nadie las escribe a mano**.
- `moderation-evidence` tiene una política de **inmutabilidad**: lo que se sube no se puede borrar ni modificar durante el periodo configurado.

---

## 2. Quién hace qué

| Pieza | Qué crea | Quién la corre | Cuándo |
|---|---|---|---|
| `bootstrap/bootstrap.ps1` | Resource groups, Storage del state, **todos los permisos (RBAC)**, identidad de GitHub Actions (OIDC), identidad de la API | **Solo el Owner de la suscripción** | Una vez, y cuando se agrega a alguien al equipo o un permiso nuevo |
| `terraform/` | Todos los recursos de la app | **GitHub Actions** (`.github/workflows/infra.yml`) | En cada PR (`plan`) y en cada merge a `main` (`apply`) |

> **Regla:** Terraform crea recursos; el bootstrap da permisos.
> El equipo y el CI son *Contributor*, y Contributor **no puede asignar roles**. Por eso todo lo de RBAC vive en el bootstrap.

---

## 3. Primeros pasos (para cada integrante del equipo)

### 3.1 Pide acceso

Pídele al Owner que agregue tu correo **`@cetysuniversidad.edu.mx`** a `$Team` en `bootstrap/bootstrap.ps1` y vuelva a correrlo. Eso te da:

| Rol | Sobre | Para qué |
|---|---|---|
| Contributor | `rg-friendframe-dev` | Ver y planear los recursos de la app |
| Storage Blob Data Contributor | `stfriendframetf` | Leer/escribir el state de Terraform |
| Key Vault Secrets Officer | El Key Vault | Leer/escribir secretos |

Los permisos tardan 1-2 minutos en aplicar.

### 3.2 Instala las herramientas

| Herramienta | Versión | Instalación (Windows) |
|---|---|---|
| Terraform | **1.16.6** (la misma del CI) | `winget install Hashicorp.Terraform` |
| Azure CLI | Reciente | `winget install Microsoft.AzureCLI` |
| PowerShell | 7+ (solo si vas a correr el bootstrap) | `winget install Microsoft.PowerShell` |

### 3.3 Inicia sesión en Azure

```powershell
az login
az account set --subscription "<ID de la suscripción>"
```

Terraform necesita saber la suscripción. Guárdala como variable de entorno **una vez** (luego cierra y abre la terminal):

```powershell
setx ARM_SUBSCRIPTION_ID (az account show --query id -o tsv)
```

> Ojo: en **PowerShell** es `setx` o `$env:ARM_SUBSCRIPTION_ID = "..."`; en **CMD** la sintaxis `$env:` no funciona.

### 3.4 Crea tu `devs.tfvars`

El archivo `terraform/devs.tfvars` **no está en Git** (`.gitignore` ignora `*.tfvars`). Créalo con este contenido, usando los correos reales del equipo:

```hcl
location = "centralus"

contact_emails = {
  nombre1 = "correo1@cetys.edu.mx"
  nombre2 = "correo2@cetys.edu.mx"
}
```

> Debe coincidir con la Variable `CONTACT_EMAILS` de GitHub. Si no, tu `plan` local va a mostrar cambios en el budget que el CI no ve.

### 3.5 Inicializa y comprueba

```powershell
cd infra/terraform
terraform init
terraform plan -var-file="devs.tfvars"
```

Si todo está bien, el plan dice **`No changes`**: tu código coincide con lo que existe en Azure.

---

## 4. Cómo hacer un cambio (flujo del equipo)

```
rama nueva → editar .tf → fmt → validate → plan local → PR → plan del CI → 2 aprobaciones → merge → apply del CI
```

1. Crea una rama desde `main`.
2. Edita los `.tf`.
3. Revisa localmente:
   ```powershell
   terraform fmt
   terraform validate
   terraform plan -var-file="devs.tfvars"
   ```
4. Abre un PR a `main`. El job **`plan`** corre solo y es **obligatorio**.
5. Quien revisa **abre el log del job `plan` y lo lee**. Aprobar sin leer el plan es lo mismo que un `apply` sin revisar.
6. Se necesitan **2 aprobaciones** (nadie puede hacer push directo a `main`, ni el Owner).
7. Al hacer merge, el job **`apply`** aplica los cambios.

### Reglas

- **No hagas `terraform apply` desde tu laptop.** Si de verdad es necesario (por ejemplo, el primer encendido), avisa al equipo antes.
- **Nunca** cambies recursos a mano en el portal: el siguiente `apply` lo revierte.
- Al revisar un plan, fíjate en los símbolos: `+` crea, `~` modifica, `-` **destruye**, `-/+` **destruye y recrea**. Si ves `-` o `-/+` en algo con datos (Postgres, Storage), detente y pregunta.
- Si el plan dice *"Objects have changed outside of Terraform"*, pregunta **quién y por qué** antes de aprobar.
- `validate` revisa la forma, no el significado. Un connection string en la variable equivocada pasa `validate` y `plan` sin errores: **lean el código**.

---

## 5. Archivos de `terraform/`

| Archivo | Contenido |
|---|---|
| `terraform.tf` | Versión de Terraform y providers (`azurerm ~> 5.12`, `random ~> 3.6`) |
| `backend.tf` | Dónde vive el state: `stfriendframetf/tfstate`, autenticación con Entra ID (sin llaves) |
| `main.tf` | `locals` (nombres y tags), resource group (data source) y el sufijo aleatorio |
| `variables.tf` | Todas las variables (ver tabla abajo) |
| `database.tf` | Postgres, base de datos, configuraciones, reglas de firewall, contraseñas |
| `storage.tf` | Storage Account, contenedores e inmutabilidad |
| `app_service.tf` | Service Plan, Web App, identidad y `app_settings` |
| `static_web_app.tf` | El hosting del panel |
| `key_vault.tf` | Key Vault y sus secretos |
| `budget.tf` | Presupuesto y alertas |
| `outputs.tf` | Valores útiles: URLs, host de la base de datos |
| `.terraform.lock.hcl` | Versiones exactas de los providers. **Sí se sube a Git** |

### Variables

| Variable | Default | Para qué |
|---|---|---|
| `prefix` | `friendframe` | Prefijo de los nombres |
| `environment` | `dev` | Ambiente |
| `location` | `centralus` | Región. Solo se permiten las de la política de la suscripción |
| `enable_compute` | `false` | **Interruptor** de App Service y Postgres (ver sección 6) |
| `allowed_ips` | `{}` | IPs del equipo que pueden entrar a Postgres (`nombre = "IP"`) |
| `node_version` | `24-lts` | Versión de Node de la API |
| `amount` | `40` | Presupuesto **mensual** en USD |
| `contact_emails` | `{}` | Correos que reciben las alertas del budget |

---

## 6. El interruptor `enable_compute`

App Service (~13 USD/mes) y Postgres (~17 USD/mes) **cobran por hora**, aunque nadie los use. El crédito de Azure for Students es de **100 USD al año**: con todo encendido alcanza para unos 3 meses.

Por eso están detrás de `enable_compute`:

| Valor | Resultado |
|---|---|
| `false` (default) | No existen. **Si existían, Terraform los destruye** |
| `true` | Se crean |

> ⚠️ "Apagar" en Terraform significa **destruir**, no pausar. Postgres tiene `prevent_destroy`: si ya tiene datos, poner `false` hace que el plan **falle** a propósito para no perderlos. Antes de que la base de datos guarde datos reales, hay que separar este interruptor en uno para la API y otro para la base de datos.

### El primer encendido (solo la primera vez)

La regla de firewall de la API usa las IPs de salida de la Web App, que no existen hasta que la Web App se crea. Por eso el primer encendido va en **dos pasos**, desde una laptop y avisando al equipo:

```powershell
terraform apply -var-file="devs.tfvars" -var="enable_compute=true" -target="azurerm_linux_web_app.main"
```

Después, cambien el default de `enable_compute` a `true` en un PR. Desde ahí, todo vuelve al flujo normal.

---

## 7. Secretos

Los secretos viven en el **Key Vault** (`kv-friendframe-dev...`). Para leer uno (necesitas el rol *Secrets Officer*):

```powershell
az keyvault secret show --vault-name "<nombre del key vault>" --name "db-admin-password" --query value -o tsv
```

| Secreto | Lo usa |
|---|---|
| `database-url` | La API (solo existe con `enable_compute = true`) |
| `jwt-secret` | La API |
| `blob-connection-string` | La API |
| `db-admin-password` | El equipo, para tareas de administración en Postgres |

- **Nunca** pegues un secreto en un chat, issue o PR.
- El state de Terraform **también** contiene los secretos en texto plano. Por eso el state solo es accesible con RBAC y sin llaves compartidas.
- Los archivos `*.tfplan` (`terraform plan -out`) también contienen secretos: están en `.gitignore`, no los compartas.

### Rotar un secreto

- **Generado por Terraform** (`jwt`, contraseñas): `terraform apply -var-file="devs.tfvars" -replace="random_password.jwt"`. El CI no acepta `-replace`, así que se corre desde una laptop **avisando al equipo**. Key Vault guarda una versión nueva; la app la toma al reiniciarse porque usa `versionless_id`.
- **Llave del Storage**: `az storage account keys renew --account-name <cuenta> --resource-group rg-friendframe-dev --key primary`. El siguiente `plan` detecta el cambio y actualiza el secreto. Avísenlo en la descripción del PR.

---

## 8. Conectarte a Postgres desde tu laptop

Postgres solo acepta conexiones de IPs permitidas. Para una sesión temporal:

```powershell
$ip = (Invoke-RestMethod https://api.ipify.org)
az postgres flexible-server firewall-rule create --resource-group rg-friendframe-dev --name <servidor> --rule-name "temp-$env:USERNAME" --start-ip-address $ip --end-ip-address $ip
```

**Bórrala al terminar** (`az postgres flexible-server firewall-rule delete ...`). La conexión siempre debe usar `sslmode=require`.

---

## 9. GitHub Actions (CI)

El workflow `.github/workflows/infra.yml` se autentica con **OIDC**: no hay ninguna contraseña guardada en GitHub.

| Job | Cuándo | Qué hace |
|---|---|---|
| `plan` | Cada PR a `main`, o a mano (*Run workflow*) | `init`, `fmt -check`, `validate`, `plan` |
| `apply` | Push a `main` que toque `infra/**` | `apply -auto-approve` |

**Variables del repo** (Settings → Secrets and variables → Actions → *Variables*, no *Secrets*):

| Variable | Contenido |
|---|---|
| `AZURE_CLIENT_ID` | `clientId` de la identidad `id-friendframe-github` |
| `AZURE_TENANT_ID` | Tenant de Azure |
| `AZURE_SUBSCRIPTION_ID` | Suscripción |
| `CONTACT_EMAILS` | El mapa de correos del budget, en una línea: `{nombre1="...", nombre2="..."}` |

Azure solo confía en tokens de la rama **`main`** y de **pull requests** de este repo. Correr el workflow desde cualquier otra rama falla con `AADSTS700213`, y eso es lo esperado.

---

## 10. El bootstrap (solo Owner)

```powershell
./infra/bootstrap/bootstrap.ps1
```

Desde la raíz del repo, en **PowerShell 7**. Es **idempotente**: volver a correrlo no duplica nada.

Hay que volver a correrlo cuando:
- Entra o sale alguien del equipo. Para **quitar** a alguien no basta con borrarlo de `$Team`: hay que borrar sus asignaciones con `az role assignment delete`.
- Se necesita un permiso nuevo.

La parte de Key Vault solo funciona **después** de que el CI creó el Key Vault; si no existe, el script se detiene con un mensaje.

---

## 11. Problemas comunes

| Error | Causa | Solución |
|---|---|---|
| `Error acquiring the state lock` | Alguien (o el CI) está corriendo Terraform | Espera. Si el lock se quedó atorado, revisa el `Who:` del mensaje y habla con esa persona antes de `terraform force-unlock` |
| `403` / `AuthorizationFailed` en el state o en Key Vault | Te falta un rol de **data plane** (Contributor no alcanza) | Pide al Owner que te agregue al bootstrap |
| `tenant ID was not specified` / `AzureCli Authorizer` en el CI | Una Variable de GitHub está vacía o mal nombrada | Revisa el bloque `env:` del paso en el log |
| `AADSTS700213` | El workflow corrió desde una rama en la que Azure no confía | Solo `main` y PRs están permitidos |
| `Invalid index` / `empty tuple` | Referencia `[0]` a un recurso apagado por `enable_compute` | Ponle el mismo interruptor al recurso que lo usa |
| `Invalid for_each argument ... known only after apply` | Primer encendido de la API | Ver sección 6 |
| `Instance cannot be destroyed` | `prevent_destroy` en Postgres | Es una protección: no apagues la base de datos con datos |

---

## Pendientes

- [ ] Separar `enable_compute` en `enable_api` y `enable_database`.
- [ ] Script SQL para crear `app_user` (permisos mínimos) al encender Postgres.
- [ ] Workflows de despliegue de la API y del panel.
