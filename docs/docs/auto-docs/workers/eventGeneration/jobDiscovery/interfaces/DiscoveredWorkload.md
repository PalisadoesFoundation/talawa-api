[**talawa-api**](../../../../README.md)

***

# Interface: DiscoveredWorkload

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:25](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/workers/eventGeneration/jobDiscovery.ts#L25)

Represents a discovered workload for a single organization, including all
recurring events that require EventGeneration.

## Properties

### estimatedDurationMs

> **estimatedDurationMs**: `number`

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:37](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/workers/eventGeneration/jobDiscovery.ts#L37)

***

### organizationId

> **organizationId**: `string`

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:26](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/workers/eventGeneration/jobDiscovery.ts#L26)

***

### priority

> **priority**: `number`

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:36](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/workers/eventGeneration/jobDiscovery.ts#L36)

***

### recurringEvents

> **recurringEvents**: `object`[]

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:28](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/workers/eventGeneration/jobDiscovery.ts#L28)

#### estimatedInstances

> **estimatedInstances**: `number`

#### eventId

> **eventId**: `string`

#### eventName

> **eventName**: `string`

#### isNeverEnding

> **isNeverEnding**: `boolean`

#### recurrenceRule

> **recurrenceRule**: `object`

##### recurrenceRule.baseRecurringEventId

> **baseRecurringEventId**: `string`

##### recurrenceRule.byDay

> **byDay**: `string`[] \| `null`

##### recurrenceRule.byMonth

> **byMonth**: `number`[] \| `null`

##### recurrenceRule.byMonthDay

> **byMonthDay**: `number`[] \| `null`

##### recurrenceRule.count

> **count**: `number` \| `null`

##### recurrenceRule.createdAt

> **createdAt**: `Date`

##### recurrenceRule.creatorId

> **creatorId**: `string`

##### recurrenceRule.frequency

> **frequency**: `"DAILY"` \| `"WEEKLY"` \| `"MONTHLY"` \| `"YEARLY"`

##### recurrenceRule.id

> **id**: `string`

##### recurrenceRule.interval

> **interval**: `number`

##### recurrenceRule.latestInstanceDate

> **latestInstanceDate**: `Date`

##### recurrenceRule.organizationId

> **organizationId**: `string`

##### recurrenceRule.originalSeriesId

> **originalSeriesId**: `string` \| `null`

##### recurrenceRule.recurrenceEndDate

> **recurrenceEndDate**: `Date` \| `null`

##### recurrenceRule.recurrenceRuleString

> **recurrenceRuleString**: `string`

##### recurrenceRule.recurrenceStartDate

> **recurrenceStartDate**: `Date`

##### recurrenceRule.updatedAt

> **updatedAt**: `Date` \| `null`

##### recurrenceRule.updaterId

> **updaterId**: `string` \| `null`

#### ruleId

> **ruleId**: `string`

***

### windowConfig

> **windowConfig**: `object`

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:27](https://github.com/avinxshKD/talawa-api/blob/d546483f2198a0a1a77eb1a770c24fa474a2fb9c/src/workers/eventGeneration/jobDiscovery.ts#L27)

#### configurationNotes

> **configurationNotes**: `string` \| `null`

#### createdAt

> **createdAt**: `Date`

#### createdById

> **createdById**: `string`

#### currentWindowEndDate

> **currentWindowEndDate**: `Date`

#### historyRetentionMonths

> **historyRetentionMonths**: `number`

#### hotWindowMonthsAhead

> **hotWindowMonthsAhead**: `number`

#### id

> **id**: `string`

#### isEnabled

> **isEnabled**: `boolean`

#### lastProcessedAt

> **lastProcessedAt**: `Date`

#### lastProcessedInstanceCount

> **lastProcessedInstanceCount**: `number`

#### lastUpdatedById

> **lastUpdatedById**: `string` \| `null`

#### maxInstancesPerRun

> **maxInstancesPerRun**: `number`

#### organizationId

> **organizationId**: `string`

#### processingPriority

> **processingPriority**: `number`

#### retentionStartDate

> **retentionStartDate**: `Date`

#### updatedAt

> **updatedAt**: `Date` \| `null`
