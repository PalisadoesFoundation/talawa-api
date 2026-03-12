[API Docs](/)

***

# Function: RecurringEventInstanceResolver()

> **RecurringEventInstanceResolver**(`parent`, `_args`, `ctx`): `Promise`\<\{ `actualEndDate`: `string` \| `null`; `actualEndTime`: `Date` \| `null`; `actualStartDate`: `string` \| `null`; `actualStartTime`: `Date` \| `null`; `allDay`: `boolean`; `attachments`: `never`[]; `baseRecurringEventId`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date` \| `null`; `endDate`: `string` \| `null`; `generatedAt`: `Date`; `id`: `string`; `isCancelled`: `boolean`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `lastUpdatedAt`: `Date` \| `null`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `originalInstanceStartDate`: `string` \| `null`; `originalInstanceStartTime`: `Date` \| `null`; `originalSeriesId`: `string`; `recurrenceRuleId`: `string`; `sequenceNumber`: `number`; `startAt`: `Date` \| `null`; `startDate`: `string` \| `null`; `totalCount`: `number` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `version`: `string`; \} \| `null`\>

Defined in: [src/graphql/types/EventVolunteerGroup/recurringEventInstance.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/EventVolunteerGroup/recurringEventInstance.ts#L6)

## Parameters

### parent

[`EventVolunteerGroup`](../../EventVolunteerGroup/type-aliases/EventVolunteerGroup.md)

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<\{ `actualEndDate`: `string` \| `null`; `actualEndTime`: `Date` \| `null`; `actualStartDate`: `string` \| `null`; `actualStartTime`: `Date` \| `null`; `allDay`: `boolean`; `attachments`: `never`[]; `baseRecurringEventId`: `string`; `createdAt`: `Date`; `creatorId`: `string` \| `null`; `description`: `string` \| `null`; `endAt`: `Date` \| `null`; `endDate`: `string` \| `null`; `generatedAt`: `Date`; `id`: `string`; `isCancelled`: `boolean`; `isInviteOnly`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `lastUpdatedAt`: `Date` \| `null`; `location`: `string` \| `null`; `name`: `string`; `organizationId`: `string`; `originalInstanceStartDate`: `string` \| `null`; `originalInstanceStartTime`: `Date` \| `null`; `originalSeriesId`: `string`; `recurrenceRuleId`: `string`; `sequenceNumber`: `number`; `startAt`: `Date` \| `null`; `startDate`: `string` \| `null`; `totalCount`: `number` \| `null`; `updatedAt`: `Date` \| `null`; `updaterId`: `string` \| `null`; `version`: `string`; \} \| `null`\>
