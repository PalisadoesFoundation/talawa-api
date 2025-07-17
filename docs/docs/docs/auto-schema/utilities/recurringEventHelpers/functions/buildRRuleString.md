[Admin Docs](/)

***

# Function: buildRRuleString()

> **buildRRuleString**(`recurrence`, `startDate`): `string`

Defined in: [src/utilities/recurringEventHelpers.ts:14](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/utilities/recurringEventHelpers.ts#L14)

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

#### frequency?

`"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"` = `frequencyEnum`

#### interval?

`number` = `...`

#### never?

`boolean` = `...`

### startDate

`Date`

The start date of the event, used for validation and context.

## Returns

`string`

A full RRULE string, e.g., "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR".
