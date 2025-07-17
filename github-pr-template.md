**What kind of change does this PR introduce?**

This PR introduces a major new feature: a comprehensive recurring events system.

**Issue Number:**

Fixes #

**Snapshots/Videos:**

N/A

**If relevant, did you update the documentation?**

Yes, comprehensive TSDoc comments have been added to all new files to ensure the code is well-documented and easy to understand.

**Summary**

This PR implements a complete recurring events feature from the ground up, enabling users to create and manage events that repeat on a regular basis. The implementation includes the following key components:

1.  **Database Schema**:
    *   **`recurrence_rules`**: This table stores the recurrence patterns (RRULE) for recurring events. It includes fields for `frequency`, `interval`, `recurrenceStartDate`, `recurrenceEndDate`, `count`, `byDay`, `byMonth`, and `byMonthDay`.
    *   **`materialized_event_instances`**: This table stores pre-calculated instances of recurring events within a hot window. Each instance represents a specific occurrence of a recurring event with calculated dates and times. This approach eliminates data duplication while providing fast date-range queries.
    *   **`event_exceptions`**: This table stores instance-specific modifications to recurring events. When a user modifies a single instance or "this and future" instances, the changes are stored here as differences from the template.

2.  **GraphQL API**:
    *   **Mutations**:
        *   `createEvent`: Extended to support the creation of recurring events by accepting a `recurrence` input object.
    *   **Queries**:
        *   `organization.events`: A GraphQL connection that allows for traversing through the events belonging to an organization. It returns a unified list of both standalone events and materialized instances of recurring events. The query supports `startDate` and `endDate` for date-range filtering, and `includeRecurring` to optionally include recurring event instances. It uses cursor-based pagination for efficient data fetching.
        *   `event`: The `event` query has been updated to fetch a single event, whether it is a standalone event or a specific instance of a recurring event.
    *   **Recurring Options**: The `recurrence` input object supports the following options:
        *   `frequency`: The frequency of the recurrence (`DAILY`, `WEEKLY`, `MONTHLY`, or `YEARLY`).
        *   `interval`: The interval between occurrences (e.g., every 2 days).
        *   `endDate`: The date on which the recurrence should end.
        *   `count`: The number of times the event should repeat.
        *   `byDay`: An array of days of the week on which the event should repeat (e.g., `["MO", "WE", "FR"]`).
        *   `byMonth`: An array of months of the year on which the event should repeat (e.g., `[1, 6, 12]`).
        *   `byMonthDay`: An array of days of the month on which the event should repeat (e.g., `[1, 15, -1]`).

3.  **Event Materialization**:
    *   **Materialization Window**: The system uses a rolling materialization window to manage the pre-calculation of event instances. This window is defined by a `hotWindowMonthsAhead` (how far into the future to materialize) and a `historyRetentionMonths` (how long to keep past instances). A background worker periodically shifts this window forward, materializing new instances and cleaning up old ones that are outside the retention period.
    *   **Materialized Instances**: When a recurring event is created or updated, a background worker calculates all occurrences within the materialization window. For each occurrence, a new record is created in the `materializedEventInstances` table. This record contains a denormalized version of the event data, including the inherited properties from the base event and any exceptions that have been applied. This allows the `events` query to efficiently fetch all the events within a given date range by simply querying the `materializedEventInstances` table.
    *   **Handling of Recurrence Options**:
        *   **`endDate`**: If an `endDate` is provided, instances are materialized only up to that date.
        *   **`count`**: If a `count` is provided, the system calculates the corresponding end date and materializes instances up to that point.
        *   **`never` (no `endDate` or `count`)**: For never-ending events, instances are materialized up to the end of the current materialization window.

4.  **Functional Services**:
    *   The background worker services, including the new event materialization and cleanup workers, have been implemented using a functional approach to improve modularity, testability, and maintainability.

**Does this PR introduce a breaking change?**

No,