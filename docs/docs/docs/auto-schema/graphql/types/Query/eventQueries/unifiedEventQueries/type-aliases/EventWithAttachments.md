[Admin Docs](/)

***

# Type Alias: EventWithAttachments

> **EventWithAttachments** = `InferSelectModel`\<*typeof* [`eventsTable`](../../../../../../drizzle/tables/events/variables/eventsTable.md)\> & `object`

Defined in: [src/graphql/types/Query/eventQueries/unifiedEventQueries.ts:19](https://github.com/gautam-divyanshu/talawa-api/blob/7e7d786bbd7356b22a3ba5029601eed88ff27201/src/graphql/types/Query/eventQueries/unifiedEventQueries.ts#L19)

Type definition for events with attachments that can be either standalone or materialized

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
