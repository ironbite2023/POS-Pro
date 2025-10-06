# Component Architecture

**Last Updated**: October 6, 2025  
**Audience**: Frontend Developers  
**Document Version**: 1.0

## Overview

This document details the component architecture patterns, guidelines, and best practices used in EatlyPOS. Understanding these patterns is essential for maintaining consistency and quality across the application.

## Component Organization

### Directory Structure

```
src/components/
├── common/                    # Shared components across features
│   ├── MetricCard.tsx
│   ├── TopBar.tsx
│   ├── Sidebar.tsx
│   ├── PageHeading.tsx
│   ├── CardHeading.tsx
│   ├── OrderTimer.tsx
│   └── ChartLoadingPlaceholder.tsx
├── admin-settings/            # Admin feature components
│   ├── OrganizationForm.tsx
│   ├── UserManagement.tsx
│   └── [...]
├── inventory/                 # Inventory feature components
│   ├── StockTable.tsx
│   ├── StockAdjustmentDialog.tsx
│   └── [...]
├── menu-management/           # Menu feature components
├── loyalty-program/           # Loyalty feature components
├── purchasing/                # Purchasing feature components
├── sales/                     # Sales feature components
└── waste-management/          # Waste feature components
```

### Naming Conventions

**Component Files**:
- PascalCase for component files: `MetricCard.tsx`
- Match component name with filename
- One component per file (except closely related helper components)

**Component Names**:
```typescript
// ✅ Good
export default function MetricCard({ ... }) { }
export const MetricCard = ({ ... }) => { };

// ❌ Avoid
export default function metric_card({ ... }) { }
export default function metricCard({ ... }) { }
```

## Component Patterns

### 1. Functional Components with TypeScript

**Standard Pattern**:
```typescript
import { Box, Text } from '@radix-ui/themes';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  variant?: 'default' | 'flat';
}

export default function MetricCard({ 
  title, 
  value, 
  description,
  variant = 'default'
}: MetricCardProps) {
  return (
    <Box className={variant === 'flat' ? 'bg-gray-100' : 'bg-white'}>
      <Text>{title}</Text>
      <Text>{value}</Text>
      <Text>{description}</Text>
    </Box>
  );
}
```

**Key Principles**:
- ✅ Always define TypeScript interfaces for props
- ✅ Use default parameters for optional props
- ✅ Export default for page-level components
- ✅ Export named for utility components

### 2. Client vs Server Components

**Client Component** (Interactive, needs hooks):
```typescript
'use client';  // Directive at top of file

import { useState } from 'react';
import { Button } from '@radix-ui/themes';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <Button onClick={() => setCount(count + 1)}>
      Count: {count}
    </Button>
  );
}
```

**Server Component** (Default, no interactivity):
```typescript
// No 'use client' directive

export default function StaticContent() {
  return <div>This is server-rendered content</div>;
}
```

**When to Use 'use client'**:
- ✅ Uses React hooks (useState, useEffect, etc.)
- ✅ Uses browser APIs (window, document)
- ✅ Event handlers (onClick, onChange, etc.)
- ✅ Uses Context (useContext)
- ❌ Pure presentational components (can be server)

### 3. Composition Pattern

**Building Complex UIs from Simple Components**:

```typescript
// Simple components
<Card>
  <CardHeading title="Dashboard" />
  <Grid columns="3" gap="4">
    <MetricCard title="Sales" value="$5,000" />
    <MetricCard title="Orders" value="125" />
    <MetricCard title="Customers" value="89" />
  </Grid>
</Card>
```

**Benefits**:
- Reusability
- Testability
- Maintainability
- Flexibility

### 4. Container/Presenter Pattern

**Container (Logic)**:
```typescript
// DashboardContainer.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAppOrganization } from '@/contexts/AppOrganizationContext';
import { DashboardView } from './DashboardView';

export default function DashboardContainer() {
  const [data, setData] = useState(null);
  const { activeEntity } = useAppOrganization();
  
  useEffect(() => {
    // Fetch data logic
    fetchData(activeEntity.id).then(setData);
  }, [activeEntity]);
  
  const handleRefresh = () => {
    fetchData(activeEntity.id).then(setData);
  };
  
  return (
    <DashboardView 
      data={data} 
      onRefresh={handleRefresh}
    />
  );
}
```

**Presenter (UI)**:
```typescript
// DashboardView.tsx
import { Card, Grid } from '@radix-ui/themes';
import { MetricCard } from '@/components/common/MetricCard';

interface DashboardViewProps {
  data: DashboardData | null;
  onRefresh: () => void;
}

export function DashboardView({ data, onRefresh }: DashboardViewProps) {
  if (!data) return <LoadingState />;
  
  return (
    <Grid columns="3" gap="4">
      <MetricCard 
        title="Sales"
        value={data.sales}
      />
      {/* More cards */}
    </Grid>
  );
}
```

**Benefits**:
- Separation of concerns
- Easy to test presentation
- Logic reusability
- Clear responsibilities

### 5. Custom Hooks Pattern

**Extracting Reusable Logic**:

```typescript
// hooks/usePageTitle.ts
'use client';

import { useEffect } from 'react';
import { setPageTitle } from '@/utilities/pageTitle';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    setPageTitle(title);
  }, [title]);
};

// Usage in component
import { usePageTitle } from '@/hooks/usePageTitle';

export default function InventoryPage() {
  usePageTitle('Inventory Overview');
  
  return <div>{/* Page content */}</div>;
}
```

**Common Custom Hooks**:
- `usePageTitle()` - Page title management
- `useAppOrganization()` - Organization context
- `useFilterBranch()` - Branch filtering
- `useChartOptions()` - Chart configuration

### 6. Render Props Pattern (Limited Use)

**Example**:
```typescript
interface DataFetcherProps<T> {
  url: string;
  render: (data: T | null, loading: boolean) => React.ReactNode;
}

function DataFetcher<T>({ url, render }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(url)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [url]);
  
  return <>{render(data, loading)}</>;
}

// Usage
<DataFetcher<Inventory>
  url="/api/inventory"
  render={(data, loading) => (
    loading ? <Spinner /> : <InventoryTable data={data} />
  )}
/>
```

## Component Best Practices

### Props Interface Design

**Good Props Design**:
```typescript
interface MetricCardProps {
  // Required props first
  title: string;
  value: string | number;
  description: string;
  
  // Optional props with sensible defaults
  variant?: 'default' | 'flat';
  trend?: 'up' | 'down';
  trendValue?: string;
  icon?: React.ReactNode;
  
  // Event handlers with clear names
  onClick?: () => void;
  onHover?: () => void;
  
  // Style customization last
  className?: string;
}
```

**Avoid**:
```typescript
// ❌ Too many props (>8 indicates need for refactoring)
interface ComponentProps {
  prop1, prop2, prop3, prop4, prop5, prop6, prop7, 
  prop8, prop9, prop10, prop11, prop12, ...
}

// ❌ Unclear prop names
interface ComponentProps {
  d: string;  // What is 'd'?
  val: number;  // What kind of value?
}

// ❌ Props that should be objects
interface ComponentProps {
  userName: string;
  userEmail: string;
  userPhone: string;
  userAddress: string;
  // Better: user: UserProfile
}
```

### State Management in Components

**Local State** (useState):
```typescript
// Use for UI-only state
const [isOpen, setIsOpen] = useState(false);
const [inputValue, setInputValue] = useState('');
```

**Context State** (useContext):
```typescript
// Use for app-wide state
const { activeEntity, setActiveEntity } = useAppOrganization();
```

**Derived State** (useMemo):
```typescript
// Use for computed values
const filteredItems = useMemo(() => {
  return items.filter(item => item.status === 'active');
}, [items]);
```

**Side Effects** (useEffect):
```typescript
// Use for side effects
useEffect(() => {
  // Fetch data, subscribe to events, etc.
  const timer = setInterval(() => {
    checkForUpdates();
  }, 5000);
  
  return () => clearInterval(timer);
}, [dependency]);
```

### Event Handlers

**Naming Convention**:
```typescript
// ✅ Good: Prefix with 'handle'
const handleClick = () => { };
const handleSubmit = () => { };
const handleChange = (e: ChangeEvent) => { };

// ❌ Avoid
const click = () => { };
const onClickButton = () => { };
```

**Pattern**:
```typescript
interface ComponentProps {
  // Pass handler as prop
  onSubmit?: (data: FormData) => void;
  onChange?: (value: string) => void;
}

export default function Component({ onSubmit, onChange }: ComponentProps) {
  // Internal handler
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data = getFormData(e);
    onSubmit?.(data);  // Call parent handler
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Conditional Rendering

**Simple Conditions**:
```typescript
// Short-circuit evaluation
{isLoading && <Spinner />}

// Ternary for either/or
{isLoading ? <Spinner /> : <Content />}
```

**Complex Conditions**:
```typescript
// Early returns
if (!data) return <EmptyState />;
if (error) return <ErrorState error={error} />;
return <SuccessState data={data} />;
```

**Multiple Conditions**:
```typescript
// Extract to function
const renderStatus = (status: Status) => {
  switch (status) {
    case 'loading': return <Spinner />;
    case 'error': return <ErrorMessage />;
    case 'success': return <SuccessMessage />;
    default: return null;
  }
};

return <div>{renderStatus(currentStatus)}</div>;
```

### Lists and Keys

**Proper Key Usage**:
```typescript
// ✅ Good: Use unique, stable identifiers
{items.map(item => (
  <ItemCard key={item.id} item={item} />
))}

// ❌ Avoid: Using array index
{items.map((item, index) => (
  <ItemCard key={index} item={item} />  // Can cause bugs
))}

// ❌ Avoid: Non-unique keys
{items.map(item => (
  <ItemCard key={item.name} item={item} />  // Names may duplicate
))}
```

## Styling Patterns

### TailwindCSS Usage

**Component Styles**:
```typescript
// ✅ Use Tailwind utility classes
<div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-lg">
  <Text className="text-gray-500 dark:text-neutral-400">Content</Text>
</div>

// ✅ Conditional classes with clsx
import clsx from 'clsx';

<div className={clsx(
  'p-4 rounded-lg',
  isActive && 'bg-blue-100',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
  Content
</div>
```

**Dynamic Styles**:
```typescript
// For truly dynamic values that can't be in Tailwind
<div style={{ 
  width: `${percentage}%`,
  backgroundColor: `var(--${color}-9)` 
}}>
  Content
</div>
```

### Dark Mode Support

**Theme-Aware Styles**:
```typescript
<div className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100">
  <Card className="border border-gray-200 dark:border-neutral-800">
    Content
  </Card>
</div>
```

**CSS Variables**:
```typescript
// Use Radix UI theme tokens
<div style={{ 
  backgroundColor: 'var(--color-panel-solid)',
  color: 'var(--gray-12)'
}}>
  Theme-aware content
</div>
```

## Performance Optimization

### React.memo

**When to Use**:
```typescript
// For expensive pure components that render often
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Complex rendering logic
  return <div>{/* expensive render */}</div>;
});

// With custom comparison
export const Component = React.memo(
  ({ data }: Props) => <div>{data}</div>,
  (prevProps, nextProps) => {
    return prevProps.data.id === nextProps.data.id;
  }
);
```

### useMemo and useCallback

**useMemo for Expensive Calculations**:
```typescript
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);
```

**useCallback for Function Stability**:
```typescript
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);

// Pass stable reference to child
<ChildComponent onClick={handleClick} />
```

### Code Splitting

**Dynamic Imports**:
```typescript
// Lazy load heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  ssr: false,
  loading: () => <Spinner />
});
```

## Error Handling

### Error Boundaries (Future)

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    logErrorToService(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Try-Catch in Components

```typescript
const handleSubmit = async () => {
  try {
    await submitData(formData);
    toast.success('Data saved successfully');
  } catch (error) {
    console.error('Failed to save:', error);
    toast.error('Failed to save data');
  }
};
```

## Testing Components

### Component Test Example

```typescript
// MetricCard.test.tsx
import { render, screen } from '@testing-library/react';
import MetricCard from './MetricCard';

describe('MetricCard', () => {
  it('renders title and value', () => {
    render(
      <MetricCard 
        title="Sales"
        value="$5,000"
        description="Today's sales"
      />
    );
    
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });
  
  it('shows trend when provided', () => {
    render(
      <MetricCard 
        title="Sales"
        value="$5,000"
        description="Today's sales"
        trend="up"
        trendValue="12%"
      />
    );
    
    expect(screen.getByText('12%')).toBeInTheDocument();
  });
});
```

## Related Documentation

- [System Architecture](system-architecture.md)
- [Development Guide](../development-guide/development-setup.md)
- [Component Library](../technical-reference/component-library.md)
- [Testing Guidelines](../development-guide/testing-guidelines.md)

---

**Questions?** Open a discussion on GitHub or contact the frontend team.
