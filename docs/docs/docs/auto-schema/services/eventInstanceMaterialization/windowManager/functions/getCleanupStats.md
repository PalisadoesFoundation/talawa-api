[Admin Docs](/)

***

# Function: getCleanupStats()

> **getCleanupStats**(`organizationId`, `drizzleClient`): `Promise`\<\{ `instancesEligibleForCleanup`: `number`; `instancesInRetentionWindow`: `number`; `retentionStartDate`: `Date`; `totalInstances`: `number`; \}\>

Defined in: [src/services/eventInstanceMaterialization/windowManager.ts:197](https://github.com/gautam-divyanshu/talawa-api/blob/22f85ff86fcf5f38b53dcdb9fe90ab33ea32d944/src/services/eventInstanceMaterialization/windowManager.ts#L197)

Gets cleanup statistics for an organization

## Parameters

### organizationId

`string`

### drizzleClient

`NodePgDatabase`\<[`drizzle/schema`](../../../../drizzle/schema/README.md)\>

## Returns

`Promise`\<\{ `instancesEligibleForCleanup`: `number`; `instancesInRetentionWindow`: `number`; `retentionStartDate`: `Date`; `totalInstances`: `number`; \}\>
