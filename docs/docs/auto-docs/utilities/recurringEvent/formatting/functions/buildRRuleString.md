[API Docs](/)

***

# Function: buildRRuleString()

> **buildRRuleString**(`params`): `string`

Defined in: [src/utilities/recurringEvent/formatting.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/recurringEvent/formatting.ts#L14)

Converts a recurrence input object into an RRULE string compliant with RFC 5545.
This function constructs a recurrence rule string based on the provided frequency,
interval, end date, count, and other recurrence properties.

## Parameters

### params

`object` & `object`

An object containing:
  - recurrence properties from recurrenceInputSchema (frequency, interval, byDay, etc.)
  - startDate: Date required for RRULE anchor calculations.

## Returns

`string`

- A full RRULE string, e.g., "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,FR".
