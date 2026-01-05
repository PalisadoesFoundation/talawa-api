[API Docs](/)

***

# Type Alias: EventWithAttachments

> **EventWithAttachments** = `InferSelectModel`\<*typeof* [`eventsTable`](../../../../../../drizzle/tables/events/variables/eventsTable.md)\> & `object`

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L22)

Represents a unified event object that includes attachments and metadata
to distinguish between standalone and generated events.

## Type Declaration

### attachments

> **attachments**: *typeof* `eventAttachmentsTable.$inferSelect`[]

### baseRecurringEventId?

> `optional` **baseRecurringEventId**: `string`

### eventType

> **eventType**: `"standalone"` \| `"generated"`

### hasExceptions?

> `optional` **hasExceptions**: `boolean`

### isGenerated?

> `optional` **isGenerated**: `boolean`

### sequenceNumber?

> `optional` **sequenceNumber**: `number`

### totalCount?

> `optional` **totalCount**: `number` \| `null`
