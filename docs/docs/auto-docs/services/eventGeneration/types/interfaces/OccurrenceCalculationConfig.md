[API Docs](/)

***

# Interface: OccurrenceCalculationConfig

Defined in: src/services/eventGeneration/types.ts:33

Configuration for occurrence calculation

## Properties

### baseEvent

> **baseEvent**: `object`

Defined in: src/services/eventGeneration/types.ts:35

#### allDay

> **allDay**: `boolean`

#### createdAt

> **createdAt**: `Date`

#### creatorId

> **creatorId**: `string` \| `null`

#### description

> **description**: `string` \| `null`

#### endAt

> **endAt**: `Date`

#### id

> **id**: `string`

#### isInviteOnly

> **isInviteOnly**: `boolean`

#### isPublic

> **isPublic**: `boolean`

#### isRecurringEventTemplate

> **isRecurringEventTemplate**: `boolean`

#### isRegisterable

> **isRegisterable**: `boolean`

#### location

> **location**: `string` \| `null`

#### name

> **name**: `string`

#### organizationId

> **organizationId**: `string`

#### startAt

> **startAt**: `Date`

#### updatedAt

> **updatedAt**: `Date` \| `null`

#### updaterId

> **updaterId**: `string` \| `null`

***

### exceptions

> **exceptions**: `object`[]

Defined in: src/services/eventGeneration/types.ts:38

#### createdAt

> **createdAt**: `Date`

#### creatorId

> **creatorId**: `string` \| `null`

#### exceptionData

> **exceptionData**: `unknown`

#### id

> **id**: `string`

#### organizationId

> **organizationId**: `string`

#### recurringEventInstanceId

> **recurringEventInstanceId**: `string`

#### updatedAt

> **updatedAt**: `Date` \| `null`

#### updaterId

> **updaterId**: `string` \| `null`

***

### recurrenceRule

> **recurrenceRule**: `object`

Defined in: src/services/eventGeneration/types.ts:34

#### baseRecurringEventId

> **baseRecurringEventId**: `string`

#### byDay

> **byDay**: `string`[] \| `null`

#### byMonth

> **byMonth**: `number`[] \| `null`

#### byMonthDay

> **byMonthDay**: `number`[] \| `null`

#### count

> **count**: `number` \| `null`

#### createdAt

> **createdAt**: `Date`

#### creatorId

> **creatorId**: `string`

#### frequency

> **frequency**: `"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`

#### id

> **id**: `string`

#### interval

> **interval**: `number`

#### latestInstanceDate

> **latestInstanceDate**: `Date`

#### organizationId

> **organizationId**: `string`

#### originalSeriesId

> **originalSeriesId**: `string` \| `null`

#### recurrenceEndDate

> **recurrenceEndDate**: `Date` \| `null`

#### recurrenceRuleString

> **recurrenceRuleString**: `string`

#### recurrenceStartDate

> **recurrenceStartDate**: `Date`

#### updatedAt

> **updatedAt**: `Date` \| `null`

#### updaterId

> **updaterId**: `string` \| `null`

***

### windowEnd

> **windowEnd**: `Date`

Defined in: src/services/eventGeneration/types.ts:37

***

### windowStart

> **windowStart**: `Date`

Defined in: src/services/eventGeneration/types.ts:36
