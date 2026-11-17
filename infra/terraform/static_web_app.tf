resource "azurerm_static_web_app" "main" {
  name                         = "stapp-${local.name}-${random_string.suffix.result}"
  resource_group_name          = data.azurerm_resource_group.main.name
  location                     = data.azurerm_resource_group.main.location
  sku_tier                     = "Free"
  sku_size                     = "Free"
  preview_environments_enabled = false
  tags                         = local.tags
}


