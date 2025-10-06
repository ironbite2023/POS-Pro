# Development Setup Guide

**Last Updated**: October 6, 2025  
**Audience**: New Developers  
**Estimated Time**: 30-60 minutes

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended | Purpose |
|----------|----------------|-------------|---------|
| **Node.js** | 18.x | 20.x LTS | JavaScript runtime |
| **npm** | 9.x | 10.x | Package manager |
| **Git** | 2.x | Latest | Version control |
| **VS Code** | Latest | Latest | Code editor |

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

## Initial Setup

### 1. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/your-org/eatlypos.git

# Or using SSH
git clone git@github.com:your-org/eatlypos.git

# Navigate to project directory
cd eatlypos
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# This will install:
# - Next.js 15.3.1
# - React 19
# - Radix UI Themes
# - TailwindCSS 4
# - TypeScript
# - All other dependencies from package.json
```

**Expected Output**:
```
added 342 packages, and audited 343 packages in 45s
found 0 vulnerabilities
```

### 3. Environment Configuration

Create environment file (if needed in future):

```bash
# Copy example environment file
cp .env.example .env.local

# Edit with your preferred editor
code .env.local
```

**Future Environment Variables** (not currently used):
```env
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/eatlypos"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
API_BASE_URL="http://localhost:3000/api"
```

### 4. Start Development Server

```bash
# Start Next.js development server
npm run dev
```

**Expected Output**:
```
   ▲ Next.js 15.3.1
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.100:3000

 ✓ Ready in 2.3s
```

### 5. Verify Installation

1. **Open Browser**: Navigate to `http://localhost:3000`
2. **Expected Result**: Should redirect to `/dashboard/hq-dashboard`
3. **Test Navigation**: Click through sidebar menu items
4. **Check Console**: No errors in browser console

## Development Workflow

### Project Structure

```
eatlypos/
├── .next/                    # Build output (git ignored)
├── node_modules/             # Dependencies (git ignored)
├── public/                   # Static assets
│   └── images/              # Application images
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (default)/       # Main admin interface
│   │   ├── (pos)/          # POS interface
│   │   ├── auth/           # Authentication pages
│   │   ├── docs/           # Documentation
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Root page
│   │   └── globals.css     # Global styles
│   ├── components/          # React components
│   ├── contexts/           # React Context providers
│   ├── data/               # Mock data
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # Additional styles
│   ├── types/              # TypeScript types
│   └── utilities/          # Helper functions
├── .gitignore
├── eslint.config.mjs       # ESLint configuration
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies
├── postcss.config.mjs      # PostCSS configuration
├── README.md
├── tailwind.config.js      # TailwindCSS configuration
└── tsconfig.json           # TypeScript configuration
```

### Common Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Building
npm run build           # Create production build
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix auto-fixable issues

# Type Checking
npx tsc --noEmit        # Check TypeScript errors
```

### Making Your First Change

#### Example: Add a New Metric Card

1. **Open Dashboard File**:
```bash
code src/app/(default)/dashboard/branch-dashboard/page.tsx
```

2. **Add New Metric Card**:
```typescript
<MetricCard
  title="New Metric"
  value="100"
  description="Your new metric"
  icon={<Star size={18} color="purple" />}
  variant="flat"
/>
```

3. **Save File**: Auto-reloads in browser
4. **Verify**: Check dashboard displays new card

#### Example: Create a New Component

1. **Create Component File**:
```bash
touch src/components/common/StatusBadge.tsx
```

2. **Implement Component**:
```typescript
import { Badge } from '@radix-ui/themes';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending';
  label: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const colorMap = {
    active: 'green',
    inactive: 'gray',
    pending: 'yellow'
  };
  
  return (
    <Badge color={colorMap[status]}>
      {label}
    </Badge>
  );
}
```

3. **Use Component**:
```typescript
import StatusBadge from '@/components/common/StatusBadge';

<StatusBadge status="active" label="Active" />
```

## Development Tools

### VS Code Configuration

**Recommended Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Browser DevTools

**React Developer Tools**:
```bash
# Install browser extension
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

**Features**:
- Component tree inspection
- Props and state viewing
- Performance profiling
- Context debugging

### Hot Reload

Next.js provides Fast Refresh:
- **Automatic**: Saves trigger instant updates
- **Preserves State**: Component state maintained
- **Error Recovery**: Errors don't require full reload

**Limitations**:
- Class components may require full reload
- Some hooks require manual refresh
- Config changes need server restart

## Git Workflow

### Branch Naming

```bash
# Feature branches
git checkout -b feature/add-inventory-export

# Bug fixes
git checkout -b fix/dashboard-chart-loading

# Documentation
git checkout -b docs/update-api-docs

# Refactoring
git checkout -b refactor/simplify-metric-card
```

### Commit Messages

**Format**: `<type>(<scope>): <subject>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:
```bash
git commit -m "feat(inventory): add CSV export functionality"
git commit -m "fix(dashboard): resolve chart loading issue"
git commit -m "docs(api): update endpoint documentation"
```

### Pull Request Process

1. **Create Feature Branch**:
```bash
git checkout -b feature/your-feature
```

2. **Make Changes and Commit**:
```bash
git add .
git commit -m "feat: your feature description"
```

3. **Push to Remote**:
```bash
git push origin feature/your-feature
```

4. **Create Pull Request**:
- Go to GitHub
- Click "New Pull Request"
- Fill in description
- Request reviewers

5. **Code Review**:
- Address feedback
- Update PR with commits
- Merge when approved

## Debugging

### Browser Debugging

**Chrome DevTools**:
```typescript
// Add debugger statement
const handleClick = () => {
  debugger;  // Execution pauses here
  performAction();
};

// Or use console methods
console.log('Value:', value);
console.table(arrayData);
console.error('Error occurred');
```

### VS Code Debugging

**Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Network Debugging

**Future API Calls**:
```typescript
// Network tab in DevTools
// Filter by "Fetch/XHR"
// Inspect request/response
```

## Troubleshooting

### Common Issues

#### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
npm run dev -- -p 3001
```

#### Module Not Found

**Problem**: `Error: Cannot find module '@/components/...'`

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Restart dev server
npm run dev
```

#### TypeScript Errors

**Problem**: Red squiggly lines everywhere

**Solution**:
```bash
# Check TypeScript version
npx tsc --version

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Check tsconfig.json is correct
```

#### Styles Not Applying

**Problem**: Tailwind classes not working

**Solution**:
```bash
# Verify Tailwind config
# Check tailwind.config.js content paths

# Clear PostCSS cache
rm -rf .next

# Restart dev server
npm run dev
```

#### Fast Refresh Not Working

**Problem**: Changes don't reflect in browser

**Solution**:
```bash
# Hard refresh browser
# Cmd/Ctrl + Shift + R

# Check console for errors

# Restart dev server
npm run dev
```

## Performance Monitoring

### Build Analysis

```bash
# Analyze bundle size
npm run build

# Review output
# Look for large bundles
# Identify optimization opportunities
```

### Lighthouse Audit

1. Open DevTools
2. Navigate to Lighthouse tab
3. Click "Generate Report"
4. Review performance metrics

**Target Scores**:
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >90

## Next Steps

After setup, proceed to:

1. **[Coding Standards](coding-standards.md)** - Learn project conventions
2. **[Component Guidelines](component-guidelines.md)** - Component patterns
3. **[State Management](state-management.md)** - Context patterns
4. **[Technical Overview](../../EatlyPOS_Technical_Overview.md)** - System architecture

## Getting Help

### Resources

- **Documentation**: `/docs` folder in project
- **GitHub Issues**: Bug reports and feature requests
- **Team Chat**: Slack/Discord (if applicable)
- **Code Review**: Ask questions in PR comments

### Asking for Help

**Good Question**:
```
I'm trying to add a new chart to the dashboard but 
getting this error: [error message]. I've tried [attempts]. 
Here's my code: [code snippet]. Can anyone help?
```

**Include**:
- What you're trying to do
- What error you're getting
- What you've tried
- Relevant code/screenshots

---

**Ready to Start?** Run `npm run dev` and start building!
