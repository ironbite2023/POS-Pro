# Coding Standards

**Last Updated**: October 6, 2025  
**Audience**: All Developers  
**Enforcement**: ESLint + Code Review

## Overview

This document defines the coding standards and conventions used in the EatlyPOS project. Following these guidelines ensures consistency, maintainability, and quality across the codebase.

## TypeScript Standards

### Type Annotations

**Always Define Types**:
```typescript
// ✅ Good: Explicit types
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
}

const getUser = (id: string): Promise<UserProfile> => {
  return fetch(`/api/users/${id}`).then(r => r.json());
};

// ❌ Avoid: Implicit any
const getUser = (id) => {  // id implicitly 'any'
  return fetch(`/api/users/${id}`).then(r => r.json());
};
```

### Interface vs Type

**Prefer Interfaces for Objects**:
```typescript
// ✅ Use interface for object shapes
interface MenuItem {
  id: string;
  name: string;
  price: number;
}

// ✅ Use type for unions, intersections, primitives
type Status = 'pending' | 'active' | 'inactive';
type ID = string | number;
type MenuItemWithStatus = MenuItem & { status: Status };
```

### Enums

**Use Union Types Instead of Enums**:
```typescript
// ✅ Preferred: Union types
type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed';

// ❌ Avoid: Enums (unless truly needed)
enum OrderStatus {
  New = 'new',
  Preparing = 'preparing',
  Ready = 'ready',
  Completed = 'completed'
}
```

**Reason**: Union types are simpler, more flexible, and tree-shakeable.

### Null vs Undefined

**Use Undefined for Optional Values**:
```typescript
// ✅ Good
interface Config {
  apiUrl: string;
  timeout?: number;  // undefined when not provided
}

// ❌ Avoid
interface Config {
  apiUrl: string;
  timeout: number | null;  // requires explicit null assignment
}
```

## React/Next.js Standards

### Component Structure

**Standard Component Template**:
```typescript
'use client';  // Only if client component

// 1. External imports
import { useState, useEffect } from 'react';
import { Box, Text } from '@radix-ui/themes';

// 2. Internal imports
import { MetricCard } from '@/components/common/MetricCard';
import { useAppOrganization } from '@/contexts/AppOrganizationContext';

// 3. Types
interface DashboardProps {
  title: string;
  data: DashboardData;
}

// 4. Component
export default function Dashboard({ title, data }: DashboardProps) {
  // 4.1 Hooks
  const [isLoading, setIsLoading] = useState(false);
  const { activeEntity } = useAppOrganization();
  
  // 4.2 Derived state
  const filteredData = data.filter(item => item.entityId === activeEntity.id);
  
  // 4.3 Event handlers
  const handleRefresh = () => {
    setIsLoading(true);
    // refresh logic
  };
  
  // 4.4 Effects
  useEffect(() => {
    // side effects
  }, [activeEntity]);
  
  // 4.5 Early returns
  if (isLoading) return <LoadingState />;
  if (!data) return <EmptyState />;
  
  // 4.6 Render
  return (
    <Box>
      <Text>{title}</Text>
      {/* Component JSX */}
    </Box>
  );
}

// 5. Helper components (if small and related)
function LoadingState() {
  return <div>Loading...</div>;
}
```

### Props Naming

**Event Handlers**:
```typescript
interface ComponentProps {
  // ✅ Good: on[Event] pattern
  onClick?: () => void;
  onChange?: (value: string) => void;
  onSubmit?: (data: FormData) => void;
  
  // ❌ Avoid
  click?: () => void;
  handleChange?: (value: string) => void;
  submitHandler?: (data: FormData) => void;
}
```

**Boolean Props**:
```typescript
interface ComponentProps {
  // ✅ Good: is/has/should prefix
  isLoading?: boolean;
  hasError?: boolean;
  shouldAutoFocus?: boolean;
  
  // ❌ Avoid
  loading?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}
```

### Hook Rules

**Custom Hook Naming**:
```typescript
// ✅ Always start with 'use'
const usePageTitle = (title: string) => { };
const useChartOptions = () => { };

// ❌ Never
const pageTitle = (title: string) => { };  // Not a hook
const getChartOptions = () => { };  // Not a hook
```

**Hook Dependencies**:
```typescript
// ✅ Good: Complete dependencies
useEffect(() => {
  fetchData(userId, filter);
}, [userId, filter]);

// ❌ Avoid: Missing dependencies (ESLint will warn)
useEffect(() => {
  fetchData(userId, filter);
}, [userId]);  // Missing 'filter'
```

## Naming Conventions

### Files and Directories

```
✅ Components:        PascalCase     MetricCard.tsx
✅ Hooks:             camelCase      usePageTitle.ts
✅ Utilities:         camelCase      formatCurrency.ts
✅ Types:             camelCase      inventory.ts
✅ Data:              PascalCase     MenuData.ts
✅ Directories:       kebab-case     admin-settings/
```

### Variables and Functions

```typescript
// ✅ Variables: camelCase
const userName = 'John';
const isActive = true;
const orderCount = 10;

// ✅ Functions: camelCase, verb-first
const getUserName = () => { };
const calculateTotal = () => { };
const validateInput = () => { };

// ✅ Constants: UPPER_SNAKE_CASE (only for true constants)
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// ✅ Private/Internal: prefix with underscore (optional)
const _internalHelper = () => { };
```

### Classes (if used)

```typescript
// ✅ Classes: PascalCase
class DataManager { }
class UserService { }

// ✅ Methods: camelCase
class UserService {
  getUser() { }
  updateProfile() { }
}
```

## Code Organization

### Import Order

```typescript
// 1. React and Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// 2. External libraries
import { Box, Card, Text } from '@radix-ui/themes';
import { format } from 'date-fns';
import clsx from 'clsx';

// 3. Internal utilities and hooks
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatCurrency } from '@/utilities';

// 4. Internal components
import { MetricCard } from '@/components/common/MetricCard';
import { TopBar } from '@/components/common/TopBar';

// 5. Contexts
import { useAppOrganization } from '@/contexts/AppOrganizationContext';

// 6. Data and types
import { menuItems } from '@/data/MenuData';
import type { MenuItem } from '@/types/menu';

// 7. Styles (if any)
import styles from './styles.module.css';
```

### File Structure

**Maximum File Length**: ~300 lines
- If longer, consider splitting into multiple files
- Extract helper components
- Move complex logic to utilities

**Component File Structure**:
```typescript
// types.ts
export interface DashboardProps { }

// utils.ts
export const calculateMetrics = () => { };

// DashboardView.tsx
export const DashboardView = () => { };

// DashboardContainer.tsx (main export)
export default function Dashboard() { }
```

## Comments and Documentation

### When to Comment

**DO Comment**:
- Complex algorithms
- Non-obvious business logic
- Workarounds for bugs/limitations
- Public API functions
- Important decisions

**DON'T Comment**:
- Obvious code
- What the code does (if clear from code)
- Commented-out code (delete it)

### Comment Style

**Single-line Comments**:
```typescript
// Calculate tax based on location
const tax = calculateTax(amount, location);

// TODO: Optimize this query
// FIXME: Handle edge case when user is null
// NOTE: This is a temporary workaround
```

**Multi-line Comments**:
```typescript
/**
 * Calculates the inventory reorder point based on daily usage,
 * lead time, and safety stock requirements.
 * 
 * @param dailyUsage - Average daily consumption
 * @param leadTime - Supplier delivery time in days
 * @param safetyStock - Buffer quantity
 * @returns Reorder point threshold
 */
const calculateReorderPoint = (
  dailyUsage: number,
  leadTime: number,
  safetyStock: number
): number => {
  return (dailyUsage * leadTime) + safetyStock;
};
```

### JSDoc for Functions

```typescript
/**
 * Formats a number as currency with proper locale and symbol.
 * 
 * @param amount - The numeric amount to format
 * @param currency - ISO currency code (default: 'USD')
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56) // Returns "$1,234.56"
 * formatCurrency(1234.56, 'EUR') // Returns "€1,234.56"
 */
export const formatCurrency = (
  amount: number, 
  currency: string = 'USD'
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};
```

## Best Practices

### Early Returns

```typescript
// ✅ Good: Early returns reduce nesting
function processOrder(order: Order) {
  if (!order) return null;
  if (order.status === 'cancelled') return null;
  if (!order.items.length) return null;
  
  // Main logic here
  return processItems(order.items);
}

// ❌ Avoid: Deep nesting
function processOrder(order: Order) {
  if (order) {
    if (order.status !== 'cancelled') {
      if (order.items.length > 0) {
        // Main logic nested deeply
        return processItems(order.items);
      }
    }
  }
  return null;
}
```

### DRY Principle

```typescript
// ✅ Good: Extract common logic
const getStatusColor = (status: string) => {
  const colorMap = {
    active: 'green',
    pending: 'yellow',
    inactive: 'gray'
  };
  return colorMap[status] || 'gray';
};

<Badge color={getStatusColor(status1)} />
<Badge color={getStatusColor(status2)} />

// ❌ Avoid: Repetition
<Badge color={status1 === 'active' ? 'green' : status1 === 'pending' ? 'yellow' : 'gray'} />
<Badge color={status2 === 'active' ? 'green' : status2 === 'pending' ? 'yellow' : 'gray'} />
```

### Consistent Error Handling

```typescript
// ✅ Good: Consistent pattern
const fetchData = async () => {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to fetch');
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error('Failed to load data');
    return null;
  }
};
```

### Avoid Magic Numbers

```typescript
// ✅ Good: Named constants
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const ITEMS_PER_PAGE = 20;

if (attempts < MAX_RETRY_ATTEMPTS) {
  retry();
}

// ❌ Avoid: Magic numbers
if (attempts < 3) {  // What is 3?
  retry();
}
```

## Styling Standards

### TailwindCSS Usage

```typescript
// ✅ Good: Organized classes
<div className="
  flex items-center gap-4
  p-4 rounded-lg
  bg-white dark:bg-neutral-900
  border border-gray-200 dark:border-neutral-800
">
  Content
</div>

// ✅ Conditional classes
<div className={clsx(
  'p-4 rounded-lg',
  isActive && 'bg-blue-100',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
  Content
</div>
```

### CSS Custom Properties

```typescript
// ✅ Use Radix UI theme tokens
<div style={{ backgroundColor: 'var(--color-panel-solid)' }}>
  Content
</div>

// ✅ For dynamic values
<div style={{ width: `${percentage}%` }}>
  Progress
</div>
```

## Testing Standards (Future)

### Test File Naming

```
Component:  MetricCard.tsx
Test File:  MetricCard.test.tsx
Location:   Same directory as component
```

### Test Structure

```typescript
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(<MetricCard title="Sales" value="$5,000" />);
    expect(screen.getByText('Sales')).toBeInTheDocument();
  });
  
  it('shows trend when provided', () => {
    render(
      <MetricCard 
        title="Sales" 
        value="$5,000"
        trend="up"
        trendValue="12%"
      />
    );
    expect(screen.getByText('12%')).toBeInTheDocument();
  });
});
```

## Git Standards

### Commit Messages

**Format**: `type(scope): subject`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

**Examples**:
```bash
feat(inventory): add CSV export functionality
fix(dashboard): resolve chart loading race condition
docs(api): update authentication endpoints
refactor(components): simplify MetricCard logic
```

### Branch Names

```bash
feature/add-inventory-export
fix/dashboard-chart-loading
docs/update-api-docs
refactor/simplify-metric-card
```

## ESLint Configuration

The project uses ESLint to enforce standards:

```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'error',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
];
```

**Running ESLint**:
```bash
npm run lint           # Check for issues
npm run lint:fix       # Fix auto-fixable issues
```

## Code Review Checklist

Before submitting a PR, verify:

- ☐ Code follows naming conventions
- ☐ TypeScript types are properly defined
- ☐ No ESLint errors
- ☐ Comments explain complex logic
- ☐ No console.logs (except intentional)
- ☐ No commented-out code
- ☐ Responsive design (mobile, tablet, desktop)
- ☐ Dark mode support
- ☐ Accessibility considerations
- ☐ Performance optimizations applied
- ☐ Tests added (when testing is set up)

## Related Documentation

- [Development Setup](development-setup.md)
- [Component Guidelines](component-guidelines.md)
- [Testing Guidelines](testing-guidelines.md)

---

**Questions about standards?** Open a discussion on GitHub or ask in code review.
