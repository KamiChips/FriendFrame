resource "random_password" "jwt" {
  length           = 64
  override_special = "_-"
}

resource "azurerm_service_plan" "main" {
  # Interruptor: solo existe si enable_compute = true (ver variables.tf)
  count = var.enable_compute ? 1 : 0

  name                = "asp-${local.name}"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  os_type             = "Linux"

  sku_name = "B1"
  tags     = local.tags
}

# Identidad de la API. La crea el bootstrap (con su rol Key Vault Secrets User);
# Terraform solo la busca para ponersela a la Web App.
data "azurerm_user_assigned_identity" "api" {
  name                = "id-friendframe-api"
  resource_group_name = data.azurerm_resource_group.main.name
}

resource "azurerm_linux_web_app" "main" {
  # Interruptor: solo existe si enable_compute = true (ver variables.tf)
  count = var.enable_compute ? 1 : 0

  name                                           = "app-${local.name}-${random_string.suffix.result}"
  location                                       = data.azurerm_resource_group.main.location
  resource_group_name                            = data.azurerm_resource_group.main.name
  service_plan_id                                = azurerm_service_plan.main[0].id
  https_only                                     = true
  ftp_publish_basic_authentication_enabled       = false
  webdeploy_publish_basic_authentication_enabled = false

  # El "gafete": con esta identidad la app lee Key Vault
  identity {
    type         = "UserAssigned"
    identity_ids = [data.azurerm_user_assigned_identity.api.id]
  }
  key_vault_reference_identity_id = data.azurerm_user_assigned_identity.api.id

  site_config {
    always_on                         = true
    minimum_tls_version               = "1.2"
    ftps_state                        = "Disabled"
    health_check_path                 = "/health"
    health_check_eviction_time_in_min = 2

    application_stack {
      node_version = var.node_version
    }
  }

  # Los secretos son referencias a Key Vault, no valores. versionless_id = siempre la ultima
  # version, asi que al rotar un secreto basta con reiniciar la app.
  app_settings = {
    DATABASE_URL           = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.database_url[0].versionless_id})"
    BLOB_CONNECTION_STRING = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.blob_connection_string.versionless_id})"
    JWT_SECRET             = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.jwt_secret.versionless_id})"
    # No es secreto: va directo
    CORS_ORIGINS = "https://${azurerm_static_web_app.main.default_host_name}"
  }

  tags = local.tags
}