# Build Errors - Common Patterns and Solutions

This document contains common TypeScript and build error patterns encountered during development and their solutions.

## TypeScript Type Errors

### Function Parameter Typing
- Never use `unknown` as a direct parameter type when a specific type is available
- Use `Parameters<typeof functionName>[index]` utility type to infer parameter types from existing functions
- Import and use proper types from library definitions (e.g., `Session | null` from Supabase)
- Apply explicit typing to ALL function parameters (never use 'any')
- Always trace back to the source type definition when working with third-party libraries

### JSON and Dynamic Data Types
- Use `Json` type from database types instead of `unknown` for JSON columns
- Always import required types at the top of the file: `import type { Database, Json } from './database.types'`
- Ensure all JSONB database fields are typed as `Json` in TypeScript interfaces
- Never use `unknown` for fields that will be stored in database JSON columns

### Callback and Event Handler Typing
- Use `Parameters<typeof method>[0]` to properly type callback functions
- Avoid manually typing callbacks when the library provides proper type inference
- Let TypeScript infer complex callback signatures from the source

## Build-Time vs Runtime Issues

### Environment Variables
- Never throw errors during module initialization for missing environment variables
- Use conditional checks: `if (typeof window !== 'undefined')` for client-side only validation
- Provide fallback/placeholder values during static generation: `|| 'placeholder-value'`
- Only validate required environment variables at runtime on the client side
- Use optional chaining for environment variables during build time

### Static Page Generation Errors
- Ensure all pages marked as static don't access browser-only APIs during build
- Supabase client initialization must handle build-time scenarios gracefully
- Use `'use client'` directive appropriately for client-side only components
- Avoid accessing `window`, `localStorage`, or other browser APIs in module scope

## Dependency Management

### Missing Dependencies
- Always verify required packages are installed before building
- Check `package.json` for third-party library dependencies before importing
- Run `npm install <package>` immediately when import errors occur
- Common missing packages: `@supabase/supabase-js`, `@types/*` packages

### Type Definition Issues
- Ensure type definition packages are installed for third-party libraries
- Use `@types/*` packages for libraries that don't include their own types
- Verify TypeScript can resolve type declarations in `tsconfig.json`

## Code Quality Patterns

### Import Management
- Import only what you need from type definitions
- Clean up imports immediately when no longer needed
- Group imports by category: React, third-party, local
- Use type-only imports when possible: `import type { ... }`

### Variable Declaration
- Declare variables outside try blocks if used in catch blocks
- Use const by default, let only when reassignment is needed
- Prefix unused variables with underscore or remove them entirely
- Maintain consistent nullable/optional interface patterns

### Function Patterns
- Use `useCallback` for functions referenced in `useEffect` dependencies
- Define functions as const arrow functions for consistency
- Type return values explicitly for complex functions
- Avoid side effects in function parameter default values

## Database and API Integration

### Supabase Client
- Initialize Supabase client with fallback values for build time
- Use proper error handling without throwing during initialization
- Separate admin client initialization from regular client
- Ensure service role keys are properly typed and optional

### Type Safety with Database
- Generate and maintain database types from Supabase schema
- Use generated types for all database operations
- Cast database JSON fields properly to avoid type mismatches
- Keep database.types.ts in sync with actual schema

## Prevention Checklist

Before running `npm run build`, verify:
- [ ] All imports have corresponding installed packages
- [ ] No `unknown` or `any` types in function parameters
- [ ] Environment variable access is properly guarded
- [ ] No browser APIs accessed in module scope
- [ ] All database fields properly typed
- [ ] Callback functions use proper type inference
- [ ] No errors thrown during module initialization
- [ ] All dependencies listed in package.json

## Recent Build Issues and Resolutions

### October 2025 - Delivery Platform Integration Build

**Issue Summary**: Build failed after implementing delivery platform integration features with multiple TypeScript linting errors and Next.js runtime issues.

#### Error 1: Unused Import - Radix UI Badge Component
**File**: `src/app/(default)/delivery/platform-settings/page.tsx`  
**Error**: `'Badge' is defined but never used. unused-imports/no-unused-imports`  
**Root Cause**: Badge component was imported but not utilized in the component  
**Solution**: Removed unused Badge import from the Radix UI import statement

```typescript
// Before
import { Container, Flex, Heading, Text, Box, Button, Card, Grid, Badge, Dialog } from '@radix-ui/themes';

// After
import { Container, Flex, Heading, Text, Box, Button, Card, Grid, Dialog } from '@radix-ui/themes';
```

#### Error 2: Unnecessary React Hook Dependency
**File**: `src/app/(default)/delivery/analytics/page.tsx`  
**Error**: `React Hook useCallback has an unnecessary dependency: 'dateRange'. react-hooks/exhaustive-deps`  
**Root Cause**: The `dateRange` state variable was included in useCallback dependencies but wasn't used in the callback function  
**Solution**: Removed `dateRange` from the dependency array

```typescript
// Before
}, [currentOrganization?.id, activeBranchFilter?.id, dateRange]);

// After
}, [currentOrganization?.id, activeBranchFilter?.id]);
```

#### Error 3: Unused Type Definition
**File**: `src/app/(default)/delivery/menu-sync/page.tsx`  
**Error**: `'MenuItem' is defined but never used. unused-imports/no-unused-vars`  
**Root Cause**: Type alias was defined but the interface that used it was sufficient  
**Solution**: Removed unused type alias, kept only the interface definition

```typescript
// Before
type PlatformEnum = Database['public']['Enums']['platform_enum'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

// After
type PlatformEnum = Database['public']['Enums']['platform_enum'];
```

#### Error 4: Unused Error Variable in Catch Block
**File**: `src/app/(default)/purchasing/purchase-orders/page.tsx`  
**Error**: `'error' is defined but never used. unused-imports/no-unused-vars`  
**Root Cause**: Error was caught but not used since handling was done in the called hook  
**Solution**: Removed the error parameter from catch block

```typescript
// Before
} catch (error) {
  // Error handled in hook
}

// After
} catch {
  // Error handled in hook
}
```

#### Error 5: useSearchParams Without Suspense Boundary
**File**: `src/app/(pos)/checkout/page.tsx`  
**Error**: `useSearchParams() should be wrapped in a suspense boundary at page "/checkout"`  
**Root Cause**: Next.js requires useSearchParams to be wrapped in Suspense for static page generation  
**Solution**: Wrapped page content in Suspense boundary with loading fallback

```typescript
// Before
export default function CheckoutPage() {
  const searchParams = useSearchParams();
  // ... component logic
}

// After
function CheckoutContent() {
  const searchParams = useSearchParams();
  // ... component logic
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CheckoutContent />
    </Suspense>
  );
}
```

#### Error 6: TypeScript Compilation of Deno Edge Functions
**File**: `supabase/functions/uber-eats-webhook/index.ts`  
**Error**: `Cannot find module 'https://deno.land/std@0.168.0/http/server.ts'`  
**Root Cause**: Next.js build process attempted to compile Supabase Edge Functions which use Deno runtime, not Node.js  
**Solution**: Excluded Supabase functions directory from TypeScript compilation in tsconfig.json

```json
// tsconfig.json
{
  "exclude": [
    "node_modules",
    "supabase/functions"
  ]
}
```

#### Error 7: Build Cache Module Resolution Issue
**Error**: `Cannot find module './8548.js' - MODULE_NOT_FOUND`  
**Root Cause**: Stale Next.js build cache after multiple code changes  
**Solution**: Cleared .next directory and rebuilt from scratch

```powershell
Remove-Item -Recurse -Force .next
npx next build
```

### Key Takeaways from October 2025 Build

1. **Clean Imports**: Always remove unused imports immediately to avoid linting errors
2. **Hook Dependencies**: Review useCallback/useEffect dependencies to ensure they're necessary
3. **Suspense Boundaries**: Wrap useSearchParams, usePathname, and other Next.js hooks in Suspense for pages
4. **Build Exclusions**: Exclude non-Node.js code (Deno, Python, etc.) from TypeScript compilation
5. **Cache Management**: Clear build cache when encountering module resolution errors
6. **Error Handling**: Remove unused error variables or prefix with underscore if needed for future use

## Quick Fixes Reference

| Error Pattern | Quick Fix |
|---------------|-----------|
| `Type 'unknown' is not assignable to...` | Import and use specific type (e.g., `Json`, `Session`) |
| `supabaseKey is required` | Add fallback values and conditional validation |
| `Cannot find module '@package/name'` | Run `npm install @package/name` |
| `session: unknown in callback` | Use `Parameters<typeof method>[0]` |
| `Module initialization error` | Move validation to runtime with conditional checks |
| `Prerender error on static page` | Ensure no client-side APIs accessed during build |
| `unused-imports/no-unused-imports` | Remove unused imports from import statements |
| `react-hooks/exhaustive-deps` | Remove unnecessary dependencies from hook arrays |
| `useSearchParams() without Suspense` | Wrap component content in Suspense boundary |
| `Cannot find Deno module` | Exclude external runtime directories from tsconfig.json |
| `MODULE_NOT_FOUND after changes` | Clear .next cache: `Remove-Item -Recurse -Force .next` |

## Additional Notes

- Always test builds locally before pushing to production
- Use `npm run build` regularly during development to catch errors early
- Keep TypeScript strict mode enabled for better type safety
- Document any build workarounds for future reference
- Review type definitions when upgrading dependencies
