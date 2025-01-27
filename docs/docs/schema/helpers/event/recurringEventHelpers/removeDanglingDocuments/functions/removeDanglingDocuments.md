[**talawa-api**](../../../../../README.md)

***

# Function: removeDanglingDocuments()

> **removeDanglingDocuments**(`recurrenceRuleId`, `baseRecurringEventId`, `session`): `Promise`\<`void`\>

Removes dangling recurrence rule and base recurring event documents if they have no associated events.

## Parameters

### recurrenceRuleId

`string`

_id of the recurrence rule.

### baseRecurringEventId

`string`

_id of the base recurring event.

### session

`ClientSession`

Mongoose client session.

## Returns

`Promise`\<`void`\>

## Remarks

The function first checks if there are any associated events for each document.
If no associated events are found, it deletes the document from the database.

## Defined in

[src/helpers/event/recurringEventHelpers/removeDanglingDocuments.ts:13](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/helpers/event/recurringEventHelpers/removeDanglingDocuments.ts#L13)
