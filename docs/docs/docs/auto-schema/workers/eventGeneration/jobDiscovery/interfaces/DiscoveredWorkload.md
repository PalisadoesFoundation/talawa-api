[Admin Docs](/)

***

# Interface: DiscoveredWorkload

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:25](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/workers/eventGeneration/jobDiscovery.ts#L25)

Represents a discovered workload for a single organization, including all
recurring events that require EventGeneration.

## Properties

### estimatedDurationMs

> **estimatedDurationMs**: `number`

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:37](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/workers/eventGeneration/jobDiscovery.ts#L37)

***

### organizationId

> **organizationId**: `string`

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:26](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/workers/eventGeneration/jobDiscovery.ts#L26)

***

### priority

> **priority**: `number`

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:36](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/workers/eventGeneration/jobDiscovery.ts#L36)

***

### recurringEvents

> **recurringEvents**: `object`[]

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:28](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/workers/eventGeneration/jobDiscovery.ts#L28)

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

> **byDay**: `null` \| `string`[]

##### recurrenceRule.byMonth

> **byMonth**: `null` \| `number`[]

##### recurrenceRule.byMonthDay

> **byMonthDay**: `null` \| `number`[]

##### recurrenceRule.count

> **count**: `null` \| `number`

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

> **originalSeriesId**: `null` \| `string`

##### recurrenceRule.recurrenceEndDate

> **recurrenceEndDate**: `null` \| `Date`

##### recurrenceRule.recurrenceRuleString

> **recurrenceRuleString**: `string`

##### recurrenceRule.recurrenceStartDate

> **recurrenceStartDate**: `Date`

##### recurrenceRule.updatedAt

> **updatedAt**: `null` \| `Date`

##### recurrenceRule.updaterId

> **updaterId**: `null` \| `string`

#### ruleId

> **ruleId**: `string`

***

### windowConfig

> **windowConfig**: `object`

Defined in: [src/workers/eventGeneration/jobDiscovery.ts:27](https://github.com/Sourya07/talawa-api/blob/61a1911602b2f0aac7635e08ae2918f4f768e8ff/src/workers/eventGeneration/jobDiscovery.ts#L27)

#### configurationNotes

> **configurationNotes**: `null` \| `string`

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

> **lastUpdatedById**: `null` \| `string`

#### maxInstancesPerRun

> **maxInstancesPerRun**: `number`

#### organizationId

> **organizationId**: `string`

#### processingPriority

> **processingPriority**: `number`

#### retentionStartDate

> **retentionStartDate**: `Date`

#### updatedAt

> **updatedAt**: `null` \| `Date`
