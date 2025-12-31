[API Docs](/)

***

# Function: validateRecurrenceInput()

> **validateRecurrenceInput**(`recurrence`, `startDate`): `object`

Defined in: [src/utilities/recurringEvent/validation.ts:15](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/recurringEvent/validation.ts#L15)

Validates the recurrence input object against a set of rules to ensure its correctness.
This function checks for logical consistency, such as ensuring the end date is after the
start date, and validates the format of values like day codes and month numbers.

## Parameters

### recurrence

The recurrence input object to validate.

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

### startDate

`Date`

The start date of the event, used for validation against the end date.

## Returns

`object`

- An object containing a boolean `isValid` and an array of error strings.
         If `isValid` is true, the `errors` array will be empty.

### errors

> **errors**: `string`[]

### isValid

> **isValid**: `boolean`
