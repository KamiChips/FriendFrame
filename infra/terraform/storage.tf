resource "azurerm_storage_account" "main" {
  name                     = "st${var.prefix}${var.environment}${random_string.suffix.result}"
  resource_group_name      = data.azurerm_resource_group.main.name
  location                 = data.azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  min_tls_version                 = "TLS1_2"
  https_traffic_only_enabled      = true
  allow_nested_items_to_be_public = true

  shared_access_key_enabled = true

  blob_properties {
    delete_retention_policy {
      days = 7
    }
  }

  tags = local.tags

  lifecycle {
    prevent_destroy = true
  }

}

resource "azurerm_storage_container" "moderation_evidence" {
  name                  = "moderation-evidence"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"
}

resource "azurerm_storage_container" "media" {
  name                  = "media"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "blob"
}

resource "azurerm_storage_container_immutability_policy" "moderation_evidence" {
  storage_container_resource_manager_id = azurerm_storage_container.moderation_evidence.id
  immutability_period_in_days           = 7
  protected_append_writes_all_enabled   = false
  protected_append_writes_enabled       = false
  locked                                = false
}