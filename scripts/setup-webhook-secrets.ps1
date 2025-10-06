# Setup Webhook Secrets Script for Delivery Platform Integration
# Configures webhook secrets in Supabase Edge Functions environment

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "POS Pro - Webhook Secrets Configuration" -ForegroundColor Cyan  
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help you configure webhook secrets for:" -ForegroundColor White
Write-Host "• Uber Eats (Client Secret for webhook verification)" -ForegroundColor Yellow
Write-Host "• Deliveroo (Webhook Secret for signature verification)" -ForegroundColor Yellow
Write-Host "• Just Eat (Webhook Secret for signature verification)" -ForegroundColor Yellow
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking Supabase CLI installation..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version 2>&1
    Write-Host "✓ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Please install Supabase CLI first:" -ForegroundColor Yellow
    Write-Host "npm install -g supabase" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# Project ID
$projectId = "axlhezpjvyecntzsqczk"
Write-Host "Target Supabase Project: $projectId" -ForegroundColor Cyan
Write-Host ""

# Get webhook secrets from user
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "STEP 1: Gather Webhook Secrets" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "For Uber Eats:" -ForegroundColor Yellow
Write-Host "• Use the same Client Secret from your OAuth app" -ForegroundColor Gray
Write-Host "• Found in: Uber Developer Portal → Your App → Client Credentials" -ForegroundColor Gray
Write-Host ""
$uberSecret = Read-Host "Enter Uber Eats Client Secret (OAuth)" -AsSecureString

Write-Host ""
Write-Host "For Deliveroo:" -ForegroundColor Yellow  
Write-Host "• Separate webhook secret (different from OAuth)" -ForegroundColor Gray
Write-Host "• Found in: Deliveroo Partner Portal → Webhook Settings" -ForegroundColor Gray
Write-Host ""
$deliverooSecret = Read-Host "Enter Deliveroo Webhook Secret" -AsSecureString

Write-Host ""
Write-Host "For Just Eat:" -ForegroundColor Yellow
Write-Host "• Webhook secret for signature verification" -ForegroundColor Gray  
Write-Host "• Found in: Just Eat Partner Centre → Webhook Configuration" -ForegroundColor Gray
Write-Host ""
$justEatSecret = Read-Host "Enter Just Eat Webhook Secret" -AsSecureString

# Convert SecureString to plain text for CLI
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "STEP 2: Configure Supabase Environment Variables" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Convert secure strings
    $uberPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($uberSecret))
    $deliverooPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($deliverooSecret))
    $justEatPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($justEatSecret))

    # Set secrets via Supabase CLI
    Write-Host "Setting Uber Eats Client Secret..." -ForegroundColor Yellow
    supabase secrets set --project $projectId UBER_EATS_CLIENT_SECRET=$uberPlain
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Uber Eats secret configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set Uber Eats secret" -ForegroundColor Red
    }

    Write-Host "Setting Deliveroo Webhook Secret..." -ForegroundColor Yellow  
    supabase secrets set --project $projectId DELIVEROO_WEBHOOK_SECRET=$deliverooPlain
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Deliveroo secret configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set Deliveroo secret" -ForegroundColor Red
    }

    Write-Host "Setting Just Eat Webhook Secret..." -ForegroundColor Yellow
    supabase secrets set --project $projectId JUST_EAT_WEBHOOK_SECRET=$justEatPlain  
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Just Eat secret configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to set Just Eat secret" -ForegroundColor Red
    }

    # Clear variables from memory
    $uberPlain = $null
    $deliverooPlain = $null
    $justEatPlain = $null

} catch {
    Write-Host "❌ Error configuring secrets: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "STEP 3: Webhook URL Registration" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📌 IMPORTANT: You must manually register these webhook URLs" -ForegroundColor Yellow
Write-Host "   in each platform's developer portal:" -ForegroundColor Yellow
Write-Host ""

Write-Host "🟢 Uber Eats Developer Portal:" -ForegroundColor White
Write-Host "   URL: https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/uber-eats-webhook" -ForegroundColor Cyan
Write-Host "   Events: order.created, order.updated, order.cancelled" -ForegroundColor Gray
Write-Host ""

Write-Host "🟠 Deliveroo Partner Portal:" -ForegroundColor White  
Write-Host "   URL: https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/deliveroo-webhook" -ForegroundColor Cyan
Write-Host "   Events: order.*, rider.*" -ForegroundColor Gray
Write-Host ""

Write-Host "🔵 Just Eat Partner Centre:" -ForegroundColor White
Write-Host "   URL: https://axlhezpjvyecntzsqczk.supabase.co/functions/v1/just-eat-webhook" -ForegroundColor Cyan
Write-Host "   Events: OrderPlaced, OrderAccepted, OrderCancelled" -ForegroundColor Gray
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ WEBHOOK SECRETS CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Register webhook URLs in platform portals (see above)" -ForegroundColor White
Write-Host "2. Test webhook connectivity via POS Pro platform settings" -ForegroundColor White  
Write-Host "3. Configure platform credentials for each restaurant" -ForegroundColor White
Write-Host "4. Test end-to-end order flow" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Ready to receive delivery platform orders!" -ForegroundColor Green
