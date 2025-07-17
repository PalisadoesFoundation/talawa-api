[Admin Docs](/)

***

# Function: validateWindowConfiguration()

> **validateWindowConfiguration**(`windowConfig`): `object`

Defined in: [src/workers/eventMaterialization/windowManager.ts:250](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/workers/eventMaterialization/windowManager.ts#L250)

Validates window configuration for processing

## Parameters

### windowConfig

#### configurationNotes

`string`

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

`string`

#### maxInstancesPerRun

`number`

#### organizationId

`string`

#### processingPriority

`number`

#### retentionStartDate

`Date`

#### updatedAt

`Date`

## Returns

`object`

### errors

> **errors**: `string`[]

### isValid

> **isValid**: `boolean`
