# API Reference

<cite>
**Referenced Files in This Document**   
- [use-mobile.ts](file://hooks/use-mobile.ts)
- [utils.ts](file://lib/utils.ts)
- [button.tsx](file://components/ui/button.tsx)
- [input.tsx](file://components/ui/input.tsx)
- [sidebar.tsx](file://components/ui/sidebar.tsx)
- [collapsible.tsx](file://components/ui/collapsible.tsx)
- [dropdown-menu.tsx](file://components/ui/dropdown-menu.tsx)
- [sheet.tsx](file://components/ui/sheet.tsx)
- [avatar.tsx](file://components/ui/avatar.tsx)
- [breadcrumb.tsx](file://components/ui/breadcrumb.tsx)
- [skeleton.tsx](file://components/ui/skeleton.tsx)
- [tooltip.tsx](file://components/ui/tooltip.tsx)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [UI Components](#ui-components)
   - [Button](#button)
   - [Input](#input)
   - [Avatar](#avatar)
   - [Breadcrumb](#breadcrumb)
   - [Collapsible](#collapsible)
   - [Dropdown Menu](#dropdown-menu)
   - [Sheet](#sheet)
   - [Sidebar](#sidebar)
   - [Skeleton](#skeleton)
   - [Tooltip](#tooltip)
3. [Hooks](#hooks)
   - [useIsMobile](#useismobile)
4. [Utilities](#utilities)
   - [cn](#cn)

## Introduction
This document provides comprehensive API documentation for all public interfaces in the activity-tracker application. It covers UI components, hooks, and utility functions, detailing their props, return types, events, and usage patterns. The documentation is organized by component type and includes TypeScript interfaces, type exports, and code usage examples.

## UI Components

### Button
The Button component is a reusable UI element with multiple variants and sizes. It supports the `asChild` prop for rendering different underlying elements while maintaining consistent styling.

**Props:**
- `className`: Additional CSS classes to apply
- `variant`: Visual style variant (`default`, `noShadow`, `neutral`, `reverse`)
- `size`: Size variant (`default`, `sm`, `lg`, `icon`)
- `asChild`: When true, renders as a Slot component
- Inherits all standard button HTML attributes

**Type Exports:**
- `buttonVariants`: CVAResult type from class-variance-authority for variant management

**Usage Example:**
```tsx
<Button variant="default" size="lg">Click Me</Button>
<Button asChild><a href="/link">Link Button</a></Button>
```

**Section sources**
- [button.tsx](file://components/ui/button.tsx#L1-L57)

### Input
The Input component provides a styled text input field with consistent theming and accessibility features.

**Props:**
- `className`: Additional CSS classes to apply
- `type`: Input type (text, email, password, etc.)
- Inherits all standard input HTML attributes

**Usage Example:**
```tsx
<Input type="email" placeholder="Enter email" />
<Input className="w-full" />
```

**Section sources**
- [input.tsx](file://components/ui/input.tsx#L1-L20)

### Avatar
The Avatar component displays user profile images with fallback text when images are unavailable.

**Components:**
- `Avatar`: Container component with rounded styling
- `AvatarImage`: Displays the actual image
- `AvatarFallback`: Text to display when image fails to load

**Props:**
- `className`: Additional CSS classes for all components
- Inherits standard HTML attributes for respective elements

**Usage Example:**
```tsx
<Avatar>
  <AvatarImage src="user.jpg" />
  <AvatarFallback>UN</AvatarFallback>
</Avatar>
```

**Section sources**
- [avatar.tsx](file://components/ui/avatar.tsx#L1-L55)

### Breadcrumb
The Breadcrumb component creates navigation trails for hierarchical content.

**Components:**
- `Breadcrumb`: Root navigation element
- `BreadcrumbList`: Ordered list container
- `BreadcrumbItem`: Individual breadcrumb item
- `BreadcrumbLink`: Interactive link item
- `BreadcrumbPage`: Current page indicator
- `BreadcrumbSeparator`: Visual separator (ChevronRight icon)
- `BreadcrumbEllipsis`: Overflow indicator for truncated paths

**Props:**
- `asChild`: For `BreadcrumbLink`, allows rendering custom components
- `className`: Additional CSS classes for all components
- Inherits standard HTML attributes

**Usage Example:**
```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Dashboard</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

**Section sources**
- [breadcrumb.tsx](file://components/ui/breadcrumb.tsx#L1-L107)

### Collapsible
The Collapsible component provides expandable/collapsible content sections.

**Components:**
- `Collapsible`: Root component that manages open/closed state
- `CollapsibleTrigger`: Clickable element that toggles the state
- `CollapsibleContent`: Content that expands and collapses

**Props:**
- Inherits all props from Radix UI's Collapsible components
- No additional custom props defined

**Usage Example:**
```tsx
<Collapsible>
  <CollapsibleTrigger>Toggle Content</CollapsibleTrigger>
  <CollapsibleContent>
    <p>This content can be expanded or collapsed.</p>
  </CollapsibleContent>
</Collapsible>
```

**Section sources**
- [collapsible.tsx](file://components/ui/collapsible.tsx#L1-L36)

### Dropdown Menu
The Dropdown Menu component creates accessible dropdown menus with various item types.

**Components:**
- `DropdownMenu`: Root component
- `DropdownMenuTrigger`: Element that opens the menu
- `DropdownMenuContent`: Container for menu items
- `DropdownMenuItem`: Standard menu item
- `DropdownMenuCheckboxItem`: Checkable menu item
- `DropdownMenuRadioItem`: Radio selection item
- `DropdownMenuLabel`: Section label
- `DropdownMenuSeparator`: Visual divider
- `DropdownMenuShortcut`: Keyboard shortcut indicator
- `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuRadioGroup`

**Props:**
- `inset`: For items and labels, adds left padding
- `sideOffset`: For content, controls distance from trigger
- `className`: Additional CSS classes
- Inherits standard HTML attributes

**Usage Example:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem checked>
      Toggle Option
    </DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Section sources**
- [dropdown-menu.tsx](file://components/ui/dropdown-menu.tsx#L1-L240)

### Sheet
The Sheet component creates side panels that slide in from screen edges.

**Components:**
- `Sheet`: Root component
- `SheetTrigger`: Element that opens the sheet
- `SheetContent`: The sliding panel content
- `SheetHeader`, `SheetFooter`: Header and footer sections
- `SheetTitle`, `SheetDescription`: Title and description elements
- `SheetClose`: Close button
- `SheetPortal`, `SheetOverlay`

**Props:**
- `side`: Position of the sheet (`left`, `right`, `top`, `bottom`)
- `className`: Additional CSS classes
- Inherits standard HTML attributes

**Usage Example:**
```tsx
<Sheet>
  <SheetTrigger>Open Sheet</SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Title</SheetTitle>
      <SheetDescription>Description</SheetDescription>
    </SheetHeader>
    <div>Content goes here</div>
  </SheetContent>
</Sheet>
```

**Section sources**
- [sheet.tsx](file://components/ui/sheet.tsx#L1-L143)

### Sidebar
The Sidebar component provides a comprehensive sidebar system with multiple configurations.

**Components:**
- `SidebarProvider`: Context provider for sidebar state
- `Sidebar`: Main sidebar container
- `SidebarTrigger`: Button to toggle sidebar
- `SidebarRail`: Interactive resize rail
- `SidebarInset`: Main content area that adjusts for sidebar
- `SidebarHeader`, `SidebarFooter`: Header and footer sections
- `SidebarContent`: Scrollable content area
- `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupAction`, `SidebarGroupContent`: Grouping components
- `SidebarInput`: Styled input for sidebar
- `SidebarMenu`, `SidebarMenuItem`: Menu system
- `SidebarMenuButton`, `SidebarMenuAction`, `SidebarMenuBadge`: Menu item components
- `SidebarMenuSkeleton`: Loading skeleton
- `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton`: Nested menu components
- `useSidebar`: Hook to access sidebar context

**Props:**
- `SidebarProvider`: `defaultOpen`, `open`, `onOpenChange`, `className`, `style`
- `Sidebar`: `side` (`left`, `right`), `variant` (`sidebar`, `floating`, `inset`), `collapsible` (`offcanvas`, `icon`, `none`)
- `SidebarMenuButton`: `asChild`, `isActive`, `size` (`default`, `sm`, `lg`), `tooltip`
- Most components accept `className` and standard HTML attributes

**Usage Example:**
```tsx
<SidebarProvider>
  <Sidebar>
    <SidebarHeader>
      <h2>Menu</h2>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive>Dashboard</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <SidebarInset>{children}</SidebarInset>
</SidebarProvider>
```

**Section sources**
- [sidebar.tsx](file://components/ui/sidebar.tsx#L1-L716)

### Skeleton
The Skeleton component provides loading state placeholders with pulse animation.

**Props:**
- `className`: Additional CSS classes
- Inherits standard div HTML attributes

**Usage Example:**
```tsx
<div className="space-y-2">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
</div>
```

**Section sources**
- [skeleton.tsx](file://components/ui/skeleton.tsx#L1-L17)

### Tooltip
The Tooltip component displays informative text on hover or focus.

**Components:**
- `TooltipProvider`: Context provider with global settings
- `Tooltip`: Root component
- `TooltipTrigger`: Element that triggers the tooltip
- `TooltipContent`: The tooltip content

**Props:**
- `TooltipProvider`: `delayDuration` (default: 0)
- `TooltipContent`: `sideOffset` (default: 4), `className`
- All components accept `className` and standard HTML attributes

**Usage Example:**
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>
      <p>This is a tooltip</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Section sources**
- [tooltip.tsx](file://components/ui/tooltip.tsx#L1-L53)

## Hooks

### useIsMobile
The `useIsMobile` hook determines whether the current viewport width is below the mobile breakpoint.

**Return Type:** `boolean`
- Returns `true` if the viewport width is less than 768px
- Returns `false` if the viewport width is 768px or greater
- Initially returns `undefined` during SSR, then resolves to boolean on client

**Internal Logic:**
- Uses `window.matchMedia` to create a media query for `(max-width: 767px)`
- Sets up event listener for media query changes
- Updates state based on `window.innerWidth < 768`
- Cleans up event listener on unmount
- Mobile breakpoint is defined as a constant `MOBILE_BREAKPOINT = 768`

**Usage Example:**
```tsx
function MyComponent() {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileLayout />;
  }
  
  return <DesktopLayout />;
}
```

**Section sources**
- [use-mobile.ts](file://hooks/use-mobile.ts#L1-L20)

## Utilities

### cn
The `cn` utility function merges multiple class names and tailwind classes, handling conditional classes and removing duplicates.

**Function Signature:**
```ts
function cn(...inputs: ClassValue[]): string
```

**Parameters:**
- `...inputs`: Rest parameter accepting multiple values of type `ClassValue`
- `ClassValue` can be: string, null, undefined, boolean, Record<string, boolean>, or array of ClassValues

**Return Type:** `string`
- Returns a single string containing all valid class names separated by spaces
- Filters out falsy values (null, undefined, false)
- Converts object keys to class names when their values are truthy
- Recursively flattens arrays

**Internal Implementation:**
- Uses `clsx` for class composition and conditional logic
- Uses `tailwind-merge` to intelligently merge Tailwind CSS classes, resolving conflicts and removing duplicates

**Usage Example:**
```tsx
// Basic usage
cn("p-2", "m-4", "bg-blue-500");

// Conditional classes
cn("text-lg", isLarge && "text-xl");

// Object syntax
cn("p-2", { "hidden": isHidden, "visible": !isHidden });

// With component
function Button({ className, ...props }) {
  return <button className={cn("px-4 py-2", className)} {...props} />;
}
```

**Section sources**
- [utils.ts](file://lib/utils.ts#L1-L7)