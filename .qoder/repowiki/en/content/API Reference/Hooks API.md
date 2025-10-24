# Hooks API Documentation

<cite>
**Referenced Files in This Document**
- [hooks/use-mobile.ts](file://hooks/use-mobile.ts)
- [app/_components/Sidebar.tsx](file://app/_components/Sidebar.tsx)
- [components/ui/sidebar.tsx](file://components/ui/sidebar.tsx)
- [lib/utils.ts](file://lib/utils.ts)
- [package.json](file://package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Hook Overview](#hook-overview)
3. [Implementation Details](#implementation-details)
4. [Integration with Sidebar System](#integration-with-sidebar-system)
5. [Usage Examples](#usage-examples)
6. [Reactivity and Performance](#reactivity-and-performance)
7. [Server-Side Rendering Considerations](#server-side-rendering-considerations)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Conclusion](#conclusion)

## Introduction

The `useIsMobile` custom React hook is a fundamental utility designed to enable responsive UI rendering decisions between mobile and desktop layouts. This hook leverages the native `matchMedia` API to detect screen breakpoints and provides a boolean value indicating whether the current device qualifies as a mobile device based on predefined criteria.

The hook serves as a cornerstone for the application's adaptive design system, particularly within the Sidebar component ecosystem where layout behavior diverges significantly between mobile and desktop form factors. By providing a reactive boolean signal, developers can conditionally render components, modify behaviors, and optimize user experiences across different device types.

## Hook Overview

### Return Type
The `useIsMobile` hook returns a boolean value representing the current device's mobile status. The return type is explicitly typed as `boolean` and follows React's convention of returning primitive values for optimal performance.

### Breakpoint Definition
The hook defines mobile devices using a fixed breakpoint of **768 pixels**. Devices with a viewport width less than 768 pixels are considered mobile devices, while larger viewports qualify as desktop devices.

### Core Purpose
The primary purpose of this hook is to enable adaptive UI rendering decisions within the application's component hierarchy. It facilitates the creation of responsive user interfaces that automatically adjust their behavior and appearance based on the device's capabilities and screen size.

**Section sources**
- [hooks/use-mobile.ts](file://hooks/use-mobile.ts#L1-L20)

## Implementation Details

### Media Query Detection

The hook utilizes the native `window.matchMedia` API to create a media query listener that monitors viewport width changes. The implementation creates a media query targeting screens with a maximum width of 767 pixels (effectively 768px and below):

```typescript
const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
```

This approach ensures accurate detection of mobile devices regardless of device pixel ratio or other display characteristics.

### State Management

The hook maintains internal state using React's `useState` hook with an initial value of `undefined`. This design choice accommodates the asynchronous nature of media query listeners and ensures proper hydration in server-side rendered environments.

```typescript
const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
```

### Effect Lifecycle

The hook employs a `useEffect` cleanup pattern to manage the media query listener lifecycle:

```typescript
React.useEffect(() => {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  const onChange = () => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  }
  mql.addEventListener("change", onChange)
  setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  return () => mql.removeEventListener("change", onChange)
}, [])
```

This implementation ensures:
- **Memory Leak Prevention**: Proper removal of event listeners during component unmount
- **Immediate State Synchronization**: Initial state reflects the current viewport width
- **Real-time Updates**: Automatic updates when viewport dimensions change

### Boolean Coercion

The hook returns a coerced boolean value using the double negation operator (`!!`). This ensures consistent boolean return values regardless of the internal state representation:

```typescript
return !!isMobile
```

**Section sources**
- [hooks/use-mobile.ts](file://hooks/use-mobile.ts#L1-L20)

## Integration with Sidebar System

### Sidebar Provider Integration

The `useIsMobile` hook integrates seamlessly with the application's Sidebar system through the `SidebarProvider` component. This integration enables the sidebar to adapt its behavior based on the detected device type:

```typescript
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  // ...
}
```

### Mobile Layout Adaptation

The hook's boolean return value drives significant layout adaptations within the Sidebar component:

#### Desktop Layout (Non-Mobile)
For desktop devices, the sidebar renders as a persistent navigation element with collapsible functionality:

```typescript
if (isMobile) {
  return (
    <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
      {/* Mobile-specific sheet content */}
    </Sheet>
  )
}
```

#### Mobile Layout (Mobile Device)
For mobile devices, the sidebar transforms into a bottom-sheet modal interface:

```typescript
return (
  <div
    className="group peer hidden md:block"
    data-state={state}
    data-collapsible={state === "collapsed" ? collapsible : ""}
    data-variant={variant}
    data-side={side}
    data-slot="sidebar"
  >
    {/* Desktop-specific layout */}
  </div>
)
```

### Conditional Rendering Example

The hook enables conditional rendering of UI elements based on device type. For instance, the dropdown menu placement adapts to the device type:

```typescript
<DropdownMenuContent
  className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
  side={isMobile ? "bottom" : "right"}
  align="end"
  sideOffset={4}
>
```

**Section sources**
- [components/ui/sidebar.tsx](file://components/ui/sidebar.tsx#L50-L100)
- [components/ui/sidebar.tsx](file://components/ui/sidebar.tsx#L300-L350)

## Usage Examples

### Basic Hook Consumption

Components can consume the `useIsMobile` hook to conditionally render mobile-specific UI elements:

```typescript
import { useIsMobile } from "@/hooks/use-mobile"

function ResponsiveComponent() {
  const isMobile = useIsMobile()
  
  return (
    <div>
      {isMobile ? (
        <MobileView />
      ) : (
        <DesktopView />
      )}
    </div>
  )
}
```

### Sidebar Integration Pattern

The hook integrates naturally with the Sidebar system for layout adaptation:

```typescript
import { useSidebar } from "@/components/ui/sidebar"

function NavigationComponent() {
  const { isMobile } = useSidebar()
  
  return (
    <nav>
      {isMobile ? (
        <MobileNavigation />
      ) : (
        <DesktopNavigation />
      )}
    </nav>
  )
}
```

### Conditional Behavior Modification

Components can use the hook to modify behavior based on device type:

```typescript
function InteractiveComponent() {
  const isMobile = useIsMobile()
  
  useEffect(() => {
    if (isMobile) {
      // Mobile-specific initialization
      initializeMobileBehavior()
    } else {
      // Desktop-specific initialization
      initializeDesktopBehavior()
    }
  }, [isMobile])
  
  return (
    <div>
      {/* Content that adapts to device type */}
    </div>
  )
}
```

### Dynamic Styling Adaptation

The hook enables dynamic styling based on device type:

```typescript
function StyledComponent() {
  const isMobile = useIsMobile()
  
  return (
    <div className={`layout-${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Styles automatically adapt to device type */}
    </div>
  )
}
```

## Reactivity and Performance

### No Unnecessary Re-renders

The hook is designed to prevent unnecessary re-renders through several optimization strategies:

#### Memoized Context Value
The `SidebarProvider` uses `React.useMemo` to memoize the context value, preventing re-renders when the `isMobile` value remains unchanged:

```typescript
const contextValue = React.useMemo<SidebarContextProps>(
  () => ({
    state,
    open,
    setOpen,
    isMobile,
    openMobile,
    setOpenMobile,
    toggleSidebar,
  }),
  [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
)
```

#### Efficient Event Listener Management
The media query listener is properly cleaned up during component unmount, preventing memory leaks and unnecessary state updates.

#### Boolean Return Type
The hook returns a primitive boolean value, avoiding object reference changes that could trigger unnecessary re-renders in consuming components.

### Performance Implications

The hook's performance characteristics are optimized for typical usage patterns:

- **Initialization Cost**: Minimal overhead during component mounting
- **Update Cost**: Efficient media query change events
- **Memory Footprint**: Small memory footprint with proper cleanup
- **Browser Compatibility**: Leverages native browser APIs for optimal performance

**Section sources**
- [components/ui/sidebar.tsx](file://components/ui/sidebar.tsx#L80-L120)

## Server-Side Rendering Considerations

### SSR Behavior

The `useIsMobile` hook is designed to handle server-side rendering scenarios gracefully:

#### Undefined Initial State
During server-side rendering, the hook returns `undefined` initially, allowing the component to render without throwing errors:

```typescript
const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
```

#### Hydration Mismatches
The hook prevents hydration mismatches by:
- Using `undefined` as the initial state
- Setting the correct state immediately after mounting
- Ensuring consistent behavior between server and client

#### Client-Side Initialization
The hook initializes state on the client side, ensuring proper hydration:

```typescript
React.useEffect(() => {
  // Client-side initialization occurs here
  setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
}, [])
```

### Best Practices for SSR

When using the hook in server-side rendered applications:

1. **Conditional Rendering**: Always check for `undefined` before using the value
2. **Fallback Content**: Provide appropriate fallback content for SSR scenarios
3. **Client-Side Only**: Use the hook only in client components marked with `"use client"`

Example of SSR-safe usage:

```typescript
function SSRSafeComponent() {
  const isMobile = useIsMobile()
  
  if (isMobile === undefined) {
    // SSR fallback content
    return <div>Loading...</div>
  }
  
  return (
    <div>
      {isMobile ? <MobileContent /> : <DesktopContent />}
    </div>
  )
}
```

## Best Practices

### Hook Consumption Guidelines

#### 1. Always Use in Client Components
The hook requires client-side DOM access and should only be used in components marked with `"use client"`:

```typescript
"use client"

import { useIsMobile } from "@/hooks/use-mobile"

function MyComponent() {
  const isMobile = useIsMobile()
  // ...
}
```

#### 2. Prefer Higher-Level Abstractions
When building complex components, consider using higher-level abstractions like the `useSidebar` hook rather than directly consuming `useIsMobile`.

#### 3. Memoize Dependent Calculations
When performing calculations based on the hook's return value, use `React.useMemo` to prevent unnecessary computations:

```typescript
const layoutConfig = React.useMemo(() => {
  return isMobile ? mobileConfig : desktopConfig
}, [isMobile])
```

### Component Design Patterns

#### Responsive Component Pattern
Create components that automatically adapt to device type:

```typescript
function ResponsiveLayout() {
  const isMobile = useIsMobile()
  
  return (
    <div className="responsive-layout">
      <Header isMobile={isMobile} />
      <MainContent isMobile={isMobile} />
      <Footer isMobile={isMobile} />
    </div>
  )
}
```

#### Conditional Feature Flag Pattern
Use the hook to conditionally enable features:

```typescript
function FeatureComponent() {
  const isMobile = useIsMobile()
  
  return (
    <div>
      {!isMobile && <AdvancedFeatures />}
      <BasicFeatures />
    </div>
  )
}
```

### Testing Strategies

#### Mocking the Hook
When testing components that consume the hook, consider mocking the `window.matchMedia` API:

```typescript
beforeEach(() => {
  global.window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: query.includes('768'),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }))
})
```

#### Unit Testing
Test the hook's behavior in different viewport scenarios:

```typescript
test('should return true for mobile viewport', () => {
  global.window.innerWidth = 767
  expect(useIsMobile()).toBe(true)
})

test('should return false for desktop viewport', () => {
  global.window.innerWidth = 768
  expect(useIsMobile()).toBe(false)
})
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Hook Returns `undefined` During SSR
**Symptoms**: Components fail to render or throw errors during server-side rendering
**Solution**: Always check for `undefined` before using the hook's return value:

```typescript
const isMobile = useIsMobile()
if (isMobile === undefined) {
  return <div>Loading...</div>
}
```

#### Issue: Hydration Mismatch Warnings
**Symptoms**: React warnings about hydration mismatch between server and client
**Solution**: Ensure proper handling of the initial `undefined` state and consistent rendering logic.

#### Issue: Inconsistent Mobile Detection
**Symptoms**: Hook returns incorrect values for specific viewport sizes
**Solution**: Verify the breakpoint definition and ensure proper media query syntax:

```typescript
// Correct breakpoint definition
const MOBILE_BREAKPOINT = 768
```

#### Issue: Memory Leaks in Long-lived Components
**Symptoms**: Browser performance degradation over time
**Solution**: Ensure proper cleanup of event listeners and avoid holding references to the hook's state.

### Debugging Techniques

#### Enable Debug Logging
Add logging to track hook behavior:

```typescript
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    console.log('Initializing mobile detection')
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const newValue = window.innerWidth < MOBILE_BREAKPOINT
      console.log('Mobile state changed:', newValue)
      setIsMobile(newValue)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => {
      console.log('Cleaning up mobile detection')
      mql.removeEventListener("change", onChange)
    }
  }, [])

  return !!isMobile
}
```

#### Monitor Media Query Events
Use browser developer tools to monitor media query changes and ensure proper event handling.

## Conclusion

The `useIsMobile` hook represents a well-designed, efficient solution for mobile device detection in React applications. Its implementation leverages native browser APIs for optimal performance while providing a clean, intuitive interface for developers.

Key strengths of the hook include:

- **Simplicity**: Clear, focused functionality with minimal cognitive overhead
- **Performance**: Optimized for zero unnecessary re-renders and efficient memory usage
- **Reliability**: Robust handling of edge cases including SSR and hydration scenarios
- **Integration**: Seamless integration with the application's existing component architecture

The hook serves as a foundational building block for creating responsive, adaptive user interfaces that provide optimal experiences across all device types. By following the documented best practices and understanding its limitations, developers can effectively leverage this hook to build sophisticated, responsive applications.

Future enhancements could include customizable breakpoints, support for orientation changes, and integration with CSS custom properties for enhanced styling capabilities. However, the current implementation provides a solid foundation that meets the majority of responsive design requirements.