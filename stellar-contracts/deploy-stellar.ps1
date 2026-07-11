#!/usr/bin/env pwsh
# deploy-stellar.ps1
# Deploys all Soroban contracts to Stellar Testnet and outputs the contract IDs.
# Run from: d:\Workspace\Projects\spectrav2\stellar-contracts

$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"

$NETWORK = "testnet"
$SOURCE  = "default"   # stellar CLI identity alias; change if needed

function DeployContract {
    param([string]$WasmPath, [string]$Name)
    Write-Host "Deploying $Name..."
    $id = stellar contract deploy `
        --wasm $WasmPath `
        --network $NETWORK `
        --source $SOURCE `
        2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to deploy $Name"
        exit 1
    }
    # stellar contract deploy outputs the contract ID as the last line
    $contractId = ($id | Select-String -Pattern "^C[A-Z0-9]{55}$").Line
    if (-not $contractId) {
        # Fallback: take last non-empty line
        $contractId = ($id -split "`n" | Where-Object { $_.Trim() -ne "" } | Select-Object -Last 1).Trim()
    }
    Write-Host "  → $Name : $contractId"
    return $contractId
}

$TARGET = "target/wasm32-unknown-unknown/release"

$SAAS     = DeployContract "$TARGET/saas.wasm"     "SaaS"
$PROFILE  = DeployContract "$TARGET/profile.wasm"  "Profile"
$NFT      = DeployContract "$TARGET/nft.wasm"       "NFT"
$EXCHANGE = DeployContract "$TARGET/exchange.wasm"  "Exchange"
$FEEDBACK = DeployContract "$TARGET/feedback.wasm"  "Feedback"

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ==="
Write-Host "Add these to your .env file:"
Write-Host ""
Write-Host "VITE_SAAS_CONTRACT_ID=$SAAS"
Write-Host "VITE_PROFILE_CONTRACT_ID=$PROFILE"
Write-Host "VITE_NFT_CONTRACT_ID=$NFT"
Write-Host "VITE_EXCHANGE_CONTRACT_ID=$EXCHANGE"
Write-Host "VITE_STELLAR_FEEDBACK_CONTRACT=$FEEDBACK"
Write-Host "VITE_STELLAR_NETWORK=testnet"
Write-Host "VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org"
