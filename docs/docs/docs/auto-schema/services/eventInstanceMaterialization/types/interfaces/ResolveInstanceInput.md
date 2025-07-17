[Admin Docs](/)

***

# Interface: ResolveInstanceInput

Defined in: [src/services/eventInstanceMaterialization/types.ts:56](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/services/eventInstanceMaterialization/types.ts#L56)

Input for resolving instance with inheritance

## Properties

### baseTemplate

> **baseTemplate**: `object`

Defined in: [src/services/eventInstanceMaterialization/types.ts:58](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/services/eventInstanceMaterialization/types.ts#L58)

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

### exception?

> `optional` **exception**: `object`

Defined in: [src/services/eventInstanceMaterialization/types.ts:59](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/services/eventInstanceMaterialization/types.ts#L59)

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

### materializedInstance

> **materializedInstance**: `object`

Defined in: [src/services/eventInstanceMaterialization/types.ts:57](https://github.com/gautam-divyanshu/talawa-api/blob/1d38acecd3e456f869683fb8dca035a5e42010d5/src/services/eventInstanceMaterialization/types.ts#L57)

#### actualEndTime

> **actualEndTime**: `Date`

#### actualStartTime

> **actualStartTime**: `Date`

#### baseRecurringEventId

> **baseRecurringEventId**: `string`

#### id

> **id**: `string`

#### isCancelled

> **isCancelled**: `boolean`

#### lastUpdatedAt

> **lastUpdatedAt**: `Date`

#### materializedAt

> **materializedAt**: `Date`

#### organizationId

> **organizationId**: `string`

#### originalInstanceStartTime

> **originalInstanceStartTime**: `Date`

#### recurrenceRuleId

> **recurrenceRuleId**: `string`

#### sequenceNumber

> **sequenceNumber**: `number`

#### totalCount

> **totalCount**: `number`

#### version

> **version**: `string`
