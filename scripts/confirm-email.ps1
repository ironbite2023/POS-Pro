# Manually Confirm User Email
# For development purposes when email delivery is not configured

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Confirm User Email" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Get user email
$email = Read-Host "Enter the email address to confirm"

if ([string]::IsNullOrWhiteSpace($email)) {
    Write-Host "ERROR: No email provided!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Confirming email: $email" -ForegroundColor Yellow
Write-Host ""

# SQL query to confirm email
$query = @"
-- Manually confirm the user's email
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = '$email';

-- Verify confirmation
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = '$email';
"@

Write-Host "SQL Query:" -ForegroundColor Gray
Write-Host $query -ForegroundColor DarkGray
Write-Host ""

Write-Host "Run this query in Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host "https://supabase.com/dashboard/project/axlhezpjvyecntzsqczk/editor" -ForegroundColor Cyan
Write-Host ""

Write-Host "OR use Supabase CLI:" -ForegroundColor Yellow
Write-Host "supabase db execute --project-ref axlhezpjvyecntzsqczk" -ForegroundColor Gray
Write-Host ""

Write-Host "✓ Instructions generated!" -ForegroundColor Green
Write-Host ""
Write-Host "After confirming, the user can log in at:" -ForegroundColor White
Write-Host "http://localhost:3000/auth/login" -ForegroundColor Cyan
Write-Host ""
