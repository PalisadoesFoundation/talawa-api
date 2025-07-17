[Admin Docs](/)

***

# Function: validateRecurrenceInput()

> **validateRecurrenceInput**(`recurrence`, `startDate`): `object`

Defined in: [src/utilities/recurringEventHelpers.ts:65](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/utilities/recurringEventHelpers.ts#L65)

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

#### frequency?

`"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"` = `frequencyEnum`

#### interval?

`number` = `...`

#### never?

`boolean` = `...`

### startDate

`Date`

The start date of the event, used for validation against the end date.

## Returns

`object`

An object containing a boolean `isValid` and an array of error strings.
         If `isValid` is true, the `errors` array will be empty.

### errors

> **errors**: `string`[]

### isValid

> **isValid**: `boolean`
