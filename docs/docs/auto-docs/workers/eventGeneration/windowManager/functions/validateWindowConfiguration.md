[API Docs](/)

***

# Function: validateWindowConfiguration()

> **validateWindowConfiguration**(`windowConfig`): `object`

Defined in: src/workers/eventGeneration/windowManager.ts:247

Validates window configuration for processing

## Parameters

### windowConfig

#### configurationNotes

`string` \| `null`

#### createdAt

`Date`

#### createdById

`string`

#### currentWindowEndDate

`Date`

#### historyRetentionMonths

`number`

#### hotWindowMonthsAhead

`number`

#### id

`string`

#### isEnabled

`boolean`

#### lastProcessedAt

`Date`

#### lastProcessedInstanceCount

`number`

#### lastUpdatedById

`string` \| `null`

#### maxInstancesPerRun

`number`

#### organizationId

`string`

#### processingPriority

`number`

#### retentionStartDate

`Date`

#### updatedAt

`Date` \| `null`

## Returns

`object`

### errors

> **errors**: `string`[]

### isValid

> **isValid**: `boolean`
