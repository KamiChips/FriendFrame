variable "prefix" {
  type        = string
  default     = "friendframe"
  description = "Prefix for all resources"
}

variable "environment" {
  type        = string
  default     = "dev"
  description = "Environment for all resources"
}

variable "location" {
  type        = string
  default     = "centralus"
  description = "Location for all resources"

  validation {
    condition     = contains(["centralus", "mexicocentral", "canadacentral", "chilecentral", "westus3"], var.location)
    error_message = "Location must be one of: centralus, mexicocentral, canadacentral, chilecentral, westus2"
  }
}

variable "allowed_ips" {
  description = "Team' IPs allowed to connect to Postgres"
  type        = map(string)
  default     = {}
}

variable "node_version" {
  type        = string
  default     = "24-lts"
  description = "Node version for the web app"
}

variable "amount" {
  type        = number
  default     = 40
  description = "Mensual amount for student suscription"
}

variable "contact_emails" {
  type        = map(string)
  default     = {}
  description = "Contact email for azure budget notification"
}

variable "enable_compute" {
  type        = bool
  default     = false
  description = "Crea (true) o destruye (false) App Service y Postgres, los recursos que cobran por hora. Mantener en false hasta que el backend tenga codigo que desplegar"
}