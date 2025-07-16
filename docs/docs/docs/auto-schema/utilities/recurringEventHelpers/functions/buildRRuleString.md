[Admin Docs](/)

***

# Function: buildRRuleString()

> **buildRRuleString**(`recurrence`, `startDate`): `string`

Defined in: [src/utilities/recurringEventHelpers.ts:7](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/utilities/recurringEventHelpers.ts#L7)

Converts recurrence input to RRULE string following RFC 5545

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

`string`
