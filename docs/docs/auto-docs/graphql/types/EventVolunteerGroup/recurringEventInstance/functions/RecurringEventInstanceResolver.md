[API Docs](/)

***

# Function: RecurringEventInstanceResolver()

> **RecurringEventInstanceResolver**(`parent`, `_args`, `ctx`): `Promise`\<`null` \| \{ `actualEndTime`: `Date`; `actualStartTime`: `Date`; `allDay`: `boolean`; `attachments`: `never`[]; `baseRecurringEventId`: `string`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `description`: `null` \| `string`; `endAt`: `Date`; `generatedAt`: `Date`; `id`: `string`; `isCancelled`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `lastUpdatedAt`: `null` \| `Date`; `location`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; `originalInstanceStartTime`: `Date`; `originalSeriesId`: `string`; `recurrenceRuleId`: `string`; `sequenceNumber`: `number`; `startAt`: `Date`; `totalCount`: `null` \| `number`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; `version`: `string`; \}\>

Defined in: [src/graphql/types/EventVolunteerGroup/recurringEventInstance.ts:6](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/EventVolunteerGroup/recurringEventInstance.ts#L6)

## Parameters

### parent

[`EventVolunteerGroup`](../../EventVolunteerGroup/type-aliases/EventVolunteerGroup.md)

### \_args

`Record`\<`string`, `never`\>

### ctx

[`GraphQLContext`](../../../../context/type-aliases/GraphQLContext.md)

## Returns

`Promise`\<`null` \| \{ `actualEndTime`: `Date`; `actualStartTime`: `Date`; `allDay`: `boolean`; `attachments`: `never`[]; `baseRecurringEventId`: `string`; `createdAt`: `Date`; `creatorId`: `null` \| `string`; `description`: `null` \| `string`; `endAt`: `Date`; `generatedAt`: `Date`; `id`: `string`; `isCancelled`: `boolean`; `isPublic`: `boolean`; `isRecurringEventTemplate`: `boolean`; `isRegisterable`: `boolean`; `lastUpdatedAt`: `null` \| `Date`; `location`: `null` \| `string`; `name`: `string`; `organizationId`: `string`; `originalInstanceStartTime`: `Date`; `originalSeriesId`: `string`; `recurrenceRuleId`: `string`; `sequenceNumber`: `number`; `startAt`: `Date`; `totalCount`: `null` \| `number`; `updatedAt`: `null` \| `Date`; `updaterId`: `null` \| `string`; `version`: `string`; \}\>
