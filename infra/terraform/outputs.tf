output "resource_group_name" {
  value       = data.azurerm_resource_group.main.name
  description = "The name of the resource group created by this Terraform configuration."
}

output "resource_group_id" {
  value       = data.azurerm_resource_group.main.id
  description = "The ID of the resource group created by this Terraform configuration."
}

output "db_host" {
  # Interruptor en un output: null = el output no aparece
  value       = var.enable_compute ? azurerm_postgresql_flexible_server.main[0].fqdn : null
  description = "The servers fqdn"
}

output "db_admin_password" {
  value       = random_password.db_admin.result
  description = "Administrator database pw"
  sensitive   = true
}

output "db_app_password" {
  value       = random_password.db_app.result
  description = "App user database pw"
  sensitive   = true
}

output "api_url" {
  value       = var.enable_compute ? "https://${azurerm_linux_web_app.main[0].default_hostname}" : null
  description = "API URL"
}

output "panel_url" {
  value       = "https://${azurerm_static_web_app.main.default_host_name}"
  description = "Frontend"
}