---
id: volunteers
title: Event Volunteers and Volunteer Groups
slug: /developer-resources/volunteers
sidebar_position: 30
---

# Event Volunteers and Volunteer Groups

This guide explains how individual volunteers, volunteer groups, and memberships work for events in Talawa, including recurring series behavior.

## Overview

### Key Concepts

- Two attachment scopes for recurring events:
  - **Entire series (template)**: volunteer/group applies to every instance unless explicitly excluded for specific dates.
  - **This instance only**: volunteer/group exists only for one occurrence.
- Per-instance removal uses "exceptions" rows rather than deleting the series record.

## Data Model

### Tables Overview

Tables in talawa-api (Drizzle ORM):

#### Event Volunteers Table

- **`event_volunteers`**
  - One row per user volunteering for an event context.
  - Template volunteer (series-wide): `eventId` = base template event id, `isTemplate = true`, `recurringEventInstanceId = null`.
  - Instance-only volunteer: `eventId` = base template event id, `isTemplate = false`, `recurringEventInstanceId = instance id`.
  - Other fields: `hasAccepted`, `isPublic`, `hoursVolunteered`, `creatorId`, `updaterId`.
  - Unique(userId, eventId, recurringEventInstanceId) prevents duplicates across series vs one instance.

#### Event Volunteer Groups Table

- **`event_volunteer_groups`**
  - Volunteer group definition for an event context.
  - Template group (series-wide): `eventId` = base template event id, `isTemplate = true`, `recurringEventInstanceId = null`.
  - Instance-only group: `eventId` = base template event id, `isTemplate = false`, `recurringEventInstanceId = instance id`.
  - Other fields: `leaderId`, `name`, `description`, `volunteersRequired`, `creatorId`, `updaterId`.
  - Unique(eventId, name, recurringEventInstanceId) prevents name collisions per instance.

#### Event Volunteer Memberships Table

- **`event_volunteer_memberships`**
  - Connects an EventVolunteer to an optional EventVolunteerGroup for an event.
  - Fields: `volunteerId`, `groupId` (nullable for individual volunteers), `eventId`, `status` (invited/requested/accepted/rejected), audit fields.
  - Unique(volunteerId, groupId, eventId).
  - Note: in create requests, `eventId` is stored as provided (instance or template) to support admin requests UI; the volunteer row itself is linked to the base event id.

#### Exceptions Tables

- **event_volunteer_exceptions**: unique(volunteerId, recurringEventInstanceId). Marks a template volunteer as "excluded" on a specific instance.
- **event_volunteer_group_exceptions**: unique(volunteerGroupId, recurringEventInstanceId). Marks a template group as "excluded" on a specific instance.

#### Recurring Event Instances Table

- **`recurring_event_instances`**
  - Materialized occurrences for recurring events; anchor for instance-only volunteers/groups and per-instance exceptions.

## Concepts

### Core Concepts

- **Event Volunteer**: a user attached to an event series or a single occurrence.
- **Volunteer Group**: a named group with a leader, optionally with a target number of volunteers required.
- **Volunteer Membership**: the relationship (with status) between a volunteer and a group and/or event; supports invitations and requests.
- **Template (series-wide)**: applies automatically to every past/present/future instance unless excluded by an exception for a specific date.
- **Instance-only**: exists only for a single occurrence.
- **Exception**: per-instance exclusion record that hides a template volunteer/group from one occurrence.

## Data Access

### Instance Resolution

- Determine baseEventId = instance.baseRecurringEventId (for recurring) or event.id (for standalone).
- **Volunteers for a recurring instance**:
  - Query `event_volunteers` where `eventId = baseEventId` (template volunteers) OR `recurringEventInstanceId = instance.id` (instance-only volunteers).
  - Query `event_volunteer_exceptions` where `recurringEventInstanceId = instance.id` and exclude those volunteer IDs from the template set.
- **Volunteer groups for a recurring instance**:
  - Query `event_volunteer_groups` where `eventId = baseEventId` (template groups) OR `recurringEventInstanceId = instance.id` (instance-only groups).
  - Query `event_volunteer_group_exceptions` where `recurringEventInstanceId = instance.id` and exclude those group IDs from the template set.
- For standalone events, simply query by `eventId = event.id` and ignore exceptions/instances.

## Operations

### Creating and Updating

#### Volunteers

- **Create**
  - `createEventVolunteer` supports a `scope`:
    - ENTIRE_SERIES → create or reuse a template volunteer (`isTemplate=true`, `recurringEventInstanceId=null`), converts/removes prior instance-only duplicates for the same user/event.
    - THIS_INSTANCE_ONLY → create an instance-only volunteer for `recurringEventInstanceId`.
- **Update**
  - `updateEventVolunteer` updates fields such as `hasAccepted`, `isPublic` for the specific volunteer row (template or instance-only).
- **Delete**
  - Entire row: `deleteEventVolunteer` removes the volunteer and cascades memberships.
  - For one instance of a template volunteer: `deleteEventVolunteerForInstance` upserts an exception row to exclude only that date; the template volunteer remains for all other dates.

#### Volunteer Groups

- **Create**
  - `createEventVolunteerGroup` supports a `scope`:
    - ENTIRE_SERIES → create or reuse a template group (`isTemplate=true`), converts/removes prior instance-only duplicates with same name.
    - THIS_INSTANCE_ONLY → create an instance-only group for `recurringEventInstanceId`.
  - Optional `volunteerUserIds` allows inviting/creating volunteers and adding memberships to the new group, matching old API behavior.
- **Update**
  - `updateEventVolunteerGroup` updates name/description/volunteersRequired; checks for name conflicts within the same event context.
- **Delete**
  - Entire row: `deleteEventVolunteerGroup` removes the group and cascades its memberships.
  - For one instance of a template group: `deleteEventVolunteerGroupForInstance` upserts an exception row to exclude only that date; the template group remains for other dates.

#### Volunteer Memberships

- **Create**
  - `createVolunteerMembership` creates a membership with `status` (invited/requested/accepted/rejected).
  - If no `EventVolunteer` exists yet for the user + base event, it creates one (template vs instance-only determined by `scope` and `recurringEventInstanceId`).
  - Stores `eventId` as provided (instance or template) to support admin review screens.
- **Update**
  - `updateVolunteerMembership` updates the `status`. If accepted, the linked `EventVolunteer.hasAccepted` is synced appropriately.

## Code References

- **Tables**

  - eventVolunteers: `src/drizzle/tables/eventVolunteers.ts`
  - eventVolunteerGroups: `src/drizzle/tables/eventVolunteerGroups.ts`
  - eventVolunteerMemberships: `src/drizzle/tables/eventVolunteerMemberships.ts`
  - eventVolunteerExceptions: `src/drizzle/tables/eventVolunteerExceptions.ts`
  - eventVolunteerGroupExceptions: `src/drizzle/tables/eventVolunteerGroupExceptions.ts`
  - recurringEventInstances: `src/drizzle/tables/recurringEventInstances.ts`

- **Resolvers (read path)**

  - Event.volunteers: `src/graphql/types/Event/volunteers.ts`
  - Event.volunteerGroups: `src/graphql/types/Event/volunteerGroups.ts`

- **Mutations (volunteers)**

  - createEventVolunteer: `src/graphql/types/Mutation/createEventVolunteer.ts`
  - updateEventVolunteer: `src/graphql/types/Mutation/updateEventVolunteer.ts`
  - deleteEventVolunteer: `src/graphql/types/Mutation/deleteEventVolunteer.ts`
  - deleteEventVolunteerForInstance: `src/graphql/types/Mutation/deleteEventVolunteerForInstance.ts`

- **Mutations (volunteer groups)**

  - createEventVolunteerGroup: `src/graphql/types/Mutation/createEventVolunteerGroup.ts`
  - updateEventVolunteerGroup: `src/graphql/types/Mutation/updateEventVolunteerGroup.ts`
  - deleteEventVolunteerGroup: `src/graphql/types/Mutation/deleteEventVolunteerGroup.ts`
  - deleteEventVolunteerGroupForInstance: `src/graphql/types/Mutation/deleteEventVolunteerGroupForInstance.ts`

- **Mutations (memberships)**
  - createVolunteerMembership: `src/graphql/types/Mutation/createVolunteerMembership.ts`
  - updateVolunteerMembership: `src/graphql/types/Mutation/updateVolunteerMembership.ts`
