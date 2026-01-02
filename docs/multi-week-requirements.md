# Requirements: Multi-Week Navigation & Initialization

## Overview
The "Time Budget" application currently only supports a single active budget period. To make it useful for long-term time management, users must be able to browse historical weeks and prepare for upcoming ones without manual setup.

## 1. Navigation Capabilities
- **Time Controls**: Add a navigation bar to the Dashboard and Budget screens.
- **Directional UI**: "Previous Week" and "Next Week" buttons.
- **Contextual Labeling**: Display the current week's date range (e.g., "Jan 1 - Jan 7, 2026") and optionally the Week Number.
- **URL Synchronization**: Use query parameters (e.g., `?date=2026-01-01`) to allow bookmarking and easy sharing of specific weeks.

## 2. Automatic Budget Initialization (Cloning)
To reduce friction when starting a new week, the system should:
- **Detect Missing Weeks**: If a user navigates to a future week that hasn't been created in the database, show a "Start New Week" prompt.
- **Category Cloning**: Automatically copy all "Envelopes" (name, color, and budgeted hours) from the *most recent* existing week into the new one.
- **Fresh Start**: Do NOT copy transactions; transactions always start at zero for a new week.

## 3. Data Integrity & Viz
- **Historical Accuracy**: Ensure transactions stay pinned to the week they were created in.
- **Dynamic Charting**: Calculations (Pie and Bar charts) must strictly reflect the selected date range.
- **Current Day Marker**: If viewing the current week, highlight the "Today" marker in lists (optional).

## 4. Technical Constraints
- **Weekly Boundaries**: All periods should start on Sunday (or Monday, user preference) and last 7 days.
- **Performance**: Fetching historical data should be as fast as the current dashboard (leveraging indexed Prisma queries).
- **Concurrency**: Prevent duplicate week creation if the user clicks "Start Week" multiple times.
