[API Docs](/)

***

# Function: RecurringEventInstanceResolver()

> **RecurringEventInstanceResolver**(`parent`, `_args`, `ctx`): `Promise`\<\{ `actualEndTime`: `Date`; `actualStartTime`: `Date`; `allDay`: `boolean`; `attachments`: `never`[]; `baseRecurringEventId`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `generatedAt`: `Date`; `id`: `string`; `isCancelled`: `boolean`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `lastUpdatedAt`: `Date` \| `null`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `originalInstanceStartTime`: `Date`; `originalSeriesId`: `string`; `recurrenceRuleId`: `string`; `sequenceNumber`: `number`; `startAt`: `Date`; `totalCount`: `number` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `version`: `string`; \} \| `null`\>

Defined in: [src/graphql/types/EventVolunteer/recurringEventInstance.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/EventVolunteer/recurringEventInstance.ts#L6)

## Parameters

### parent

[`EventVolunteer`](../../EventVolunteer/type-aliases/EventVolunteer.md)

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `actualEndTime`: `Date`; `actualStartTime`: `Date`; `allDay`: `boolean`; `attachments`: `never`[]; `baseRecurringEventId`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date`; `generatedAt`: `Date`; `id`: `string`; `isCancelled`: `boolean`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `lastUpdatedAt`: `Date` \| `null`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `originalInstanceStartTime`: `Date`; `originalSeriesId`: `string`; `recurrenceRuleId`: `string`; `sequenceNumber`: `number`; `startAt`: `Date`; `totalCount`: `number` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `version`: `string`; \} \| `null`\>
