[Admin Docs](/)

***

# Function: shouldGenerateInstanceAtDate()

> **shouldGenerateInstanceAtDate**(`date`, `recurrenceRule`, `startDate`): `boolean`

Defined in: [src/services/eventInstanceMaterialization/occurrenceCalculator.ts:189](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/services/eventInstanceMaterialization/occurrenceCalculator.ts#L189)

Determines if an instance should be generated at the given date.
Handles never-ending events and complex monthly patterns properly.

## Parameters

### date

`Date`

### recurrenceRule

#### baseRecurringEventId

`string`

#### byDay

`string`[]

#### byMonth

`number`[]

#### byMonthDay

`number`[]

#### count

`number`

#### createdAt

`Date`

#### creatorId

`string`

#### frequency

`"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`

#### id

`string`

#### interval

`number`

#### latestInstanceDate

`Date`

#### organizationId

`string`

#### recurrenceEndDate

`Date`

#### recurrenceRuleString

`string`

#### recurrenceStartDate

`Date`

#### updatedAt

`Date`

#### updaterId

`string`

### startDate

`Date`

## Returns

`boolean`
