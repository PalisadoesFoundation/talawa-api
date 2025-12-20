[API Docs](/)

***

# Function: buildRRuleString()

> **buildRRuleString**(`recurrence`, `_startDate`): `string`

Defined in: [src/utilities/recurringEventHelpers.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/recurringEventHelpers.ts#L14)

Converts a recurrence input object into an RRULE string compliant with RFC 5545.
This function constructs a recurrence rule string based on the provided frequency,
interval, end date, count, and other recurrence properties.

## Parameters

### recurrence

The recurrence input object, conforming to the recurrenceInputSchema.

#### byDay?

`string`[] = `...`

#### byMonth?

`number`[] = `...`

#### byMonthDay?

`number`[] = `...`

#### count?

`number` = `...`

#### endDate?

`Date` = `...`

#### frequency

`"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"` = `recurrenceFrequencyEnum`

#### interval?

`number` = `...`

#### never?

`boolean` = `...`

### \_startDate

`Date`

## Returns

`string`

A full RRULE string, e.g., "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR".
