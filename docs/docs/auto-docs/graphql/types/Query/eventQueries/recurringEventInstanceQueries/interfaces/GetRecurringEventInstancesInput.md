[API Docs](/)

***

# Interface: GetRecurringEventInstancesInput

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:33](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L33)

Defines the input parameters for querying recurring event instances.

## Properties

### endDate

> **endDate**: `Date`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:36](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L36)

***

### excludeInstanceIds?

> `optional` **excludeInstanceIds?**: `string`[]

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:53](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L53)

Optional array of instance IDs to exclude from the results.
Useful for filtering out specific instances that should not be returned,
such as instances that have already been processed or displayed.

***

### includeCancelled?

> `optional` **includeCancelled?**: `boolean`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:37](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L37)

***

### limit?

> `optional` **limit?**: `number`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:42](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L42)

Optional maximum number of instances to return (defaults to 1000).
Must be a positive integer.

***

### offset?

> `optional` **offset?**: `number`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:47](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L47)

Optional number of instances to skip (defaults to 0).
Must be a non-negative integer.

***

### organizationId

> **organizationId**: `string`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:34](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L34)

***

### startDate

> **startDate**: `Date`

Defined in: [src/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts:35](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/recurringEventInstanceQueries.ts#L35)
