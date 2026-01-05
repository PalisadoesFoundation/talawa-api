[API Docs](/)

***

# Interface: FilterInviteOnlyEventsInput

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:47](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L47)

Parameters for filtering events based on invite-only visibility rules.

## Properties

### currentUserId

> **currentUserId**: `string`

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:49](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L49)

***

### currentUserOrgMembership

> **currentUserOrgMembership**: \{ `role`: `string`; \} \| `Map`\<`string`, \{ `role`: `string`; \} \| `undefined`\> \| `undefined`

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:56](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L56)

Either a single organization membership (for single-org queries) or
a map of organization IDs to memberships (for cross-org queries).
If a map is provided, it will be used to look up membership per event.

***

### currentUserRole

> **currentUserRole**: `string`

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:50](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L50)

***

### drizzleClient

> **drizzleClient**: `NodePgDatabase`\<[API Docs](/)\>

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:60](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L60)

***

### events

> **events**: [`EventWithAttachments`](../type-aliases/EventWithAttachments.md)[]

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:48](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L48)
