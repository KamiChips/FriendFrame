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