# Dashboard Calendar View Design

## Overview

This design document outlines the transformation of the authenticated dashboard landing page into a calendar-based activity tracker view. The dashboard will display all user activity entries in an interactive calendar format, allowing users to visualize their daily work activities, navigate across months, and view detailed activity breakdowns for each day.

## Business Objectives

- Provide users with a visual overview of their tracked activities across time
- Enable quick navigation and review of historical work entries
- Improve activity tracking transparency and user engagement
- Replace the placeholder dashboard content with meaningful, actionable data
- Support data-driven decision making for time management

## User Experience Goals

- Intuitive calendar navigation with clear visual indicators for days with activities
- Seamless viewing of activity details without page navigation
- Responsive design that works across desktop, tablet, and mobile devices
- Fast loading with proper skeleton states during data fetching
- Consistent design language matching existing application patterns

## Functional Requirements

### Calendar Display

The dashboard must present a monthly calendar view with the following characteristics:

- Display current month by default on initial load
- Show clear visual differentiation for days containing tracked activities versus empty days
- Allow month-to-month navigation using previous and next controls
- Display current selected date with distinct styling
- Show day numbers clearly for all dates in the month
- Include days from adjacent months with reduced opacity for context

### Activity Data Integration

The system must fetch and display activity tracker data:

- Retrieve activity entries from the timesheets API endpoint
- Filter activities by the currently selected month and year
- Group activities by date for calendar presentation
- Handle multiple activity entries per day
- Support real-time data updates when users submit new activities

### Activity Details View

When a user interacts with a calendar day containing activities:

- Display a detailed list of all activity entries for that specific date
- Show project information for each activity entry
- Display hours spent on each project
- Present task descriptions for context
- Organize entries in a clear, scannable format
- Support viewing activities without navigating away from the dashboard

### Empty States and Loading

The interface must gracefully handle various data scenarios:

- Show loading skeleton while fetching calendar data
- Display informative message when no activities exist for selected month
- Provide guidance on how to create first activity entry
- Handle API errors with user-friendly error messages

## Technical Architecture

### Data Flow

**Activity Data Retrieval:**

- Make authenticated API request to fetch timesheet entries
- Filter API response based on selected month and date range
- Transform API data structure to calendar-compatible format
- Cache results to minimize redundant API calls during navigation

**Calendar State Management:**

- Track currently selected month and year
- Maintain selected date for detailed view
- Store fetched activities in component state
- Handle loading and error states separately

**User Interactions:**

- Month navigation triggers new data fetch if needed
- Date selection updates detail view without refetch
- Calendar updates when new activities are submitted

### API Integration

**Endpoint:** GET `/v1/timesheets`

**Expected Response Structure:**

```
Array of activity entries containing:
- id: unique identifier
- workDate: date in YYYY-MM-DD format
- entries: array of project entries
  - projectId: numeric identifier
  - project: object with name, code, department information
  - taskDescription: text description
  - hours: decimal hours spent
- notes: optional additional notes
- createdAt: timestamp
- updatedAt: timestamp
```

**Query Parameters:**

- orgId: organization identifier from authenticated user context
- startDate: beginning of month range (YYYY-MM-DD)
- endDate: end of month range (YYYY-MM-DD)

### Component Structure

**Page Component Hierarchy:**

```
DashboardPage (authenticated/page.tsx)
├── AppHeader (breadcrumb navigation)
└── PageWrapper (consistent background pattern)
    └── Main Content Area
        ├── Calendar Section Card
        │   ├── CardHeader (title, month navigation)
        │   └── CardContent
        │       ├── Calendar Component (react-day-picker)
        │       └── Activity Indicators Overlay
        └── Activity Details Section Card
            ├── CardHeader (selected date)
            └── CardContent
                └── Activity List
                    └── Activity Entry Cards
```

**Reusable Components:**

- ActivityEntryCard: displays individual activity entry details
- EmptyActivityState: shown when no activities exist for selected date
- LoadingCalendarSkeleton: placeholder during data fetch
- MonthNavigator: controls for previous/next month

### State Management

**Component State Requirements:**

| State Variable        | Type           | Purpose                               |
| --------------------- | -------------- | ------------------------------------- |
| selectedDate          | Date           | Currently selected calendar date      |
| currentMonth          | Date           | Month being displayed in calendar     |
| activities            | Array          | All fetched activity entries          |
| isLoading             | boolean        | Data fetching status                  |
| error                 | string or null | Error message if fetch fails          |
| selectedDayActivities | Array          | Filtered activities for selected date |

### Styling and Visual Design

**Calendar Customization:**

- Apply project's design system colors and borders
- Use consistent spacing from existing card layouts
- Highlight days with activities using distinct background color
- Apply hover states for interactive dates
- Show selected date with primary color styling
- Use subtle styling for outside month dates

**Activity Entry Presentation:**

- Display project name prominently
- Show hours in clear, numeric format
- Truncate long task descriptions with expand option
- Use consistent card styling matching application patterns
- Apply department-based color coding if applicable

**Responsive Behavior:**

- Full calendar view on desktop (large screens)
- Simplified calendar on tablets (medium screens)
- Stacked layout on mobile (small screens)
- Collapsible activity details panel on small viewports

## User Interface Patterns

### Calendar Navigation Flow

1. User lands on dashboard
2. System displays current month calendar with loading state
3. API fetches current month's activities
4. Calendar updates with visual indicators on activity days
5. User can click previous/next to change months
6. System fetches new month data if not already cached
7. Calendar updates with new month's activities

### Activity Selection Flow

1. User clicks on a calendar date with activities
2. Selected date styling updates immediately
3. Activity details section updates with filtered entries
4. User can view project details, hours, and descriptions
5. User can select different date to view other activities
6. Empty state shows if selected date has no activities

### Integration with Existing Tracker

- Link from calendar view to tracker entry form
- Pre-fill tracker form with selected date from calendar
- Return to dashboard after successful activity submission
- Auto-refresh calendar data when navigating back from tracker

## Data Transformation Logic

### Grouping Activities by Date

Transform flat API response array into date-indexed structure:

**Input:** Array of timesheet objects with workDate property

**Output:** Object with dates as keys, activity arrays as values

**Process:**

- Iterate through all fetched activities
- Extract workDate field from each entry
- Group entries sharing same workDate
- Store in Map or object structure for O(1) lookup
- Generate activity count per date for calendar indicators

### Calculating Activity Metrics

For each date with activities, compute:

- Total hours tracked across all projects
- Number of distinct projects worked on
- Department distribution if relevant

Display these metrics in calendar day cells or detail view.

## Error Handling and Edge Cases

### API Failure Scenarios

**Network Error:**

- Display toast notification with error message
- Show fallback message in calendar area
- Provide retry action button
- Maintain last successfully loaded data if available

**Authorization Error:**

- Redirect to login if refresh token invalid
- Handle via existing API client interceptor
- Clear stale authentication state

**Empty Response:**

- Treat as valid response with zero activities
- Display appropriate empty state messaging
- Encourage user to track first activity

### Data Validation

**Invalid Date Formats:**

- Parse dates defensively using date-fns parseISO
- Log warnings for malformed dates
- Skip invalid entries rather than breaking UI

**Missing Required Fields:**

- Check for presence of workDate, entries array
- Provide fallback values for optional fields
- Filter out incomplete entries from display

### User Experience Edge Cases

**Today's Activities:**

- Highlight current date distinctly
- Auto-select today's date on initial load
- Show today's activities by default

**Future Dates:**

- Disable selection of future dates
- Apply distinct styling to indicate non-selectable
- Show explanatory tooltip on hover

**Multi-entry Days:**

- Clearly indicate number of entries on calendar
- Display all entries in detail view
- Support scrolling if many entries exist

## Performance Considerations

### Data Fetching Strategy

**Initial Load:**

- Fetch only current month on first render
- Use loading skeleton for perceived performance
- Prioritize visible data over prefetching

**Pagination and Caching:**

- Fetch adjacent months on navigation
- Cache fetched months in component state or context
- Avoid refetching already loaded months
- Clear cache after time threshold or manual refresh

**Optimistic Updates:**

- When user submits new activity from tracker
- Optimistically add to calendar without refetch
- Reconcile with API response on success
- Revert on failure with error notification

### Rendering Optimization

- Memoize calendar day rendering to prevent unnecessary recalculations
- Use React keys properly for activity lists
- Lazy load activity details on date selection
- Debounce rapid month navigation clicks

## Accessibility Considerations

### Keyboard Navigation

- Support arrow key navigation between calendar dates
- Allow Enter key to select date and view details
- Provide Tab key navigation through activity entries
- Ensure month navigation controls are keyboard accessible

### Screen Reader Support

- Provide descriptive labels for calendar dates
- Announce activity count for each date
- Include ARIA labels for navigation controls
- Ensure activity details are properly announced

### Visual Accessibility

- Maintain sufficient color contrast for date indicators
- Don't rely solely on color to convey activity presence
- Provide text labels in addition to visual indicators
- Support theme switching (light/dark mode)

## Future Enhancements

While out of scope for initial implementation, consider these potential additions:

- Week view in addition to month view
- Export activities for selected date range
- Filter activities by project or department
- Display activity statistics and trends
- Quick edit or delete activities from calendar view
- Drag-and-drop to reschedule activities
- Integration with leave calendar to show absences
- Collaborative calendar view for team activities

## Implementation Verification Checklist

Before considering the implementation complete, verify:

- [ ] Calendar displays current month on load
- [ ] Days with activities show visual indicators
- [ ] Month navigation fetches and displays correct data
- [ ] Selecting a date shows activity details
- [ ] Empty states display for dates without activities
- [ ] Loading skeletons appear during data fetch
- [ ] API errors show user-friendly messages
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Calendar respects existing design system patterns
- [ ] Integration with AppHeader and PageWrapper maintained
- [ ] Authentication context properly accessed for API calls
- [ ] Date formatting uses project constants (DATE_FORMATS)
- [ ] Activity submission from tracker updates calendar
- [ ] Keyboard navigation functions correctly
- [ ] Screen readers announce calendar state changes

## Functional Requirements

### Calendar Display

The dashboard must present a monthly calendar view with the following characteristics:

- Display current month by default on initial load
- Show clear visual differentiation for days containing tracked activities versus empty days
- Allow month-to-month navigation using previous and next controls
- Display current selected date with distinct styling
- Show day numbers clearly for all dates in the month
- Include days from adjacent months with reduced opacity for context

### Activity Data Integration

The system must fetch and display activity tracker data:

- Retrieve activity entries from the timesheets API endpoint
- Filter activities by the currently selected month and year
- Group activities by date for calendar presentation
- Handle multiple activity entries per day
- Support real-time data updates when users submit new activities

### Activity Details View

When a user interacts with a calendar day containing activities:

- Display a detailed list of all activity entries for that specific date
- Show project information for each activity entry
- Display hours spent on each project
- Present task descriptions for context
- Organize entries in a clear, scannable format
- Support viewing activities without navigating away from the dashboard

### Empty States and Loading

The interface must gracefully handle various data scenarios:

- Show loading skeleton while fetching calendar data
- Display informative message when no activities exist for selected month
- Provide guidance on how to create first activity entry
- Handle API errors with user-friendly error messages

## Technical Architecture

### Data Flow

**Activity Data Retrieval:**

- Make authenticated API request to fetch timesheet entries
- Filter API response based on selected month and date range
- Transform API data structure to calendar-compatible format
- Cache results to minimize redundant API calls during navigation

**Calendar State Management:**

- Track currently selected month and year
- Maintain selected date for detailed view
- Store fetched activities in component state
- Handle loading and error states separately

**User Interactions:**

- Month navigation triggers new data fetch if needed
- Date selection updates detail view without refetch
- Calendar updates when new activities are submitted

### API Integration

**Endpoint:** GET `/v1/timesheets`

**Expected Response Structure:**

```
Array of activity entries containing:
- id: unique identifier
- workDate: date in YYYY-MM-DD format
- entries: array of project entries
  - projectId: numeric identifier
  - project: object with name, code, department information
  - taskDescription: text description
  - hours: decimal hours spent
- notes: optional additional notes
- createdAt: timestamp
- updatedAt: timestamp
```

**Query Parameters:**

- orgId: organization identifier from authenticated user context
- startDate: beginning of month range (YYYY-MM-DD)
- endDate: end of month range (YYYY-MM-DD)

### Component Structure

**Page Component Hierarchy:**

```
DashboardPage (authenticated/page.tsx)
├── AppHeader (breadcrumb navigation)
└── PageWrapper (consistent background pattern)
    └── Main Content Area
        ├── Calendar Section Card
        │   ├── CardHeader (title, month navigation)
        │   └── CardContent
        │       ├── Calendar Component (react-day-picker)
        │       └── Activity Indicators Overlay
        └── Activity Details Section Card
            ├── CardHeader (selected date)
            └── CardContent
                └── Activity List
                    └── Activity Entry Cards
```

**Reusable Components:**

- ActivityEntryCard: displays individual activity entry details
- EmptyActivityState: shown when no activities exist for selected date
- LoadingCalendarSkeleton: placeholder during data fetch
- MonthNavigator: controls for previous/next month

### State Management

**Component State Requirements:**

| State Variable        | Type           | Purpose                               |
| --------------------- | -------------- | ------------------------------------- |
| selectedDate          | Date           | Currently selected calendar date      |
| currentMonth          | Date           | Month being displayed in calendar     |
| activities            | Array          | All fetched activity entries          |
| isLoading             | boolean        | Data fetching status                  |
| error                 | string or null | Error message if fetch fails          |
| selectedDayActivities | Array          | Filtered activities for selected date |

### Styling and Visual Design

**Calendar Customization:**

- Apply project's design system colors and borders
- Use consistent spacing from existing card layouts
- Highlight days with activities using distinct background color
- Apply hover states for interactive dates
- Show selected date with primary color styling
- Use subtle styling for outside month dates

**Activity Entry Presentation:**

- Display project name prominently
- Show hours in clear, numeric format
- Truncate long task descriptions with expand option
- Use consistent card styling matching application patterns
- Apply department-based color coding if applicable

**Responsive Behavior:**

- Full calendar view on desktop (large screens)
- Simplified calendar on tablets (medium screens)
- Stacked layout on mobile (small screens)
- Collapsible activity details panel on small viewports

## User Interface Patterns

### Calendar Navigation Flow

1. User lands on dashboard
2. System displays current month calendar with loading state
3. API fetches current month's activities
4. Calendar updates with visual indicators on activity days
5. User can click previous/next to change months
6. System fetches new month data if not already cached
7. Calendar updates with new month's activities

### Activity Selection Flow

1. User clicks on a calendar date with activities
2. Selected date styling updates immediately
3. Activity details section updates with filtered entries
4. User can view project details, hours, and descriptions
5. User can select different date to view other activities
6. Empty state shows if selected date has no activities

### Integration with Existing Tracker

- Link from calendar view to tracker entry form
- Pre-fill tracker form with selected date from calendar
- Return to dashboard after successful activity submission
- Auto-refresh calendar data when navigating back from tracker

## Data Transformation Logic

### Grouping Activities by Date

Transform flat API response array into date-indexed structure:

**Input:** Array of timesheet objects with workDate property

**Output:** Object with dates as keys, activity arrays as values

**Process:**

- Iterate through all fetched activities
- Extract workDate field from each entry
- Group entries sharing same workDate
- Store in Map or object structure for O(1) lookup
- Generate activity count per date for calendar indicators

### Calculating Activity Metrics

For each date with activities, compute:

- Total hours tracked across all projects
- Number of distinct projects worked on
- Department distribution if relevant

Display these metrics in calendar day cells or detail view.

## Error Handling and Edge Cases

### API Failure Scenarios

**Network Error:**

- Display toast notification with error message
- Show fallback message in calendar area
- Provide retry action button
- Maintain last successfully loaded data if available

**Authorization Error:**

- Redirect to login if refresh token invalid
- Handle via existing API client interceptor
- Clear stale authentication state

**Empty Response:**

- Treat as valid response with zero activities
- Display appropriate empty state messaging
- Encourage user to track first activity

### Data Validation

**Invalid Date Formats:**

- Parse dates defensively using date-fns parseISO
- Log warnings for malformed dates
- Skip invalid entries rather than breaking UI

**Missing Required Fields:**

- Check for presence of workDate, entries array
- Provide fallback values for optional fields
- Filter out incomplete entries from display

### User Experience Edge Cases

**Today's Activities:**

- Highlight current date distinctly
- Auto-select today's date on initial load
- Show today's activities by default

**Future Dates:**

- Disable selection of future dates
- Apply distinct styling to indicate non-selectable
- Show explanatory tooltip on hover

**Multi-entry Days:**

- Clearly indicate number of entries on calendar
- Display all entries in detail view
- Support scrolling if many entries exist

## Performance Considerations

### Data Fetching Strategy

**Initial Load:**

- Fetch only current month on first render
- Use loading skeleton for perceived performance
- Prioritize visible data over prefetching

**Pagination and Caching:**

- Fetch adjacent months on navigation
- Cache fetched months in component state or context
- Avoid refetching already loaded months
- Clear cache after time threshold or manual refresh

**Optimistic Updates:**

- When user submits new activity from tracker
- Optimistically add to calendar without refetch
- Reconcile with API response on success
- Revert on failure with error notification

### Rendering Optimization

- Memoize calendar day rendering to prevent unnecessary recalculations
- Use React keys properly for activity lists
- Lazy load activity details on date selection
- Debounce rapid month navigation clicks

## Accessibility Considerations

### Keyboard Navigation

- Support arrow key navigation between calendar dates
- Allow Enter key to select date and view details
- Provide Tab key navigation through activity entries
- Ensure month navigation controls are keyboard accessible

### Screen Reader Support

- Provide descriptive labels for calendar dates
- Announce activity count for each date
- Include ARIA labels for navigation controls
- Ensure activity details are properly announced

### Visual Accessibility

- Maintain sufficient color contrast for date indicators
- Don't rely solely on color to convey activity presence
- Provide text labels in addition to visual indicators
- Support theme switching (light/dark mode)

## Future Enhancements

While out of scope for initial implementation, consider these potential additions:

- Week view in addition to month view
- Export activities for selected date range
- Filter activities by project or department
- Display activity statistics and trends
- Quick edit or delete activities from calendar view
- Drag-and-drop to reschedule activities
- Integration with leave calendar to show absences
- Collaborative calendar view for team activities

## Implementation Verification Checklist

Before considering the implementation complete, verify:

- [ ] Calendar displays current month on load
- [ ] Days with activities show visual indicators
- [ ] Month navigation fetches and displays correct data
- [ ] Selecting a date shows activity details
- [ ] Empty states display for dates without activities
- [ ] Loading skeletons appear during data fetch
- [ ] API errors show user-friendly messages
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Calendar respects existing design system patterns
- [ ] Integration with AppHeader and PageWrapper maintained
- [ ] Authentication context properly accessed for API calls
- [ ] Date formatting uses project constants (DATE_FORMATS)
- [ ] Activity submission from tracker updates calendar
- [ ] Keyboard navigation functions correctly
- [ ] Screen readers announce calendar state changes
