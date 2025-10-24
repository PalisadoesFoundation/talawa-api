[Admin Docs](/)

***

# Variable: userNotificationSchema

> `const` **userNotificationSchema**: `ZodObject`\<\{ `createdAt`: `ZodDate`; `eventType`: `ZodString`; `id`: `ZodString`; `isRead`: `ZodBoolean`; `navigation`: `ZodNullable`\<`ZodString`\>; `readAt`: `ZodNullable`\<`ZodDate`\>; `renderedContent`: `ZodObject`\<\{ `body`: `ZodOptional`\<`ZodString`\>; `title`: `ZodOptional`\<`ZodString`\>; \}, `"passthrough"`, `ZodTypeAny`, `objectOutputType`\<\{ `body`: `ZodOptional`\<`ZodString`\>; `title`: `ZodOptional`\<`ZodString`\>; \}, `ZodTypeAny`, `"passthrough"`\>, `objectInputType`\<\{ `body`: `ZodOptional`\<`ZodString`\>; `title`: `ZodOptional`\<`ZodString`\>; \}, `ZodTypeAny`, `"passthrough"`\>\>; \}, `"strip"`, `ZodTypeAny`, \{ `createdAt`: `Date`; `eventType`: `string`; `id`: `string`; `isRead`: `boolean`; `navigation`: `null` \| `string`; `readAt`: `null` \| `Date`; `renderedContent`: `object` & `object`; \}, \{ `createdAt`: `Date`; `eventType`: `string`; `id`: `string`; `isRead`: `boolean`; `navigation`: `null` \| `string`; `readAt`: `null` \| `Date`; `renderedContent`: `object` & `object`; \}\>

Defined in: [src/graphql/types/Notification/NotificationResponse.ts:4](https://github.com/Sourya07/talawa-api/blob/3df16fa5fb47e8947dc575f048aef648ae9ebcf8/src/graphql/types/Notification/NotificationResponse.ts#L4)
