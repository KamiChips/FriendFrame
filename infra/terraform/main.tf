locals {
  name = "${var.prefix}-${var.environment}"

  tags = {
    environment = var.environment
    prefix      = var.prefix
  }
}

data "azurerm_resource_group" "main" {
  name = "rg-${local.name}"
}

resource "random_string" "suffix" {
  length  = 5
  special = false
  upper   = false
}
