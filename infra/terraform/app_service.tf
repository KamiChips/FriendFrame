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

  app_settings = {
    DATABASE_URL           = "postgresql://app_user:${random_password.db_app.result}@${azurerm_postgresql_flexible_server.main[0].fqdn}:5432/${azurerm_postgresql_flexible_server_database.friendframe[0].name}?sslmode=require"
    BLOB_CONNECTION_STRING = azurerm_storage_account.main.primary_blob_connection_string
    JWT_SECRET             = random_password.jwt.result
    CORS_ORIGINS           = "https://${azurerm_static_web_app.main.default_host_name}"
  }

  tags = local.tags
}