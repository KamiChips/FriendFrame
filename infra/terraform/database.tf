resource "random_password" "db_admin" {
  length           = 32
  override_special = "_-"
  min_lower        = 2
  min_upper        = 2
  min_numeric      = 2
}

resource "random_password" "db_app" {
  length           = 32
  override_special = "_-"
  min_lower        = 2
  min_upper        = 2
  min_numeric      = 2
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "psql-${local.name}-${random_string.suffix.result}"
  resource_group_name    = data.azurerm_resource_group.main.name
  location               = data.azurerm_resource_group.main.location
  version                = "17"
  administrator_login    = "ffadmin"
  administrator_password = random_password.db_admin.result

  storage_mb = 32768

  sku_name                      = "B_Standard_B1ms"
  backup_retention_days         = 7
  geo_redundant_backup_enabled  = false
  auto_grow_enabled             = false
  public_network_access_enabled = true

  authentication {
    active_directory_auth_enabled = false
    password_auth_enabled         = true
  }

  tags = local.tags
  lifecycle {
    ignore_changes = [
      zone,
    ]
    prevent_destroy = true
  }
}

resource "azurerm_postgresql_flexible_server_database" "friendframe" {
  server_id = azurerm_postgresql_flexible_server.main.id
  name      = "friendframe"
  charset   = "UTF8"
  collation = "en_US.utf8"
  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
  server_id = azurerm_postgresql_flexible_server.main.id
  name      = "azure.extensions"
  value     = "PG_STAT_STATEMENTS,PGCRYPTO,UUID-OSSP"
}

resource "azurerm_postgresql_flexible_server_configuration" "require_ssl" {
  server_id = azurerm_postgresql_flexible_server.main.id
  name      = "require_secure_transport"
  value     = "ON"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "devs" {
  for_each         = var.allowed_ips
  name             = "dev-${each.key}"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = each.value
  end_ip_address   = each.value
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "api" {
  for_each         = toset(azurerm_linux_web_app.main.possible_outbound_ip_address_list)
  name             = "api-${replace(each.value, ".", "-")}"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = each.value
  end_ip_address   = each.value
}