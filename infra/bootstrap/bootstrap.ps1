$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true
$Team = @(
    "kamila.santos@cetysuniversidad.edu.mx"
    "camacho.angel@cetysuniversidad.edu.mx"
    "christopher.sandez@cetysuniversidad.edu.mx"
    "mayrin.peredia@cetysuniversidad.edu.mx"
)

az group create --name "rg-friendframe-tfstate" --location "centralus"
az group create --name "rg-friendframe-dev" --location "centralus"
az storage account create --name "stfriendframetf" --resource-group "rg-friendframe-tfstate" --location "centralus" --sku Standard_LRS --https-only true --min-tls-version TLS1_2 --allow-blob-public-access false --allow-shared-key-access false
az storage account blob-service-properties update --account-name "stfriendframetf" --resource-group "rg-friendframe-tfstate" --enable-versioning true --enable-delete-retention true --delete-retention-days 30
$stateAccount = az storage account show --name "stfriendframetf" --resource-group "rg-friendframe-tfstate" --query "id" -o tsv
$appRg = az group show --name "rg-friendframe-dev" --query "id" -o tsv  
foreach ($user in $Team) {
    az role assignment create --assignee $user --role "Storage Blob Data Contributor" --scope $stateAccount
    az role assignment create --assignee $user --role "Contributor" --scope $appRg
}
az storage container create --name "tfstate" --account-name "stfriendframetf" --public-access off --auth-mode login

az identity create --name "id-friendframe-github" --resource-group "rg-friendframe-tfstate" --location "centralus"
$principalId = az identity show --name "id-friendframe-github" --resource-group "rg-friendframe-tfstate" --query "principalId" -o tsv
$clientId = az identity show --name "id-friendframe-github" --resource-group "rg-friendframe-tfstate" --query "clientId" -o tsv
az role assignment create --assignee-object-id $principalId --assignee-principal-type ServicePrincipal --role "Storage Blob Data Contributor" --scope $stateAccount
az role assignment create --assignee-object-id $principalId --assignee-principal-type ServicePrincipal --role "Contributor" --scope $appRg
az identity federated-credential create --name "github-pull-request" --identity-name "id-friendframe-github" --resource-group "rg-friendframe-tfstate" --issuer "https://token.actions.githubusercontent.com" --subject "repo:KamiChips/FriendFrame:pull_request" --audiences "api://AzureADTokenExchange"
az identity federated-credential create --name "github-merge-main" --identity-name "id-friendframe-github" --resource-group "rg-friendframe-tfstate" --issuer "https://token.actions.githubusercontent.com" --subject "repo:KamiChips/FriendFrame:ref:refs/heads/main" --audiences "api://AzureADTokenExchange"
$tenantId       = az account show --query "tenantId" -o tsv
$subscriptionId = az account show --query "id" -o tsv
Write-Host "AZURE_CLIENT_ID       = $clientId"
Write-Host "AZURE_TENANT_ID       = $tenantId"
Write-Host "AZURE_SUBSCRIPTION_ID = $subscriptionId"

$kvId = az keyvault list --resource-group "rg-friendframe-dev" --query "[0].id" -o tsv
if (-not $kvId) { 
    throw "No existe el Key Vault en rg-friendframe-dev. Hagan merge del PR que lo crea y vuelvan a correr el script." 
    }

# Secrets Officer = leer y escribir secretos (data plane), solo sobre esta boveda
foreach ($user in $Team) {
    az role assignment create --assignee $user --role "Key Vault Secrets Officer" --scope $kvId
}
az role assignment create --assignee-object-id $principalId --assignee-principal-type ServicePrincipal --role "Key Vault Secrets Officer" --scope $kvId

az identity create --name "id-friendframe-api" --resource-group "rg-friendframe-dev"
$apiPrincipalId = az identity show --name "id-friendframe-api" --resource-group "rg-friendframe-dev" --query "principalId" -o tsv
az role assignment create --assignee-object-id $apiPrincipalId --assignee-principal-type ServicePrincipal --role "Key Vault Secrets User" --scope $kvId