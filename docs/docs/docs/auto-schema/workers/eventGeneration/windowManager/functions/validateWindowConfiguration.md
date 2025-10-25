[Admin Docs](/)

***

# Function: validateWindowConfiguration()

> **validateWindowConfiguration**(`windowConfig`): `object`

Defined in: [src/workers/eventGeneration/windowManager.ts:241](https://github.com/Sourya07/talawa-api/blob/4e4298c85a0d2c28affa824f2aab7ec32b5f3ac5/src/workers/eventGeneration/windowManager.ts#L241)

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
