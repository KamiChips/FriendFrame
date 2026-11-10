$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true
$Team = @{
    "kamila.santos@cetysuniversidad.edu.mx"
    "camacho.angel@cetysuniversidad.edu.mx"
    "christopher.sandez@cetysuniversidad.edu.mx"
    "mayrin.peredia@cetysuniversidad.edu.mx"
}

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