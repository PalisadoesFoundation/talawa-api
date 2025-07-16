[Admin Docs](/)

***

# Function: buildRRuleString()

> **buildRRuleString**(`recurrence`, `startDate`): `string`

Defined in: [src/utilities/recurringEventHelpers.ts:28](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/utilities/recurringEventHelpers.ts#L28)

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
