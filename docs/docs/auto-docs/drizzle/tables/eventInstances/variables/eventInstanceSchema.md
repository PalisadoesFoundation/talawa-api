[API Docs](/)

***

# Variable: eventInstanceSchema

> `const` **eventInstanceSchema**: `ZodEffects`\<`BuildSchema`\<`"insert"`, \{ `baseEventId`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `endAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `hasAttachmentOverride`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `id`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `sequence`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; `startAt`: `PgColumn`\<\{ \}, \{ \}, \{ \}\>; \}, `undefined`\>, \{ `baseEventId`: `string`; `endAt`: `Date`; `hasAttachmentOverride?`: `boolean`; `id?`: `string`; `sequence`: `number`; `startAt?`: `Date`; \}, \{ `baseEventId`: `string`; `endAt`: `Date`; `hasAttachmentOverride?`: `boolean`; `id?`: `string`; `sequence`: `number`; `startAt?`: `Date`; \}\>

Defined in: [src/drizzle/tables/eventInstances.ts:81](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/drizzle/tables/eventInstances.ts#L81)
