[Admin Docs](/)

***

# Function: getStandaloneEventsInDateRange()

> **getStandaloneEventsInDateRange**(`input`, `drizzleClient`, `logger`): `Promise`\<`object` & `object`[]\>

Defined in: [src/graphql/types/Query/eventQueries/standaloneEventQueries.ts:20](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/graphql/types/Query/eventQueries/standaloneEventQueries.ts#L20)

Gets standalone events (non-recurring events) for an organization within a date range.
This includes:
- Regular standalone events (isRecurringTemplate: false, recurringEventId: null)
- Does NOT include recurring templates or materialized instances

## Parameters

### input

[`GetStandaloneEventsInput`](../interfaces/GetStandaloneEventsInput.md)

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../../../drizzle/schema/README.md)\>

### logger

`FastifyBaseLogger`

## Returns

`Promise`\<`object` & `object`[]\>
