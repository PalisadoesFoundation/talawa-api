[Admin Docs](/)

***

# Interface: OccurrenceCalculationConfig

Defined in: [src/services/eventInstanceMaterialization/types.ts:33](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/services/eventInstanceMaterialization/types.ts#L33)

Configuration for occurrence calculation

## Properties

### baseEvent

> **baseEvent**: `object`

Defined in: [src/services/eventInstanceMaterialization/types.ts:35](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/services/eventInstanceMaterialization/types.ts#L35)

#### allDay

> **allDay**: `boolean`

#### createdAt

> **createdAt**: `Date`

#### creatorId

> **creatorId**: `string`

#### description

> **description**: `string`

#### endAt

> **endAt**: `Date`

#### id

> **id**: `string`

#### instanceStartTime

> **instanceStartTime**: `Date`

#### isPublic

> **isPublic**: `boolean`

#### isRecurringTemplate

> **isRecurringTemplate**: `boolean`

#### isRegisterable

> **isRegisterable**: `boolean`

#### location

> **location**: `string`

#### name

> **name**: `string`

#### organizationId

> **organizationId**: `string`

#### recurringEventId

> **recurringEventId**: `string`

#### startAt

> **startAt**: `Date`

#### updatedAt

> **updatedAt**: `Date`

#### updaterId

> **updaterId**: `string`

***

### exceptions

> **exceptions**: `object`[]

Defined in: [src/services/eventInstanceMaterialization/types.ts:38](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/services/eventInstanceMaterialization/types.ts#L38)

#### createdAt

> **createdAt**: `Date`

#### creatorId

> **creatorId**: `string`

#### eventInstanceId

> **eventInstanceId**: `string`

#### exceptionData

> **exceptionData**: `unknown`

#### exceptionType

> **exceptionType**: `"SINGLE_INSTANCE"` \| `"THIS_AND_FUTURE"`

#### id

> **id**: `string`

#### instanceStartTime

> **instanceStartTime**: `Date`

#### organizationId

> **organizationId**: `string`

#### recurringEventId

> **recurringEventId**: `string`

#### updatedAt

> **updatedAt**: `Date`

#### updaterId

> **updaterId**: `string`

***

### recurrenceRule

> **recurrenceRule**: `object`

Defined in: [src/services/eventInstanceMaterialization/types.ts:34](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/services/eventInstanceMaterialization/types.ts#L34)

#### baseRecurringEventId

> **baseRecurringEventId**: `string`

#### byDay

> **byDay**: `string`[]

#### byMonth

> **byMonth**: `number`[]

#### byMonthDay

> **byMonthDay**: `number`[]

#### count

> **count**: `number`

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

#### recurrenceEndDate

> **recurrenceEndDate**: `Date`

#### recurrenceRuleString

> **recurrenceRuleString**: `string`

#### recurrenceStartDate

> **recurrenceStartDate**: `Date`

#### updatedAt

> **updatedAt**: `Date`

#### updaterId

> **updaterId**: `string`

***

### windowEnd

> **windowEnd**: `Date`

Defined in: [src/services/eventInstanceMaterialization/types.ts:37](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/services/eventInstanceMaterialization/types.ts#L37)

***

### windowStart

> **windowStart**: `Date`

Defined in: [src/services/eventInstanceMaterialization/types.ts:36](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/services/eventInstanceMaterialization/types.ts#L36)
