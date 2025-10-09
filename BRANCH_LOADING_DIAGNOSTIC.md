# Branch Loading Diagnostic Guide

**Date:** October 6, 2025  
**Issue:** Dashboard shows "No branches available" but database has branches

---

## Current Situation

### ✅ What's Working
- Database has your branch ("Main Branch") 
- Organization exists ("Demo Restaurant")
- User profile is linked to organization
- RLS policies are configured correctly
- Dashboard UUID fix is implemented and working

### ❌ Current Problem
- Dashboard shows: "No branches available"
- Branches aren't loading into the `OrganizationContext`
- This is likely an authentication or data loading issue

---

## Database Verification (Confirmed)

```sql
-- Your Organization
name: "Demo Restaurant"
id: 3c984719-511b-4ccf-aa3a-9cbe4f8308ff

-- Your Branch  
name: "Main Branch"
code: "MAIN"
status: "active"
id: 0afe737a-b2e0-49b1-aac8-1db83174b26e
```

---

## Diagnostic Steps

### Step 1: Check Browser Console

Open the HQ Dashboard and check the browser console for these log messages:

**Expected Logs:**
```
OrganizationContext: Loading branches for org: 3c984719-...
OrganizationContext: Loaded branches: 1 [...]
OrganizationContext: Setting default branch: Main Branch
```

**If you see:**
```
OrganizationContext: Error loading branches: [error message]
```
→ This indicates an RLS or authentication issue

**If you see:**
```
OrganizationContext: Loaded branches: 0 []
```
→ This indicates RLS is blocking the query

**If you don't see any logs:**
→ OrganizationContext isn't initializing properly

### Step 2: Check Authentication

Open browser console and run:
```javascript
// Check if user is logged in
const { data: { session } } = await window.supabase.auth.getSession();
console.log('Session:', session);

// Check user profile
const { data: profile } = await window.supabase
  .from('user_profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();
console.log('Profile:', profile);

// Try to fetch branches manually
const { data: branches, error } = await window.supabase
  .from('branches')
  .select('*')
  .eq('organization_id', profile.organization_id);
console.log('Branches:', branches, 'Error:', error);
```

### Step 3: Check LocalStorage

Check if there's a stale branch ID:
```javascript
console.log('Saved Branch ID:', localStorage.getItem('currentBranchId'));
```

**If it's invalid:** Clear it
```javascript
localStorage.removeItem('currentBranchId');
// Then refresh the page
```

---

## Common Issues & Solutions

### Issue 1: Session Not Valid
**Symptoms:** No session in console, or session.user is null

**Solution:**
```bash
1. Log out completely
2. Clear browser cache and localStorage
3. Log in again
4. Navigate to HQ Dashboard
```

### Issue 2: RLS Policy Blocking
**Symptoms:** Console shows "Error loading branches" with RLS error

**Solution:**
The RLS policy requires:
- User must be authenticated
- User's organization_id must match branch's organization_id

Verify with SQL:
```sql
-- This should return 1 branch
SELECT * FROM branches 
WHERE organization_id = '3c984719-511b-4ccf-aa3a-9cbe4f8308ff';
```

### Issue 3: Stale localStorage
**Symptoms:** Logs show branches loading but not setting default

**Solution:**
```javascript
localStorage.clear();
window.location.reload();
```

### Issue 4: OrganizationContext Not Initializing
**Symptoms:** No console logs at all from OrganizationContext

**Solution:**
Check that:
- User is logged in (check `useAuth()`)
- `userProfile.organization_id` is set
- `AuthProvider` and `OrganizationProvider` are wrapping the app

---

## Quick Fix Actions

### Action 1: Clear Everything and Re-login
```bash
1. Open browser DevTools → Application → Storage
2. Clear all localStorage
3. Clear all session storage
4. Close all tabs for localhost:3000
5. Open new tab and login fresh
6. Navigate to HQ Dashboard
```

### Action 2: Verify Database Connection
Open Supabase dashboard and run:
```sql
-- Check if your user can see branches
SELECT 
  b.*,
  u.email,
  u.organization_id as user_org_id
FROM branches b
CROSS JOIN user_profiles u
WHERE u.email = 'ironbite2023@gmail.com'  -- Your email
  AND b.organization_id = u.organization_id;
```

Should return 1 row with "Main Branch"

### Action 3: Check Environment Variables
Verify `.env.local` has correct Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://axlhezpjvyecntzsqczk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

---

## What We've Added for Debugging

### Enhanced Logging
- `OrganizationContext` now logs all branch loading steps
- `useDashboardData` logs when no branches are available
- Console warnings help identify the exact failure point

### Better Error Handling
- Dashboard no longer shows red error for missing branches
- Shows friendly "No Branches Found" message instead
- Displays organization name in the message

### Branch Validation
- Validates branches array before querying database
- Prevents UUID errors from empty branch IDs
- Falls back to zero state gracefully

---

## Next Steps

1. **Open HQ Dashboard** and check console logs
2. **Run the diagnostic commands** in browser console
3. **Try Quick Fix Action 1** (clear and re-login)
4. **Report back** with console log output

---

## Console Output Template

Please share this information:

```
=== AUTHENTICATION ===
Session exists: [yes/no]
User ID: [user-id]
User email: [email]

=== USER PROFILE ===
Has organization_id: [yes/no]
Organization ID: [org-id]

=== ORGANIZATION CONTEXT ===
[Paste console logs from OrganizationContext]

=== BRANCHES ===
Branches loaded: [count]
Current branch: [branch-name or null]
Branches array: [paste array]

=== ERRORS ===
[Paste any errors from console]
```

---

## Files Modified for Debugging

1. **`src/hooks/useDashboardData.ts`**
   - Added console.warn for no branches
   - Changed error to null (no red error message)

2. **`src/contexts/OrganizationContext.tsx`**
   - Added detailed console logging
   - Logs branch loading, count, and default selection

3. **`src/app/(default)/dashboard/hq-dashboard/page.tsx`**
   - Added friendly "No Branches Found" message
   - Shows organization name
   - Removed scary red error for missing branches

---

## Expected Behavior After Fix

### When Logged In Successfully
1. Console shows: "Loading branches for org: xxx"
2. Console shows: "Loaded branches: 1"
3. Console shows: "Setting default branch: Main Branch"
4. Dashboard displays metrics (even if all zeros due to no orders)
5. Branch selector shows "Main Branch"

### When Not Logged In
1. Redirected to login page
2. No console errors

### When Branches Don't Load
1. Console shows warning: "No branches available"
2. Dashboard shows friendly message
3. No red error banner
4. Organization name displayed correctly

---

The debugging logs will help us identify exactly where the branch loading is failing!
