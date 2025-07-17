[Admin Docs](/)

***

# Type Alias: EventWithAttachments

> **EventWithAttachments** = `InferSelectModel`\<*typeof* [`eventsTable`](../../../../../../drizzle/tables/events/variables/eventsTable.md)\> & `object`

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:20](https://github.com/gautam-divyanshu/talawa-api/blob/84910820371ade6fdca33545b3a0fc1e929731b2/src/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L20)

## Type declaration

### attachments

> **attachments**: *typeof* `eventAttachmentsTable.$inferSelect`[]

### baseRecurringEventId?

> `optional` **baseRecurringEventId**: `string`

### eventType

> **eventType**: `"standalone"` \| `"materialized"`

### hasExceptions?

> `optional` **hasExceptions**: `boolean`

### isMaterialized?

> `optional` **isMaterialized**: `boolean`

### sequenceNumber?

> `optional` **sequenceNumber**: `number`

### totalCount?

> `optional` **totalCount**: `number` \| `null`

## Description

Represents a unified event object that includes attachments and metadata
to distinguish between standalone and materialized events.
