[API Docs](/)

***

# Interface: GetRecurringEventInstancesInput

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:29](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L29)

Defines the input parameters for querying recurring event instances.

## Properties

### endDate

> **endDate**: `Date`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:32](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L32)

***

### excludeInstanceIds?

> `optional` **excludeInstanceIds**: `string`[]

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:49](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L49)

Optional array of instance IDs to exclude from the results.
Useful for filtering out specific instances that should not be returned,
such as instances that have already been processed or displayed.

***

### includeCancelled?

> `optional` **includeCancelled**: `boolean`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:33](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L33)

***

### limit?

> `optional` **limit**: `number`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:38](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L38)

Optional maximum number of instances to return (defaults to 1000).
Must be a positive integer.

***

### offset?

> `optional` **offset**: `number`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:43](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L43)

Optional number of instances to skip (defaults to 0).
Must be a non-negative integer.

***

### organizationId

> **organizationId**: `string`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:30](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L30)

***

### startDate

> **startDate**: `Date`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:31](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L31)
