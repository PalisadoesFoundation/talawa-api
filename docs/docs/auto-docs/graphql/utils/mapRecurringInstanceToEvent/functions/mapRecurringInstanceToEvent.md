[API Docs](/)

***

# Function: mapRecurringInstanceToEvent()

> **mapRecurringInstanceToEvent**(`instance`): [`EventWithAttachments`](../../../types/Query/eventQueries/unifiedEventQueries/type-aliases/EventWithAttachments.md)

Defined in: [src/graphql/utils/mapRecurringInstanceToEvent.ts:11](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/utils/mapRecurringInstanceToEvent.ts#L11)

Maps a recurring event instance to the internal unified EventWithAttachments format.
This is used to treat materialized instances like regular events in queries.

## Parameters

### instance

[`ResolvedRecurringEventInstance`](../../../../drizzle/tables/recurringEventInstances/type-aliases/ResolvedRecurringEventInstance.md)

The raw recurring event instance

## Returns

[`EventWithAttachments`](../../../types/Query/eventQueries/unifiedEventQueries/type-aliases/EventWithAttachments.md)

The instance mapped to an EventWithAttachments structure
