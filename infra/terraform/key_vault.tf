data "azurerm_client_config" "main" {}

resource "azurerm_key_vault" "main" {
  name                       = "kv-${local.name}${random_string.suffix.result}"
  location                   = data.azurerm_resource_group.main.location
  resource_group_name        = data.azurerm_resource_group.main.name
  tags                       = local.tags
  tenant_id                  = data.azurerm_client_config.main.tenant_id
  rbac_authorization_enabled = true
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  sku_name                   = "standard"
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = random_password.jwt.result
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "db_admin_password" {
  name         = "db-admin-password"
  value        = random_password.db_admin.result
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "blob_connection_string" {
  name         = "blob-connection-string"
  value        = azurerm_storage_account.main.primary_blob_connection_string
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "database_url" {
  name         = "database-url"
  count        = var.enable_compute ? 1 : 0
  value        = "postgresql://app_user:${random_password.db_app.result}@${azurerm_postgresql_flexible_server.main[0].fqdn}:5432/${azurerm_postgresql_flexible_server_database.friendframe[0].name}?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id
}