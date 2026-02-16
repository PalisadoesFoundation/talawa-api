---
id: events-overview
title: Events Overview
slug: /developer-resources/events-overview
sidebar_position: 10
---

This guide explains how events work in Talawa, including standalone events and recurring event series.

## Overview

- There are two kinds of events:
  - **Standalone events**: single occurrence stored directly in `events`.
  - **Recurring events**: defined by a template in `events` + a recurrence rule in `recurrence_rules`, with materialized child instances in `recurring_event_instances`.
- Users never edit the template rows directly. They work with instances or with high-level actions (entire series, this and following, this instance only).
- A background worker pre-creates instances within a 12‑month "hot window" and keeps cleaning old ones. Cron runs hourly (generation) and daily (cleanup).
- Updates support three scopes: this instance only, entire series (name/description), and this and following (split the series).
- Deletes support three scopes: this instance only, this and following, and entire series.

## Data Model

### Tables Overview

Tables in talawa-api (Drizzle ORM):

#### Events Table

- **`events`**
  - Stores both standalone events and recurring templates.
  - `is_recurring_template` (aka `isRecurringEventTemplate`) tells if a row is a recurring template.
  - Standalone events: `is_recurring_template = false` and their own `start_at`/`end_at` are final.
  - Recurring templates: `is_recurring_template = true` and act as the parent/defaults for instances.

#### Recurrence Rules Table

- **`recurrence_rules`**
  - One per recurring template.
  - Holds the RRULE-like data (`frequency`, `interval`, `byDay`, `byMonth`, `byMonthDay`, `recurrenceStartDate`, optional `recurrenceEndDate` or `count`).
  - `base_recurring_event_id` links back to the template in `events`.
  - `original_series_id` ties together all splits of the same logical series across time.

#### Recurring Event Instances Table

- **`recurring_event_instances`**
  - Materialized occurrences for recurring series inside the hot window.
  - Key fields:
    - `base_recurring_event_id` → template
    - `recurrence_rule_id` → source rule
    - `original_series_id` → logical series identity across splits
    - `original_instance_start_time` → when the RRULE said it should start
    - `actual_start_time`/`actual_end_time` → after applying exceptions and duration
    - `sequence_number`, `total_count` (if finite), `is_cancelled`

#### Event Exceptions Table

- **`event_exceptions`**
  - Stores per-instance overrides when a user edits a single occurrence (e.g., rename just one date, shift time, etc.).
  - Exception JSON holds only the fields that differ from the template.

#### Event Generation Windows Table

- **`event_generation_windows`**
  - Per-organization config for the hot window and retention:
    - `hot_window_months_ahead` default 12 (1 year forward)
    - `history_retention_months` default 3 (cleanup window)
    - Tracks window boundaries and processing metadata.

### Event Types

- **Standalone event**

  - Single row in `events`, shown directly in calendars and lists.
  - Users edit/delete the event itself.

- **Recurring template (parent)**

  - Row in `events` with `is_recurring_template = true`.
  - Paired with a `recurrence_rules` row.
  - Not directly shown or edited by users as an event occurrence.

- **Recurring instance (child)**
  - Row in `recurring_event_instances` created by the background worker.
  - Inherits default fields (name, description, location, visibility, registerable, etc.) from the template.
  - May have a matching `event_exceptions` row to override specific fields for that one occurrence.
  - What users usually see and interact with on the calendar.

## Background Processing

### Instance Creation

Talawa pre-creates occurrences for recurring events in a forward window to make queries fast and simple.

- **Window**: The default hot window is 12 months ahead; retention keeps ~3 months of history. Config lives in `event_generation_windows`.
- **Cron**: A background worker runs on a schedule (node-cron). Defaults:
  - Generation: hourly (`API_RECURRING_EVENT_GENERATION_CRON_SCHEDULE`, default `0 * * * *`).
  - Cleanup: daily at 02:00 UTC (`API_OLD_EVENT_INSTANCES_CLEANUP_CRON_SCHEDULE`, default `0 2 * * *`).
- **Pipeline (high level)**:
  1. Discover work: find orgs whose window needs extension and their recurring templates.
  2. Normalize recurrence rules (convert COUNT to a derived end date for consistent window math).
  3. Calculate all occurrences between window start and window end.
  4. Insert only missing instances (dedupe by `original_instance_start_time`).
  5. Update housekeeping (window end, last processed counts, etc.).
- **Key behavior**:
  - If a rule is never-ending (no end date and no count), we only generate up to window end.
  - If a rule has COUNT, the engine estimates/derives completion and stops accordingly.
  - Instances store both the original schedule and the final start/end — so exceptions and re-calculations remain consistent.

## Operations

### Updating Recurring Series

Three user-facing options map to distinct backend behaviors.

#### Update This Event Only

- Mutation: `updateSingleRecurringEventInstance`
- What happens:
  - We write an `event_exceptions` row for that instance with only changed fields (e.g., `name`, `description`, `location`, `allDay`, `isPublic`, `isRegisterable`, `startAt`, `endAt`).
  - If times are changed, we also update `actual_start_time`/`actual_end_time` on the instance.
  - Other instances are unaffected.

#### Update Entire Series

- Mutation: `updateEntireRecurringEventSeries`
- What happens:
  - We resolve the logical series via `original_series_id` which is template.
  - We update only safe, series-wide fields on all base templates across the whole logical series (even if the series was split earlier):
    - Supported: `name`, `description`
    - Not changed here: timing/recurrence/location/visibility/registration flags
  - We bump `last_updated_at` on instances so caches and clients know something changed.
  - Because instances inherit name/description, the change is reflected everywhere (past/present/future), unless an instance has its own exception for those fields.

#### Update This and Following

- Mutation: `updateThisAndFollowingEvents`
- What happens:
  - We "cut" the current template's recurrence by setting its `recurrence_end_date` to just before the targeted instance.
  - We delete materialized instances from this point forward for the current template.
  - We create a brand-new template event, apply provided changes (name, desc, location, timing, flags), and create a new `recurrence_rules` row for it.
  - We set the new rule's `original_series_id` (used as the logical series identifier going forward).
  - The background worker immediately generates future instances for the new template within the hot window.
  - Net effect in the UI: everything before the split stays as-is under the old template; the targeted instance becomes the first occurrence of a new series with your updates; everything after follows the new pattern.

**Notes on `original_series_id`**

- This field links templates and instances that belong to the same logical series across splits.
- Actions like "update entire series" and "delete this and following" consult `original_series_id` to operate across all templates created from earlier splits.

### Deleting Recurring Events

Three user-facing options:

#### Delete This Event Only

- Mutation: `deleteSingleEventInstance`
- What happens:
  - We delete action items linked to this instance.
  - We set `is_cancelled = true` on the instance (kept for history/reporting), and update `last_updated_at`.
  - Other instances/series are unaffected.

#### Delete This and Following

- Mutation: `deleteThisAndFollowingEvents`
- What happens:
  - We set the current rule's `recurrence_end_date` to just before this occurrence (effectively trimming the series).
  - We find all instances with the same `original_series_id` whose `actual_start_time >=` this instance and delete them.
  - We also delete their exceptions and action items.
  - Past instances remain.

#### Delete Entire Series

- Mutation: `deleteEntireRecurringEventSeries`
- Input is the template (base event) ID.
- What happens:
  - Using the template's rule, we get its `original_series_id`.
  - We delete, in order: action items (for all templates and instances), instance exceptions, all instances in the series, all recurrence rules in the series, and finally all template rows in `events` that belong to this logical series.
  - Attachments for the requested template are cleaned up from storage.

## Data Access

### Reading and Merging

- The GraphQL `Event` type represents both standalone events and recurring instances with a unified shape.
- For recurring instances, "resolved" fields come from: template defaults + per-instance exceptions + instance timing.
- Useful instance metadata:
  - `sequenceNumber` (e.g., "5 of 12"), `totalCount` when finite.
  - `hasExceptions` and `appliedExceptionData` flags to indicate customizations.

### Scheduling and Cleanup

- Generation cron (hourly by default) grows the forward window and materializes missing instances.
- Cleanup cron (daily by default) removes old instances beyond `history_retention_months` for each org and advances `retention_start_date`.
- Defaults live in `event_generation_windows` and can be tuned per organization.

## Edge Cases

- Never-ending series: only materialized up to the current hot window; cron extends as time moves on.
- Count-based rules: internally normalized to derive an end date for consistent generation; the original count semantics are preserved when calculating occurrences.
- Instance de-duplication: before inserting, generation checks for existing `original_instance_start_time` within the window to avoid duplicates.

## Code References

- Tables: `src/drizzle/tables/events.ts`, `recurrenceRules.ts`, `recurringEventInstances.ts`, `recurringEventExceptions.ts`, `eventGenerationWindows.ts`
- Generation service: `src/services/eventGeneration/*`
- Background workers and cron: `src/workers/backgroundWorkerService.ts`, `src/workers/eventGeneration/*`, `src/workers/eventCleanupWorker.ts`
- GraphQL mutations: `src/graphql/types/Mutation/*RecurringEvent*` and related inputs.
