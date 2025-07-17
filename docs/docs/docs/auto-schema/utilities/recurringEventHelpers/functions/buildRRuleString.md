[Admin Docs](/)

***

# Function: buildRRuleString()

> **buildRRuleString**(`recurrence`, `startDate`): `string`

Defined in: [src/utilities/recurringEventHelpers.ts:8](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/utilities/recurringEventHelpers.ts#L8)

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
