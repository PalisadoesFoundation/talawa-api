[Admin Docs](/)

***

# Interface: OccurrenceCalculationConfig

Defined in: [src/services/eventGeneration/types.ts:33](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/services/eventGeneration/types.ts#L33)

Configuration for occurrence calculation

## Properties

### baseEvent

> **baseEvent**: `object`

Defined in: [src/services/eventGeneration/types.ts:35](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/services/eventGeneration/types.ts#L35)

#### allDay

> **allDay**: `boolean`

#### createdAt

> **createdAt**: `Date`

#### creatorId

> **creatorId**: `null` \| `string`

#### description

> **description**: `null` \| `string`

#### endAt

> **endAt**: `Date`

#### id

> **id**: `string`

#### isPublic

> **isPublic**: `boolean`

#### isRecurringEventTemplate

> **isRecurringEventTemplate**: `boolean`

#### isRegisterable

> **isRegisterable**: `boolean`

#### location

> **location**: `null` \| `string`

#### name

> **name**: `string`

#### organizationId

> **organizationId**: `string`

#### startAt

> **startAt**: `Date`

#### updatedAt

> **updatedAt**: `null` \| `Date`

#### updaterId

> **updaterId**: `null` \| `string`

***

### exceptions

> **exceptions**: `object`[]

Defined in: [src/services/eventGeneration/types.ts:38](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/services/eventGeneration/types.ts#L38)

#### createdAt

> **createdAt**: `Date`

#### creatorId

> **creatorId**: `string`

#### exceptionData

> **exceptionData**: `unknown`

#### id

> **id**: `string`

#### organizationId

> **organizationId**: `string`

#### recurringEventInstanceId

> **recurringEventInstanceId**: `string`

#### updatedAt

> **updatedAt**: `null` \| `Date`

#### updaterId

> **updaterId**: `null` \| `string`

***

### recurrenceRule

> **recurrenceRule**: `object`

Defined in: [src/services/eventGeneration/types.ts:34](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/services/eventGeneration/types.ts#L34)

#### baseRecurringEventId

> **baseRecurringEventId**: `string`

#### byDay

> **byDay**: `null` \| `string`[]

#### byMonth

> **byMonth**: `null` \| `number`[]

#### byMonthDay

> **byMonthDay**: `null` \| `number`[]

#### count

> **count**: `null` \| `number`

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

> **originalSeriesId**: `null` \| `string`

#### recurrenceEndDate

> **recurrenceEndDate**: `null` \| `Date`

#### recurrenceRuleString

> **recurrenceRuleString**: `string`

#### recurrenceStartDate

> **recurrenceStartDate**: `Date`

#### updatedAt

> **updatedAt**: `null` \| `Date`

#### updaterId

> **updaterId**: `null` \| `string`

***

### windowEnd

> **windowEnd**: `Date`

Defined in: [src/services/eventGeneration/types.ts:37](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/services/eventGeneration/types.ts#L37)

***

### windowStart

> **windowStart**: `Date`

Defined in: [src/services/eventGeneration/types.ts:36](https://github.com/Sourya07/talawa-api/blob/aac5f782223414da32542752c1be099f0b872196/src/services/eventGeneration/types.ts#L36)
