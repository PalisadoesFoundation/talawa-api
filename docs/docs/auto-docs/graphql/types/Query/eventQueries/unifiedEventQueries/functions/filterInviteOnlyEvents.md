[**talawa-api**](../../../../../../README.md)

***

# Function: filterInviteOnlyEvents()

> **filterInviteOnlyEvents**(`input`): `Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:73](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L73)

Filters invite-only events based on visibility rules.
An invite-only event is only visible to:
1. The event creator
2. Organization admins
3. Users explicitly invited to the event

## Parameters

### input

[`FilterInviteOnlyEventsInput`](../interfaces/FilterInviteOnlyEventsInput.md)

The input object containing events and user context.

## Returns

`Promise`\<[`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]\>

- A filtered array of events that the user can view.
