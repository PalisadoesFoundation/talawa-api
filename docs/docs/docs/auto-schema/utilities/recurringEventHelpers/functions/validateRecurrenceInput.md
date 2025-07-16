[Admin Docs](/)

***

# Function: validateRecurrenceInput()

> **validateRecurrenceInput**(`recurrence`, `startDate`): `object`

Defined in: [src/utilities/recurringEventHelpers.ts:230](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/recurringEventHelpers.ts#L230)

Validates recurrence input

## Parameters

### recurrence

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

## Returns

`object`

### errors

> **errors**: `string`[]

### isValid

> **isValid**: `boolean`
