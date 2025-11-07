# Badge Component Refactoring

## Objective

Consolidate badge usage across the application by removing the redundant `StatusBadge` component and standardizing all status displays to use the existing shadcn/ui `Badge` component from `@/components/ui/badge`.

## Background

The application currently has two badge implementations:

1. **Standard Badge Component** (`@/components/ui/badge`): The existing shadcn/ui badge component with two variants (`default` and `neutral`)
2. **StatusBadge Component** (`app/(authenticated)/admin/projects/_components/StatusBadge.tsx`): A custom badge component created specifically for displaying project status with hardcoded color schemes

This duplication creates inconsistency in styling, increases maintenance overhead, and violates the DRY (Don't Repeat Yourself) principle.

## Current State Analysis

### Existing Badge Component

Located at: `components/ui/badge.tsx`

**Capabilities:**

- Two variants: `default` (main theme colors) and `neutral` (secondary background)
- Supports icons through SVG children
- Accessible and follows the design system
- Uses CVA (class-variance-authority) for variant management
- Supports custom className for extensions

**Current Usage:**

- `app/(authenticated)/_components/ActivityEntryCard.tsx`: Used for leave request status display with proper variant mapping (approved → default, pending/rejected → neutral)

### Redundant StatusBadge Component

Located at: `app/(authenticated)/admin/projects/_components/StatusBadge.tsx`

**Characteristics:**

- Custom implementation with inline Tailwind classes
- Hardcoded color mappings for three status types:
  - Active: green background and border
  - Inactive: gray background and border
  - Archived: yellow background and border
- Does not follow the application's design system variants
- Capitalizes status text internally

**Current Usage:**

- `app/(authenticated)/admin/projects/_components/ProjectsTable.tsx`: Displays project status in the projects table
- Exported from `app/(authenticated)/admin/projects/_components/index.ts`

## Design Strategy

### Approach

Replace the custom `StatusBadge` component with the standard `Badge` component while extending its capabilities to accommodate project status display requirements.

### Status-to-Variant Mapping

Since the existing Badge component supports `default` and `neutral` variants, and potentially custom className extensions, map project statuses as follows:

| Project Status | Badge Variant                   | Additional Styling Strategy                               |
| -------------- | ------------------------------- | --------------------------------------------------------- |
| Active         | `default`                       | Uses theme's main colors (already supported)              |
| Inactive       | `neutral`                       | Uses secondary background (already supported)             |
| Archived       | `neutral` with custom className | Extend with yellow/warning color scheme through className |

**Alternative Approach:** If the design system needs more status types in the future, consider extending the Badge component's variants to include `success`, `warning`, and `inactive` variants. However, for this refactoring, leveraging existing variants with optional className customization is the most straightforward approach.

## Refactoring Specification

### Component Modifications

#### 1. Remove StatusBadge Component

**File to Delete:**

- `app/(authenticated)/admin/projects/_components/StatusBadge.tsx`

**Files to Update:**

- `app/(authenticated)/admin/projects/_components/index.ts`: Remove StatusBadge export

#### 2. Update ProjectsTable Component

**File:** `app/(authenticated)/admin/projects/_components/ProjectsTable.tsx`

**Changes Required:**

| Current Implementation                           | New Implementation                                          |
| ------------------------------------------------ | ----------------------------------------------------------- |
| Import StatusBadge from local components         | Import Badge from `@/components/ui/badge`                   |
| Render `<StatusBadge status={project.status} />` | Render `<Badge>` with variant and className based on status |

**Status Display Logic:**

Create a helper function or inline logic within the component to determine the appropriate badge variant and styling based on project status:

- **Active status**: Use `variant="default"`
- **Inactive status**: Use `variant="neutral"`
- **Archived status**: Use `variant="neutral"` with custom className for visual distinction (e.g., yellow/amber tones)

**Text Transformation:**
Apply status text capitalization (first letter uppercase, rest lowercase) within the consuming component rather than within the badge itself.

### Variant Extension Consideration

**Optional Enhancement:** If multiple components will need archived/warning status styling, consider extending the Badge component's variants to include a `warning` variant. This would centralize the styling and maintain consistency.

**Implementation:**

- Add `warning` variant to the `badgeVariants` CVA configuration in `components/ui/badge.tsx`
- Define warning styles consistent with the design system (e.g., yellow/amber background and border)

This approach future-proofs the component for additional status types while maintaining the centralized design system.

## Migration Impact Analysis

### Files Requiring Changes

1. `app/(authenticated)/admin/projects/_components/ProjectsTable.tsx` - Update imports and badge rendering
2. `app/(authenticated)/admin/projects/_components/index.ts` - Remove StatusBadge export
3. `app/(authenticated)/admin/projects/_components/StatusBadge.tsx` - Delete file

### Components Already Compliant

- `app/(authenticated)/_components/ActivityEntryCard.tsx` - Already uses the standard Badge component correctly

### Testing Considerations

**Visual Regression Testing:**

- Verify project status badges render correctly in the projects table
- Ensure active, inactive, and archived statuses are visually distinguishable
- Confirm badge styling is consistent with the design system

**Functional Testing:**

- Validate status text displays correctly (proper capitalization)
- Test with different project status values
- Ensure table layout remains intact

## Benefits

1. **Consistency**: All status indicators across the application use the same base component
2. **Maintainability**: Single source of truth for badge styling reduces maintenance overhead
3. **Design System Adherence**: Ensures all UI elements follow the established design patterns
4. **Reduced Code**: Eliminates 28 lines of redundant component code
5. **Future Scalability**: Easier to extend badge variants for new status types centrally

## Design Decisions

### Decision 1: Extend Existing Badge vs. Create Status-Specific Component

**Chosen Approach**: Extend existing Badge component

**Rationale**:

- Maintains single component responsibility
- Leverages existing design system
- Reduces component proliferation
- Status display is fundamentally a badge use case

### Decision 2: Variant Extension Strategy

**Chosen Approach**: Use existing variants with optional className extension, with consideration for future variant additions

**Rationale**:

- Minimizes changes to existing Badge component initially
- Provides flexibility for per-usage customization
- Leaves door open for centralizing warning/archived variants if pattern repeats

### Decision 3: Text Transformation Location

**Chosen Approach**: Handle text capitalization in consuming component

**Rationale**:

- Badge component remains presentation-focused
- Consumers maintain control over content formatting
- Aligns with existing usage pattern in ActivityEntryCard
