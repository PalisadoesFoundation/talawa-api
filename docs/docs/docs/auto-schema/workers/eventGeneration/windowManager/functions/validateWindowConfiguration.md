[Admin Docs](/)

***

# Function: validateWindowConfiguration()

> **validateWindowConfiguration**(`windowConfig`): `object`

Defined in: [src/workers/eventGeneration/windowManager.ts:241](https://github.com/Sourya07/talawa-api/blob/583d62db9438de398bb9012a4a2617e2cb268b08/src/workers/eventGeneration/windowManager.ts#L241)

Validates window configuration for processing

## Parameters

### windowConfig

#### configurationNotes

`null` \| `string`

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

`null` \| `string`

#### maxInstancesPerRun

`number`

#### organizationId

`string`

#### processingPriority

`number`

#### retentionStartDate

`Date`

#### updatedAt

`null` \| `Date`

## Returns

`object`

### errors

> **errors**: `string`[]

### isValid

> **isValid**: `boolean`
