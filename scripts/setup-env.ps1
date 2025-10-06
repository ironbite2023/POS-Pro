# Setup Environment Variables Script
# Adds Supabase Service Role Key to .env.local

Write-Host "================================" -ForegroundColor Cyan
Write-Host "POS Pro - Environment Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"

# Check if .env.local exists
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local first." -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Get your Supabase Service Role Key" -ForegroundColor Yellow
Write-Host "Go to: https://supabase.com/dashboard/project/axlhezpjvyecntzsqczk/settings/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy the 'service_role' key (the long JWT token)" -ForegroundColor Yellow
Write-Host "WARNING: This key has admin privileges - keep it secret!" -ForegroundColor Red
Write-Host ""

# Read the service role key
$serviceRoleKey = Read-Host "Paste your service_role key here"

if ([string]::IsNullOrWhiteSpace($serviceRoleKey)) {
    Write-Host "ERROR: No key provided!" -ForegroundColor Red
    exit 1
}

# Validate key format (should start with "eyJ")
if (-not $serviceRoleKey.StartsWith("eyJ")) {
    Write-Host "WARNING: Key doesn't look like a JWT token (should start with 'eyJ')" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Step 2: Updating .env.local..." -ForegroundColor Yellow

# Read current content
$content = Get-Content $envFile -Raw

# Check if key already exists and is uncommented
if ($content -match "^SUPABASE_SERVICE_ROLE_KEY=(?!#)" -and $content -notmatch "^SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here") {
    Write-Host "Service role key already exists. Updating..." -ForegroundColor Yellow
    $content = $content -replace "SUPABASE_SERVICE_ROLE_KEY=.*", "SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey"
}
# Check if commented out
elseif ($content -match "#\s*SUPABASE_SERVICE_ROLE_KEY=") {
    Write-Host "Uncommenting and setting service role key..." -ForegroundColor Yellow
    $content = $content -replace "#\s*SUPABASE_SERVICE_ROLE_KEY=.*", "SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey"
}
# Add new key
else {
    Write-Host "Adding service role key..." -ForegroundColor Yellow
    # Find the position after the anon key
    if ($content -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=.*\r?\n") {
        $content = $content -replace "(NEXT_PUBLIC_SUPABASE_ANON_KEY=.*\r?\n)", "`$1`nSUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey`n"
    } else {
        # Append at the end
        $content += "`nSUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey`n"
    }
}

# Write back to file
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host "✓ Service role key added successfully!" -ForegroundColor Green
Write-Host ""

# Verify
Write-Host "Step 3: Verifying..." -ForegroundColor Yellow
$verification = Get-Content $envFile | Select-String -Pattern "^SUPABASE_SERVICE_ROLE_KEY="

if ($verification) {
    Write-Host "✓ Verification passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "IMPORTANT: Next Steps" -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "1. Restart your dev server:" -ForegroundColor White
    Write-Host "   - Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host "   - Run: npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Test signup at: http://localhost:3000/auth/signup" -ForegroundColor White
    Write-Host ""
    Write-Host "✓ Setup complete!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Verification failed!" -ForegroundColor Red
    Write-Host "Please add the key manually." -ForegroundColor Yellow
}

Write-Host ""
