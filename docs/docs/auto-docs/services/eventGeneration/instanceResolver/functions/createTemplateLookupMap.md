[API Docs](/)

***

# Function: createTemplateLookupMap()

> **createTemplateLookupMap**(`templates`): `Map`\<`string`, \{ `allDay`: `boolean`; `attachmentsPolicy`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `recurrenceRule`: `string` \| `null`; `recurrenceUntil`: `Date` \| `null`; `startAt`: `Date`; `timezone`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>

Defined in: [src/services/eventGeneration/instanceResolver.ts:244](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/services/eventGeneration/instanceResolver.ts#L244)

Creates a lookup map for event templates to enable efficient batch processing.
The map is keyed by the event template ID.

## Parameters

### templates

`object`[]

An array of event templates.

## Returns

`Map`\<`string`, \{ `allDay`: `boolean`; `attachmentsPolicy`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `id`: `string`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `recurrenceRule`: `string` \| `null`; `recurrenceUntil`: `Date` \| `null`; `startAt`: `Date`; `timezone`: `string`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; \}\>

- A map of templates, keyed by their IDs.
