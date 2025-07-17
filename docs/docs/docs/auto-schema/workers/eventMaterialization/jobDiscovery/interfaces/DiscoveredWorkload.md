[Admin Docs](/)

***

# Interface: DiscoveredWorkload

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:23](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/jobDiscovery.ts#L23)

## Properties

### estimatedDurationMs

> **estimatedDurationMs**: `number`

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:35](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/jobDiscovery.ts#L35)

***

### organizationId

> **organizationId**: `string`

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:24](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/jobDiscovery.ts#L24)

***

### priority

> **priority**: `number`

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:34](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/jobDiscovery.ts#L34)

***

### recurringEvents

> **recurringEvents**: `object`[]

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:26](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/jobDiscovery.ts#L26)

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

> **byDay**: `string`[]

##### recurrenceRule.byMonth

> **byMonth**: `number`[]

##### recurrenceRule.byMonthDay

> **byMonthDay**: `number`[]

##### recurrenceRule.count

> **count**: `number`

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

##### recurrenceRule.recurrenceEndDate

> **recurrenceEndDate**: `Date`

##### recurrenceRule.recurrenceRuleString

> **recurrenceRuleString**: `string`

##### recurrenceRule.recurrenceStartDate

> **recurrenceStartDate**: `Date`

##### recurrenceRule.updatedAt

> **updatedAt**: `Date`

##### recurrenceRule.updaterId

> **updaterId**: `string`

#### ruleId

> **ruleId**: `string`

***

### windowConfig

> **windowConfig**: `object`

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:25](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/workers/eventMaterialization/jobDiscovery.ts#L25)

#### configurationNotes

> **configurationNotes**: `string`

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

> **lastUpdatedById**: `string`

#### maxInstancesPerRun

> **maxInstancesPerRun**: `number`

#### organizationId

> **organizationId**: `string`

#### processingPriority

> **processingPriority**: `number`

#### retentionStartDate

> **retentionStartDate**: `Date`

#### updatedAt

> **updatedAt**: `Date`
