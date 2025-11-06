---
id: action-items
title: Event Action Items
slug: /developer-resources/action-items
sidebar_position: 9
---



# Event Action Items

This guide explains how action items relate to events in Talawa, with a focus on recurring series and per-instance behavior. It complements the Events documentation.

## Overview

### Key Concepts

- Two kinds of action items:
  - **Series (template) action items**: attached to the recurring event template; inherit to every instance unless overridden.
  - **Instance-only action items**: attached directly to one recurring instance (or a standalone event).
- Per-instance changes to a series item are stored as action item exceptions (override, complete, or delete just for that date).
- Reading an instance's action items = series items ± exceptions + instance-only items.
- Deletions cascade appropriately:
  - Delete instance → removes its instance-only items and exceptions.
  - Delete this and following → removes items/exceptions for affected future instances.
  - Delete entire series → removes template items, all instance-only items, and all exceptions across the series.

## Data Model

### Tables Overview

Tables in talawa-api (Drizzle ORM):

#### Action Items Table

- **`actionitems`**
  - Series-level: `eventId` = template event id; `isTemplate=true` (advisory flag).
  - Instance-only: `recurringEventInstanceId` = instance id (no inheritance).
  - Other fields: `assignedAt`, `preCompletionNotes`, `postCompletionNotes`, `isCompleted`, `volunteerId`, `volunteerGroupId`, `categoryId`, `organizationId`, `creatorId`, `updaterId`.

#### Action Item Exceptions Table

- **`actionitem_exceptions`**
  - One row per (actionId, recurring instance) when a series item is overridden for a specific occurrence.
  - Fields: `completed`, `deleted`, `assignedAt`, `preCompletionNotes`, `postCompletionNotes`, `volunteerId`, `volunteerGroupId`, `categoryId`, `assigneeId`.
  - Unique(actionId, eventId) enforces one exception per action item per instance.

#### Recurring Event Instances Table

- **`recurring_event_instances`**
  - Materialized occurrences for recurring events; used to anchor instance-only items and exceptions.

## Concepts

### Action Item Types

- **Action item**: A task/todo associated with an event (title, description/notes, status, assignees, due date, etc.).
- **Standalone event action item**: Attached directly to a single, non-recurring event.
- **Template (series) action item**: Attached to a recurring event template and inherited by each instance.
- **Instance action item**: Attached to one specific occurrence ("this instance only"). Also called a standalone action item for that instance.
- **Action item exception**: A per-instance override for a template action item (e.g., changed title/status for a particular date, or suppressed/deleted just for that one instance).

## Association

### How Association Works

- **Standalone events**

  - Action items are linked directly to the event. No recurrence logic is involved.

- **Recurring events**
  - Two scopes are supported when creating action items:
    1. Series (template): Create a template action item that applies to all instances by default.
    2. This instance only: Create an instance action item that exists only for the selected occurrence.
  - Reading an instance's action items resolves as:
    - Start with all template action items for the series.
    - Apply any action item exceptions for this specific instance (overrides or suppressions).
    - Add any standalone instance action items.

## Data Access

### Instance Resolution

- Determine baseEventId = instance.baseRecurringEventId (for recurring) or event.id (for standalone).
- Query `actionitems` where:
  - `eventId = baseEventId` (series/template items), OR
  - `recurringEventInstanceId = instance.id` (instance-only items).
- Query `actionitem_exceptions` where `actionId IN (series items)` AND `eventId = instance.id`.
- For each series item:
  - If exception.deleted = true → exclude for this instance.
  - Else override provided fields (completed, notes, assignedAt, volunteer/group/category, assignee).
- Return final list (series-with-overrides + instance-only), then paginate.

## Operations

### Creating and Updating

#### Create

- **Series (template) action item**
  - Attaches to the template; appears on every instance unless overridden/suppressed by an exception.
- **Instance-only action item**
  - Attaches to the selected occurrence; no impact on other dates.

#### Update

- **Update an instance-only action item**
  - Directly updates that single record; no series impact.
- **Update a template action item for this instance only**
  - Creates or updates an action item exception for that instance which overrides the template item (e.g., changed status to Completed, edited notes, adjusted due date).
- **Update a template action item for the entire series**
  - Edits the template record; affects all instances except those with per-instance exceptions for the changed fields.

#### Complete

- **Completing a template action item for this instance only**
  - Records an exception on that instance, setting its status to Completed; other instances remain unchanged.
- **Completing a template action item for the entire series**
  - Marks the template as Completed; instances reflect completion unless an instance has an exception stating otherwise.

#### Delete

- **Delete an instance-only action item**
  - Removes only that occurrence's action item.
- **Delete a template action item for this instance only**
  - Records an exception that suppresses that template action item for the chosen instance (it is treated as deleted only for this date).
- **Delete a template action item for the entire series**
  - Removes the template item; it disappears from all instances except where a per-instance action item (standalone) exists.

#### Series Split

- When a series is split, the new series starts fresh with its own template action items.
- Existing instance-only items and exceptions remain attached to the old instances; no automatic copying of template items to the new series unless explicitly implemented.

## Exception Model

### How Overrides Are Applied

- For any given instance, the resolved action item list is computed by:
  1. Listing all template (series) action items.
  2. Applying per-instance exceptions (overrides/complete/suppress) to those template items.
  3. Adding all instance-only action items.
- This is analogous to how event field exceptions work for recurring instances.

## Backend Implementation

### Data Model Details

Key tables and fields used to associate action items with events and instances:

#### Action Items Table

- **actionitems** (`src/drizzle/tables/actionItems.ts`)
  - eventId: UUID → references `events.id` (recurring template or standalone event)
  - recurringEventInstanceId: UUID → references `recurring_event_instances.id` (instance-only action item)
  - isTemplate: boolean → when true, indicates a series-level (template) action item
  - organizationId, creatorId, updaterId, assignedAt, preCompletionNotes, postCompletionNotes, isCompleted, categoryId, volunteerId, volunteerGroupId

#### Action Item Exceptions Table

- **actionitem_exceptions** (`src/drizzle/tables/actionItemExceptions.ts`)
  - actionId: UUID → references `actionitems.id` (the series-level action item being overridden)
  - eventId: UUID → references `recurring_event_instances.id` (the specific instance where the override applies)
  - Unique(actionId, eventId) → one override per action item per instance
  - Fields mirrored for overrides: assignedAt, preCompletionNotes, postCompletionNotes, completed, deleted, volunteerId, volunteerGroupId, categoryId, assigneeId

#### Recurring Event Instances Table

- **recurring_event_instances** (`src/drizzle/tables/recurringEventInstances.ts`)
  - Holds materialized instances for recurring events, used to scope exceptions and instance-only action items.

### GraphQL Implementation

#### Read Path

Resolver: `src/graphql/types/Event/actionItems.ts`

- For a given Event node (standalone or instance):
  - Determine baseEventId = parent.baseRecurringEventId || parent.id
  - Query actionitems where:
    - eventId = baseEventId (series-level items), OR
    - recurringEventInstanceId = parent.id (instance-only items)
  - Fetch actionitem_exceptions for the current instance: where actionId IN (above) AND eventId = parent.id
  - Apply per-item logic:
    - If exception.deleted = true → exclude this item for this instance
    - Otherwise override fields (completed, assignedAt, notes, volunteer/volunteerGroup/category, etc.)
  - Return paginated list

#### Instance Scope Mutations

- completeActionItemForInstance → sets exception.completed = true and postCompletionNotes
- markActionItemAsPendingForInstance → sets exception.completed = false
- updateActionItemForInstance → upserts instance-specific overrides (assignedAt, preCompletionNotes, volunteer, group, category)
- deleteActionItemForInstance → sets exception.deleted = true (suppresses series item just for this date)

#### Template Scope Mutations

- deleteActionItem → deletes the template action item, after first deleting all its exceptions

## Code References

- **Tables**

  - actionItems: `src/drizzle/tables/actionItems.ts`
  - actionItemExceptions: `src/drizzle/tables/actionItemExceptions.ts`
  - recurringEventInstances: `src/drizzle/tables/recurringEventInstances.ts`

- **Resolvers**

  - Event.actionItems: `src/graphql/types/Event/actionItems.ts`

- **Mutations (instance scope)**

  - completeActionItemForInstance: `src/graphql/types/Mutation/completeActionItemForInstance.ts`
  - markActionItemAsPendingForInstance: `src/graphql/types/Mutation/markActionItemAsPendingForInstance.ts`
  - updateActionItemForInstance: `src/graphql/types/Mutation/updateActionItemForInstance.ts`
  - deleteActionItemForInstance: `src/graphql/types/Mutation/deleteActionItemForInstance.ts`

- **Mutations (template scope)**

  - deleteActionItem: `src/graphql/types/Mutation/deleteActionItem.ts`

- **Mutations (event lifecycle)**
  - deleteSingleEventInstance: `src/graphql/types/Mutation/deleteSingleEventInstance.ts`
  - deleteThisAndFollowingEvents: `src/graphql/types/Mutation/deleteThisAndFollowingEvents.ts`
  - deleteEntireRecurringEventSeries: `src/graphql/types/Mutation/deleteEntireRecurringEventSeries.ts`
