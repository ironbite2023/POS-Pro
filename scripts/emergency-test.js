#!/usr/bin/env node

/**
 * Emergency Authentication System Test
 * Tests critical fixes implemented in the emergency plan
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 Emergency Authentication System Test');
console.log('=====================================\n');

let testsPassed = 0;
let testsTotal = 0;

function runTest(name, testFn) {
  testsTotal++;
  console.log(`Testing: ${name}`);
  try {
    const result = testFn();
    if (result) {
      console.log('✅ PASSED\n');
      testsPassed++;
    } else {
      console.log('❌ FAILED\n');
    }
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}\n`);
  }
}

// Test 1: Verify middleware logic fix
runTest('Middleware logic fix', () => {
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  if (!fs.existsSync(middlewarePath)) {
    throw new Error('middleware.ts not found');
  }
  
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  
  // Check that the broken logic is fixed
  const brokenPattern = /!pathname\.startsWith\('\/'\)\s*===\s*false/;
  if (brokenPattern.test(middlewareContent)) {
    throw new Error('Broken middleware logic still present');
  }
  
  // Check that the correct logic is in place
  const correctPattern = /if\s*\(\s*!isProtectedRoute\(pathname\)\s*\)/;
  if (!correctPattern.test(middlewareContent)) {
    throw new Error('Correct middleware logic not found');
  }
  
  return true;
});

// Test 2: Verify database migration file exists
runTest('Database migration file exists', () => {
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250000000001_create_audit_infrastructure.sql');
  if (!fs.existsSync(migrationPath)) {
    throw new Error('Database migration file not found');
  }
  
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  
  // Check for audit_logs table creation
  if (!migrationContent.includes('CREATE TABLE IF NOT EXISTS public.audit_logs')) {
    throw new Error('audit_logs table creation not found in migration');
  }
  
  // Check for role_permissions table creation
  if (!migrationContent.includes('CREATE TABLE IF NOT EXISTS public.role_permissions')) {
    throw new Error('role_permissions table creation not found in migration');
  }
  
  return true;
});

// Test 3: Verify error boundary implementation
runTest('Error boundary component exists', () => {
  const errorBoundaryPath = path.join(process.cwd(), 'src/components/common/AuthErrorBoundary.tsx');
  if (!fs.existsSync(errorBoundaryPath)) {
    throw new Error('AuthErrorBoundary.tsx not found');
  }
  
  const errorBoundaryContent = fs.readFileSync(errorBoundaryPath, 'utf8');
  
  // Check for class component
  if (!errorBoundaryContent.includes('export class AuthErrorBoundary extends Component')) {
    throw new Error('AuthErrorBoundary class component not found');
  }
  
  // Check for error logging
  if (!errorBoundaryContent.includes('auditService.logSecurity')) {
    throw new Error('Security audit logging not found in error boundary');
  }
  
  return true;
});

// Test 4: Verify environment validation
runTest('Environment validation system exists', () => {
  const envValidationPath = path.join(process.cwd(), 'src/lib/config/env-validation.ts');
  if (!fs.existsSync(envValidationPath)) {
    throw new Error('env-validation.ts not found');
  }
  
  const envValidationContent = fs.readFileSync(envValidationPath, 'utf8');
  
  // Check for validation function
  if (!envValidationContent.includes('validateRequiredEnvVars')) {
    throw new Error('validateRequiredEnvVars function not found');
  }
  
  // Check for Supabase validation
  if (!envValidationContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    throw new Error('Supabase URL validation not found');
  }
  
  return true;
});

// Test 5: Verify ProtectedRoute error boundary integration
runTest('ProtectedRoute error boundary integration', () => {
  const protectedRoutePath = path.join(process.cwd(), 'src/components/common/ProtectedRoute.tsx');
  if (!fs.existsSync(protectedRoutePath)) {
    throw new Error('ProtectedRoute.tsx not found');
  }
  
  const protectedRouteContent = fs.readFileSync(protectedRoutePath, 'utf8');
  
  // Check for error boundary import
  if (!protectedRouteContent.includes('import AuthErrorBoundary')) {
    throw new Error('AuthErrorBoundary import not found in ProtectedRoute');
  }
  
  // Check for error boundary usage
  if (!protectedRouteContent.includes('<AuthErrorBoundary>')) {
    throw new Error('AuthErrorBoundary usage not found in ProtectedRoute');
  }
  
  return true;
});

// Test 6: Check Supabase client environment integration
runTest('Supabase client environment validation', () => {
  const supabaseClientPath = path.join(process.cwd(), 'src/lib/supabase/client.ts');
  if (!fs.existsSync(supabaseClientPath)) {
    throw new Error('Supabase client.ts not found');
  }
  
  const supabaseClientContent = fs.readFileSync(supabaseClientPath, 'utf8');
  
  // Check for environment validation import
  if (!supabaseClientContent.includes('getValidatedEnvConfig')) {
    throw new Error('Environment validation not integrated in Supabase client');
  }
  
  // Check for validation usage
  if (!supabaseClientContent.includes('envValidation.config.SUPABASE_URL')) {
    throw new Error('Environment validation not used for Supabase URL');
  }
  
  return true;
});

// Test Summary
console.log('=====================================');
console.log('Test Summary:');
console.log(`✅ Passed: ${testsPassed}/${testsTotal}`);
console.log(`❌ Failed: ${testsTotal - testsPassed}/${testsTotal}`);

if (testsPassed === testsTotal) {
  console.log('\n🎉 ALL EMERGENCY FIXES VALIDATED SUCCESSFULLY!');
  console.log('The authentication system should now be functional.');
  console.log('\nNext steps:');
  console.log('1. Run the database migration: npm run supabase:migration:up');
  console.log('2. Test the application: npm run dev');
  console.log('3. Verify login/logout functionality');
  process.exit(0);
} else {
  console.log('\n🚨 SOME FIXES FAILED VALIDATION!');
  console.log('Please review the failed tests and fix the issues before deploying.');
  process.exit(1);
}
