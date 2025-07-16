[Admin Docs](/)

***

# Interface: DiscoveredWorkload

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:19](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/workers/eventMaterialization/jobDiscovery.ts#L19)

## Properties

### estimatedDurationMs

> **estimatedDurationMs**: `number`

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:30](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/workers/eventMaterialization/jobDiscovery.ts#L30)

***

### organizationId

> **organizationId**: `string`

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:20](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/workers/eventMaterialization/jobDiscovery.ts#L20)

***

### priority

> **priority**: `number`

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:29](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/workers/eventMaterialization/jobDiscovery.ts#L29)

***

### recurringEvents

> **recurringEvents**: `object`[]

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:22](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/workers/eventMaterialization/jobDiscovery.ts#L22)

#### estimatedInstances

> **estimatedInstances**: `number`

#### eventId

> **eventId**: `string`

#### eventName

> **eventName**: `string`

#### isNeverEnding

> **isNeverEnding**: `boolean`

#### ruleId

> **ruleId**: `string`

***

### windowConfig

> **windowConfig**: `object`

Defined in: [src/workers/eventMaterialization/jobDiscovery.ts:21](https://github.com/gautam-divyanshu/talawa-api/blob/de42235531e11387f0ad0479547630845dbc8b37/src/workers/eventMaterialization/jobDiscovery.ts#L21)

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
