# System Architecture

**Last Updated**: October 6, 2025  
**Audience**: Developers, Technical Architects  
**Document Version**: 1.0

## Overview

EatlyPOS is built as a modern, single-page application (SPA) using Next.js 15 with the App Router architecture. This document provides a comprehensive overview of the system's architectural decisions, patterns, and structure.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Next.js 15 App (React 19)                  │ │
│  │  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │   UI Layer   │  │  State Mgmt  │               │ │
│  │  │ (Radix UI +  │  │  (Context)   │               │ │
│  │  │  Tailwind)   │  │              │               │ │
│  │  └──────────────┘  └──────────────┘               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/WebSocket
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Next.js Server (SSR/API Routes)             │
│  ┌────────────────────────────────────────────────────┐ │
│  │            API Layer (Future)                      │ │
│  │  ┌──────────────┐  ┌──────────────┐               │ │
│  │  │ REST/GraphQL │  │ WebSocket    │               │ │
│  │  │  Endpoints   │  │  Server      │               │ │
│  │  └──────────────┘  └──────────────┘               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Data Layer (Future)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Database │  │  Cache   │  │  Queue   │              │
│  │(Postgres)│  │  (Redis) │  │ (Future) │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Application Layers

### 1. Presentation Layer

**Technology Stack**:
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Component System**: Radix UI Themes 3.2.1
- **Styling**: TailwindCSS 4
- **Type System**: TypeScript (strict mode currently disabled)

**Key Characteristics**:
- Client-side heavy (extensive use of 'use client')
- Component-based architecture
- Responsive design (mobile-first approach)
- Dark mode support via next-themes

**Rendering Strategy**:
- **Default**: Client-side rendering (CSR)
- **Charts**: Dynamic imports with SSR disabled
- **Initial Load**: Server-side HTML generation
- **Navigation**: Client-side routing (SPA behavior)

### 2. Routing Architecture

**Route Groups Structure**:

```
/app
├── (default)/          # Main admin interface
│   ├── layout.tsx      # Sidebar + TopBar layout
│   ├── dashboard/
│   ├── inventory/
│   ├── menu-management/
│   ├── sales/
│   └── [...features]
├── (pos)/             # Point-of-sale interface
│   ├── layout.tsx     # Minimal layout, zoom disabled
│   ├── order/
│   ├── checkout/
│   └── kitchen/
├── auth/              # Authentication pages
│   ├── login/
│   ├── forgot-password/
│   └── reset-password/
└── docs/              # Documentation
```

**Route Group Benefits**:
- **Layout Isolation**: Different layouts for different interfaces
- **Code Splitting**: Automatic bundle optimization
- **URL Cleanliness**: Parentheses don't appear in URLs
- **SEO Flexibility**: Per-group meta configuration

### 3. State Management

**Architecture**: React Context API (no external state library)

**Context Providers**:

1. **AppOrganizationContext**
   - **Purpose**: Manages active organization entity (HQ vs Branch)
   - **Scope**: Entire application
   - **State**: `activeEntity: OrganizationEntity`
   - **Location**: `src/contexts/AppOrganizationContext.tsx`

2. **FilterBranchContext**
   - **Purpose**: Filters data by branch for reports
   - **Scope**: Reporting features
   - **State**: `activeBranchFilter: OrganizationEntity | null`

3. **AccentColorContext**
   - **Purpose**: Dynamic theme accent color
   - **Scope**: UI theming
   - **State**: `accentColor: string`

**State Flow Pattern**:
```
User Action → Context Update → Component Re-render → UI Update
```

**Why Context API?**:
- ✅ Sufficient for current application complexity
- ✅ No additional dependencies
- ✅ Native React integration
- ✅ Easy to understand and maintain
- ⚠️ Consider Zustand/Redux for larger scale

### 4. Data Layer

**Current Implementation**: Mock data files

**Location**: `src/data/`

**Mock Data Files**:
- `CommonData.ts` - Organizations, categories, units
- `MenuData.ts` - Menu items and categories
- `LiveOrdersData.ts` - Order information
- `InventoryData.ts` - Stock items
- `LoyaltyData.ts` - Customer loyalty data
- `UserData.ts` - User and staff information

**Future Architecture** (Recommended):

```typescript
// Recommended data fetching pattern
import { useQuery, useMutation } from '@tanstack/react-query';

// API client layer
const apiClient = {
  inventory: {
    getAll: () => fetch('/api/inventory').then(r => r.json()),
    getById: (id: string) => fetch(`/api/inventory/${id}`).then(r => r.json()),
    update: (data) => fetch('/api/inventory', { method: 'PUT', body: JSON.stringify(data) })
  }
};

// Component usage
const { data, isLoading, error } = useQuery({
  queryKey: ['inventory'],
  queryFn: apiClient.inventory.getAll
});
```

### 5. Component Architecture

**Component Hierarchy**:

```
App Layout (Root)
└── Theme Providers
    └── Route Group Layout
        └── Page Component
            └── Feature Components
                └── Shared Components
                    └── Radix UI Primitives
```

**Component Categories**:

1. **Layout Components** (`/components/common/`)
   - TopBar, Sidebar, PageHeading
   - Provide application structure
   - Manage navigation state

2. **Feature Components** (`/components/[feature]/`)
   - Feature-specific logic
   - Compose shared components
   - Handle business logic

3. **Shared Components** (`/components/common/`)
   - MetricCard, CardHeading, OrderTimer
   - Reusable across features
   - Presentational focus

4. **UI Primitives** (Radix UI)
   - Button, Card, Dialog, Table
   - Accessible by default
   - Customized via Tailwind

**Component Communication**:
```
Parent Component
  ↓ Props
Child Component
  ↑ Callbacks
Parent Component
  ↔ Context
Sibling Components
```

## Design Patterns

### 1. Container/Presenter Pattern

**Example**:
```typescript
// Container (handles logic)
const DashboardContainer = () => {
  const [data, setData] = useState(null);
  const { activeEntity } = useAppOrganization();
  
  useEffect(() => {
    // Fetch data based on activeEntity
    fetchDashboardData(activeEntity.id).then(setData);
  }, [activeEntity]);
  
  return <DashboardView data={data} />;
};

// Presenter (pure UI)
const DashboardView = ({ data }) => {
  return <div>{/* Render data */}</div>;
};
```

### 2. Custom Hook Pattern

**Purpose**: Encapsulate reusable logic

**Example**:
```typescript
// src/hooks/usePageTitle.ts
export const usePageTitle = (title: string) => {
  useEffect(() => {
    setPageTitle(title);
  }, [title]);
};

// Usage in component
usePageTitle('Inventory Overview');
```

### 3. Composition Pattern

**Using Radix UI Composition**:
```typescript
<Card size="3">
  <CardHeading title="Dashboard" />
  <Flex direction="column" gap="4">
    <MetricCard title="Sales" value="$5,000" />
    <MetricCard title="Orders" value="125" />
  </Flex>
</Card>
```

### 4. Render Props Pattern (Limited Use)

**Example with ApexCharts**:
```typescript
{isClient ? (
  <ReactApexChart
    type="line"
    height={350}
    options={chartOptions.getLineOptions({...})}
    series={[...]}
  />
) : (
  <ChartLoadingPlaceholder height={350} />
)}
```

## Technology Decisions

### Why Next.js 15?

**Advantages**:
- ✅ **App Router**: Modern routing with layouts
- ✅ **Server Components**: Optimal performance (when needed)
- ✅ **Built-in Optimization**: Image, font, script optimization
- ✅ **TypeScript Support**: First-class TypeScript integration
- ✅ **Developer Experience**: Fast Refresh, error overlay

**Considerations**:
- ⚠️ App Router learning curve
- ⚠️ Client vs Server component boundaries
- ⚠️ Current implementation is heavily client-side

### Why Radix UI?

**Advantages**:
- ✅ **Accessibility**: WCAG compliant out of the box
- ✅ **Unstyled**: Full styling control via Tailwind
- ✅ **Composable**: Build complex UIs from primitives
- ✅ **Headless**: Logic separate from presentation
- ✅ **TypeScript**: Fully typed

**Trade-offs**:
- ⚠️ Learning curve for API
- ⚠️ More verbose than pre-styled libraries
- ✅ But: Complete design control

### Why TailwindCSS?

**Advantages**:
- ✅ **Utility-First**: Rapid development
- ✅ **Performance**: Minimal CSS bundle
- ✅ **Consistency**: Design system via config
- ✅ **Dark Mode**: Built-in support
- ✅ **Responsive**: Mobile-first utilities

### Why Context API (Not Redux)?

**Decision Factors**:
- Application state is relatively simple
- Most state is component-local
- Few deeply nested prop-drilling scenarios
- No complex async state orchestration
- Team familiarity with React basics

**When to Reconsider**:
- Multi-user real-time collaboration
- Complex undo/redo requirements
- Time-travel debugging needs
- State persistence requirements

## Performance Considerations

### Code Splitting

**Automatic Splitting** (Next.js):
- Route-based splitting
- Component-level splitting (dynamic imports)

**Manual Optimization**:
```typescript
// Lazy load heavy components
const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <ChartLoadingPlaceholder />
});
```

### Image Optimization

**Current**: Using Next.js Image component
```typescript
<Image
  src="/images/logo.png"
  width={130}
  height={20}
  alt="Logo"
/>
```

**Configuration**:
```javascript
// next.config.mjs
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
  ],
}
```

### Bundle Analysis

**Recommended Tools**:
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

## Security Architecture

### Current State

**Client-Side Application**:
- No authentication layer yet
- Mock data (no real API)
- No HTTPS enforcement

**Future Requirements**:

1. **Authentication**:
   - JWT-based auth
   - Secure HTTP-only cookies
   - Refresh token rotation

2. **Authorization**:
   - Role-based access control (RBAC)
   - Route protection middleware
   - Component-level permissions

3. **API Security**:
   - Input validation (Zod)
   - Rate limiting
   - CORS configuration
   - SQL injection prevention (Prisma ORM)

### Recommended Auth Pattern

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  if (!token && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next|auth).*)'],
};
```

## Scalability Considerations

### Current Limitations

1. **Single-Page Application**: All code loads upfront
2. **No Caching Layer**: Every request re-fetches
3. **Mock Data**: Not scalable to production
4. **Client-Heavy**: Limited server-side optimization

### Recommended Improvements

1. **Implement API Layer**:
   ```
   Next.js App → API Routes → Database
   ```

2. **Add Caching**:
   - React Query for client cache
   - Redis for server cache
   - CDN for static assets

3. **Database Integration**:
   - PostgreSQL for relational data
   - Prisma ORM for type-safe queries

4. **Real-time Features**:
   - WebSocket for live updates
   - Server-Sent Events for notifications

## Deployment Architecture

### Recommended Deployment

**Platform**: Vercel (optimal for Next.js)

**Benefits**:
- Zero-config Next.js deployment
- Automatic preview deployments
- Edge network CDN
- Serverless functions
- Built-in analytics

**Alternative**: Docker + Kubernetes for self-hosting

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Testing Architecture (Future)

### Recommended Testing Stack

**Unit Tests**: Vitest
**Component Tests**: React Testing Library  
**E2E Tests**: Playwright  
**Visual Regression**: Chromatic

**Test Structure**:
```
src/
├── components/
│   ├── common/
│   │   ├── MetricCard.tsx
│   │   └── MetricCard.test.tsx
```

## Related Documentation

- [Component Architecture](component-architecture.md)
- [Database Schema](database-schema.md)
- [API Architecture](api-architecture.md)
- [Development Guide](../development-guide/development-setup.md)

---

**Questions?** Contact the development team or open a GitHub discussion.
