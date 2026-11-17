terraform {
  backend "azurerm" {
    resource_group_name  = "rg-friendframe-tfstate"
    storage_account_name = "stfriendframetf"
    container_name       = "tfstate"
    key                  = "friendframe.terraform.tfstate"
    use_azuread_auth     = true
  }
}