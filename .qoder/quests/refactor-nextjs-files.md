# Refactor Next.js Project to 2025 Best Practices

## Objective

Refactor all TypeScript and TSX files across the Next.js project to conform to modern 2025 single-file structure standards, ensuring consistency, maintainability, and adherence to React Server Components (RSC) paradigm.

## Scope

This refactoring encompasses:

- All `.tsx` files in `/app`, `/components`, and subdirectories
- All `.ts` files in `/lib`, `/hooks`, and other utility directories
- Enforcement of consistent file structure patterns
- Optimization of "use client" directive usage
- Import organization and cleanup
- TypeScript type safety improvements
- Code formatting standardization

### Files Included

- Application pages in `/app/(authenticated)/**/*.tsx`
- Shared components in `/app/_components/**/*.tsx`
- Custom hooks in `/hooks/**/*.ts`
- Library utilities in `/lib/**/*.ts`
- Layout files and route handlers

## Refactoring Principles

### 1. "use client" Directive Strategy

The directive should be applied strategically based on actual requirements:

**Apply "use client" when:**

- Component uses React hooks (useState, useEffect, useCallback, useMemo, useContext, etc.)
- Component accesses browser-only APIs (window, document, localStorage, etc.)
- Component uses event handlers that require interactivity
- Component imports from client-only libraries (e.g., @react-oauth/google)
- Component uses Next.js client hooks (usePathname, useRouter, useSearchParams)

**Avoid "use client" when:**

- Component is purely presentational with no hooks or interactivity
- File exports only utilities, types, or pure functions
- Layout files that only compose other components (evaluate case-by-case)
- Server-side data fetching is the primary concern

**Current Files Requiring "use client":**

- `/app/_components/Sidebar.tsx` - Uses usePathname, useState
- `/app/_components/AuthProvider.tsx` - Uses React Context and hooks
- `/hooks/use-auth.ts` - Accesses client-side context
- Form components with React Hook Form and state management
- All components using shadcn/ui interactive elements with state

### 2. Import Organization Standard

Establish a four-tier import structure for clarity and maintainability:

```
[Tier 1: "use client" directive if needed]

[Tier 2: External package imports]
- React and React-related libraries
- Third-party UI libraries (shadcn, Radix)
- External utilities (date-fns, zod, axios)
- Icon libraries (lucide-react)

[Tier 3: Internal project imports]
- Components from @/components
- Utilities from @/lib
- Hooks from @/hooks
- Types from internal modules

[Tier 4: Styles and assets]
- CSS imports (if any)
- Static assets

[Tier 5: Type-only imports]
- Type definitions
- Interface declarations
```

**Specific ordering within external imports:**

1. React core
2. Next.js modules
3. Form libraries (react-hook-form, zod)
4. UI component libraries
5. Utility libraries
6. Icon libraries

### 3. Single-File Structure Pattern

Each file should follow this consistent architecture:

```
1. File-level directive ("use client" if applicable)
2. Import statements (organized by tier)
3. Type definitions and interfaces
4. Constants (file-scoped only)
5. Default export component/function (prioritized)
6. Component implementation:
   a. Hook declarations (useState, useRouter, useForm, etc.)
   b. Derived state (useMemo computations)
   c. Side effects (useEffect blocks)
   d. Event handlers (useCallback wrapped)
   e. Helper logic (conditional rendering decisions)
   f. JSX return statement
7. Named exports (if any)
8. Local helper functions (pure, file-scoped utilities)
```

**Rationale:**

- Default export first improves code navigation and readability
- Logical flow from setup → effects → handlers → rendering
- Helper functions after main component maintain focus on primary logic

### 4. Code Extraction and Modularization

**Extract to `/lib` when:**

- Pure functions used across multiple files
- Business logic utilities (data transformations, calculations)
- API client configurations and interceptors
- Constants and configuration objects
- Type guards and validation helpers

**Extract to `/hooks` when:**

- Reusable stateful logic shared between components
- Side effect encapsulation (data fetching patterns, subscriptions)
- Complex state management patterns
- Browser API abstractions

**Extract to local `_components` when:**

- UI segments specific to a single route or feature
- Presentational components reducing parent complexity
- Components unlikely to be reused elsewhere
- Maintain route-level component isolation

**Keep inline when:**

- Single-use helper functions under 10 lines
- Component-specific logic tightly coupled to parent state
- Conditional rendering logic specific to one component

### 5. TypeScript Quality Standards

**Remove:**

- Unused imports (detected by ESLint)
- Redundant type assertions
- Duplicate type definitions
- Optional chaining where types guarantee presence

### 6. Formatting and Cleanup

**Standards:**

- Consistent spacing around imports (single blank line between tiers)
- Remove commented-out code blocks
- Standardize quote usage (prefer double quotes per project convention)
- Ensure trailing commas in multiline structures
- Consistent indentation (2 spaces per tsconfig)

## Implementation Strategy

### Phase 1: Analysis and Planning

**Inventory Assessment:**

- Catalog all `.ts` and `.tsx` files
- Identify files currently using "use client"
- Map component dependencies and relationships
- Identify shared utilities and potential extractions

**Priority Classification:**

1. High Priority: Core components (`AuthProvider`, `Sidebar`, layout files)
2. Medium Priority: Page components and route-specific logic
3. Low Priority: UI components and isolated utilities

### Phase 2: Systematic Refactoring

**Per-File Workflow:**

1. Evaluate "use client" necessity

   - Scan for React hooks usage
   - Check for browser API access
   - Determine if component is purely presentational

2. Reorganize imports

   - Group by tier (external → internal → styles → types)
   - Sort alphabetically within groups
   - Remove unused imports

3. Restructure file contents

   - Move types to top (after imports)
   - Position default export prominently
   - Sequence hooks, effects, handlers, JSX
   - Relocate helper functions to end

4. Extract shared logic

   - Identify reusable utilities → move to `/lib`
   - Identify reusable hooks → move to `/hooks`
   - Create `_components` directories for route-specific extractions

5. Enhance TypeScript typing

   - Add explicit return types
   - Replace `any` with proper types
   - Define missing interfaces

6. Format and clean
   - Apply consistent formatting
   - Remove dead code
   - Standardize naming conventions

### Phase 3: Verification and Testing

**Quality Checks:**

- Run `pnpm build` to ensure no TypeScript errors
- Execute ESLint validation
- Verify no runtime errors in development mode
- Confirm all routes render correctly
- Validate authentication flows remain intact

**Non-Breaking Guarantee:**

- No changes to component public APIs (props interfaces)
- No alterations to exported function signatures
- Maintain existing behavior and user experience
- Preserve all functionality without regression

## File-Specific Refactoring Notes

### Core Application Files

**`/app/_components/AuthProvider.tsx`**

- Status: Already well-structured
- "use client": Required (uses Context and hooks)
- Minor adjustments: Import ordering, explicit return type for provider

**`/app/_components/Sidebar.tsx`**

- Status: Requires restructuring
- "use client": Required (usePathname, state management)
- Actions needed:
  - Extract `navLinks` and `adminLinks` to `/lib/constants.ts`
  - Move `getUserInitials` helper to end of file
  - Consider extracting `isParentActive` to `/lib/utils.ts` if reused

**`/hooks/use-auth.ts`**

- Status: Already minimal and correct
- "use client": Required (accesses Context)
- Actions needed: Add explicit return type annotation

**`/lib/api-client.ts`**

- Status: Well-structured
- "use client": Not required (utility module)
- Actions needed: Verify import order, add type documentation

### Form Components

**`/app/(authenticated)/leaves/application/_components/LeaveApplicationForm.tsx`**

- Status: Requires significant restructuring
- "use client": Required (form hooks, state, effects)
- Actions needed:
  - Move `formSchema` to separate `/lib/schemas/leave-schema.ts`
  - Extract `LeaveTypeResponse` interface to `/lib/types/leave-types.ts`
  - Relocate date calculation logic to pure function in `/lib/utils/date-calculations.ts`
  - Sequence hooks → effects → handlers → JSX clearly
  - Extract error message parsing to utility function

### Layout Files

**`/app/(authenticated)/layout.tsx`**

- Status: Evaluate "use client" need
- Current: No directive
- Analysis: Composes client components but has no hooks itself
- Decision: Remain as Server Component (correct pattern)

### UI Components

**`/components/ui/*.tsx`**

- Status: Generated by shadcn/ui
- Strategy: No modifications

## Migration Checklist

### Pre-Refactoring

- [ ] Create backup branch
- [ ] Document current project structure
- [ ] Run full test suite to establish baseline
- [ ] Confirm build passes without errors

### During Refactoring

- [ ] Refactor core authentication files
- [ ] Refactor navigation and layout components
- [ ] Refactor page components
- [ ] Refactor form components
- [ ] Extract shared utilities to `/lib`
- [ ] Extract shared hooks to `/hooks`
- [ ] Organize constants into `/lib/constants.ts`
- [ ] Clean up UI components
- [ ] Verify "use client" usage across all files

### Post-Refactoring

- [ ] Run `pnpm build` successfully
- [ ] Execute `pnpm lint` without errors
- [ ] Test all routes in development mode
- [ ] Verify authentication flow works
- [ ] Confirm form submissions function correctly
- [ ] Check responsive behavior across devices
- [ ] Review bundle size for unexpected increases
- [ ] Update project documentation

## Expected Outcomes

### Code Quality Improvements

- **Consistency**: Uniform file structure across entire codebase
- **Maintainability**: Clear separation of concerns and logical organization
- **Performance**: Optimal use of Server Components vs Client Components
- **Readability**: Intuitive import organization and component structure

### Developer Experience Enhancements

- Faster onboarding for new developers
- Easier code navigation and comprehension
- Reduced cognitive load when reading files
- Clearer patterns for future development
- Better IDE support through improved typing

### Technical Benefits

- Reduced client-side JavaScript bundle (fewer "use client" directives)
- Improved tree-shaking through better import organization
- Enhanced build-time optimization opportunities
- Stronger compile-time error detection
- Better alignment with Next.js 16 recommendations

## Constraints and Considerations

### Non-Negotiable Requirements

- Zero breaking changes to functionality
- Maintain all existing features and behaviors
- Preserve current API contracts
- Keep authentication flows intact
- No introduction of new dependencies

### Project-Specific Rules

- Continue using axios-based `api-client` (no SWR/React Query)
- Maintain shadcn/ui component patterns
- Follow existing Tailwind CSS styling conventions
- Preserve centralized constants in `/lib/constants.ts`
- Use React Hook Form with Zod validation as established

### Compatibility Targets

- Next.js 16.0.0 with App Router
- React 19
- TypeScript strict mode
- ESLint configuration (eslint.config.mjs)
- Node.js LTS version

## Risk Mitigation

### Potential Issues

1. **Incorrect "use client" placement**: Could break Server Component benefits

   - Mitigation: Test each component after modification

2. **Import circular dependencies**: Extraction might create cycles

   - Mitigation: Use dependency graph analysis, extract types separately

3. **Type inference breakage**: Restructuring might affect inferred types

   - Mitigation: Add explicit type annotations, run strict type checking

4. **Bundle size increase**: Improper extraction could duplicate code
   - Mitigation: Verify build output, use code splitting appropriately

### Rollback Strategy

- Maintain clean Git history with logical commits per file/module
- Each phase should be independently revertible
- Document any unexpected side effects immediately
- Keep original implementations accessible in Git history

## Success Criteria

The refactoring is considered successful when:

1. All files follow the documented structure pattern
2. "use client" directives are applied only where necessary
3. Imports are organized consistently across the project
4. TypeScript compilation passes without errors or warnings
5. ESLint validation passes without violations
6. All existing functionality works without regression
7. Build process completes successfully
8. Development server runs without console errors
9. Code review confirms improved readability and maintainability
10. Documentation reflects the new standards

## Future Maintenance

### Ongoing Standards

- New files must follow established patterns from this refactoring
- Code reviews should verify adherence to structure guidelines
- Periodic audits to ensure consistency is maintained
- Update ESLint rules to enforce structural patterns where possible

### Documentation Updates

- Update project README with new file structure conventions
- Create coding guidelines document referencing this refactoring
- Maintain examples of correctly structured files as templates
- Document decisions around "use client" usage for future reference
